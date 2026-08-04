"""
Penrose meal planner - one-off migration from the 2014 Google Sheet.

Reads raw_recipes.txt (verbatim sheet export) and emits:
  ingredients.json  - canonical ingredient list
  recipes.json      - recipes with structured ingredient lines
  review.md         - decisions that need a human eye

Run once. Not part of the application.
"""

import json
import re
from collections import OrderedDict, defaultdict
from pathlib import Path

HERE = Path(__file__).parent

# --------------------------------------------------------------------------
# Store categories, in physical aisle order
# --------------------------------------------------------------------------

CATEGORIES = [
    "Fruit & Veg",
    "Herbs",
    "Dairy",
    "Meat",
    "Bakery",
    "Drinks",
    "Cereal",
    "Nuts & Seeds",
    "World Foods",
    "Tinned",
    "Frozen",
]

# --------------------------------------------------------------------------
# Canonical ingredients.
#   key    = canonical display name (plural by default for countables,
#            singular for mass nouns)
#   value  = (category, frozen, pantry_staple, [aliases])
# --------------------------------------------------------------------------

CANON = OrderedDict([
    # --- Fruit & Veg -----------------------------------------------------
    ("aubergines",        ("Fruit & Veg", False, False, ["aubergine"])),
    ("baby aubergines",   ("Fruit & Veg", False, False, ["baby aubergine"])),
    ("avocados",          ("Fruit & Veg", False, False, ["avocado"])),
    ("asparagus",         ("Fruit & Veg", False, False, [])),
    ("baby corn",         ("Fruit & Veg", False, False, [])),
    ("beansprouts",       ("Fruit & Veg", False, False, [])),
    ("beetroot",          ("Fruit & Veg", False, False, [])),
    ("broccol",           ("Fruit & Veg", False, False, ["broccoli"])),
    ("broccolini",        ("Fruit & Veg", False, False, [])),
    ("brussel sprouts",   ("Fruit & Veg", False, False, [])),
    ("butternut squash",  ("Fruit & Veg", False, False, [])),
    ("cabbage",           ("Fruit & Veg", False, False, [])),
    ("savoy cabbage",     ("Fruit & Veg", False, False, [])),
    ("red cabbage",       ("Fruit & Veg", False, False, [])),
    ("carrots",           ("Fruit & Veg", False, False, ["carrot"])),
    ("cauliflower",       ("Fruit & Veg", False, False, [])),
    ("celeriac",          ("Fruit & Veg", False, False, [])),
    ("celery",            ("Fruit & Veg", False, False, [])),
    ("courgettes",        ("Fruit & Veg", False, False, ["courgette"])),
    ("cucumbers",         ("Fruit & Veg", False, False, ["cucumber"])),
    ("garlic cloves",     ("Fruit & Veg", False, False, ["garlic clove", "garlic"])),
    ("ginger",            ("Fruit & Veg", False, False, [])),
    ("greens",            ("Fruit & Veg", False, False, [])),
    ("green beans",       ("Fruit & Veg", False, False, [])),
    ("kale",              ("Fruit & Veg", False, False, [])),
    ("lemons",            ("Fruit & Veg", False, False, ["lemon"])),
    ("limes",             ("Fruit & Veg", False, False, ["lime"])),
    ("mangetout",         ("Fruit & Veg", False, False, [])),
    ("marrow",            ("Fruit & Veg", False, False, [])),
    ("mushrooms",         ("Fruit & Veg", False, False, ["mushroom"])),
    ("jumbo mushrooms",   ("Fruit & Veg", False, False, [])),
    ("onions",            ("Fruit & Veg", False, False, ["onion"])),
    ("red onions",        ("Fruit & Veg", False, False, ["red onion"])),
    ("spring onions",     ("Fruit & Veg", False, False, ["spring onion"])),
    ("shallots",          ("Fruit & Veg", False, False, ["shallot"])),
    ("oranges",           ("Fruit & Veg", False, False, ["orange"])),
    ("pak choi",          ("Fruit & Veg", False, False, [])),
    ("peppers",           ("Fruit & Veg", False, False, ["pepper"])),
    ("potatoes",          ("Fruit & Veg", False, False, ["potato"])),
    ("jacket potatoes",   ("Fruit & Veg", False, False, ["jacket potato"])),
    ("new potatoes",      ("Fruit & Veg", False, False, [])),
    ("radicchio",         ("Fruit & Veg", False, False, [])),
    ("radishes",          ("Fruit & Veg", False, False, ["radish"])),
    ("red chillies",      ("Fruit & Veg", False, False, ["red chili", "red chilli"])),
    ("spinach",           ("Fruit & Veg", False, False, ["fresh spinach"])),
    ("stir fry veg",      ("Fruit & Veg", False, False, [])),
    ("swede",             ("Fruit & Veg", False, False, [])),
    ("sweet potatoes",    ("Fruit & Veg", False, False, ["sweet potato"])),
    ("tomatoes",          ("Fruit & Veg", False, False, ["tomato", "large tomatoes"])),
    ("cherry tomatoes",   ("Fruit & Veg", False, False, [])),
    ("turnip",            ("Fruit & Veg", False, False, [])),

    # --- Herbs (fresh; soft herbs are not treated as staples) ------------
    ("basil",             ("Herbs", False, False, [])),
    ("coriander",         ("Herbs", False, False, [])),
    ("dill",              ("Herbs", False, False, [])),
    ("mint",              ("Herbs", False, False, [])),
    ("parsley",           ("Herbs", False, False, [])),
    ("rosemary",          ("Herbs", False, True,  [])),
    ("sage",              ("Herbs", False, True,  [])),
    ("thyme",             ("Herbs", False, True,  [])),
    ("cumin",             ("Herbs", False, True,  [])),

    # --- Dairy -----------------------------------------------------------
    ("butter",            ("Dairy", False, True,  ["unsalted butter"])),
    ("burrata",           ("Dairy", False, False, [])),
    ("cheddar",           ("Dairy", False, False, [])),
    ("cottage cheese",    ("Dairy", False, False, [])),
    ("cream",             ("Dairy", False, False, [])),
    ("eggs",              ("Dairy", False, False, ["egg"])),
    ("feta",              ("Dairy", False, False, [])),
    ("goat's cheese",     ("Dairy", False, False, [])),
    ("halloumi",          ("Dairy", False, False, [])),
    ("mascarpone",        ("Dairy", False, False, [])),
    ("milk",              ("Dairy", False, False, [])),
    ("mozzarella",        ("Dairy", False, False, [])),
    ("parmesan",          ("Dairy", False, False, [])),
    ("red leicester",     ("Dairy", False, False, [])),
    ("ricotta",           ("Dairy", False, False, [])),
    ("soft cheese",       ("Dairy", False, False, [])),
    ("yoghurt",           ("Dairy", False, False, [])),

    # --- Meat & meat substitutes -----------------------------------------
    ("bacon",             ("Meat", False, False, [])),
    ("beef",              ("Meat", False, False, [])),
    ("beef mince",        ("Meat", False, False, [])),
    ("burgers",           ("Meat", False, False, [])),
    ("chicken",           ("Meat", False, False, ["chicken (leftover)", "chicken (whole)"])),
    ("chorizo",           ("Meat", False, False, [])),
    ("ham",               ("Meat", False, False, [])),
    ("lamb breast",       ("Meat", False, False, [])),
    ("lamb mince",        ("Meat", False, False, [])),
    ("lardons",           ("Meat", False, False, ["vegan lardons"])),
    ("meatballs",         ("Meat", False, False, [])),
    ("meat alternative",  ("Meat", False, False, [])),
    ("pepperoni",         ("Meat", False, False, [])),
    ("sausages",          ("Meat", False, False, ["sausage"])),
    ("tempeh",            ("Meat", False, False, [])),
    ("tofu",              ("Meat", False, False, [])),
    ("tuna",              ("Meat", False, False, [])),

    # --- Bakery ----------------------------------------------------------
    ("chapatti",          ("Bakery", False, False, [])),
    ("gnocchi",           ("Bakery", False, False, [])),
    ("pita",              ("Bakery", False, False, [])),
    ("rolls",             ("Bakery", False, False, ["roll"])),
    ("tortelloni",        ("Bakery", False, False, [])),
    ("tortillas",         ("Bakery", False, False, ["tortilla"])),
    ("fake pasta",        ("Bakery", False, False, [])),

    # --- Cereal / dry goods ----------------------------------------------
    ("dried cannelloni tubes", ("Cereal", False, False, [])),
    ("orzo",              ("Cereal", False, False, [])),
    ("paella rice",       ("Cereal", False, False, [])),
    ("pasta",             ("Cereal", False, False, [])),
    ("pearl barley",      ("Cereal", False, False, [])),
    ("polenta",           ("Cereal", False, False, [])),
    ("quinoa",            ("Cereal", False, False, [])),
    ("rice",              ("Cereal", False, False, [])),
    ("rice noodles",      ("Cereal", False, False, [])),
    ("risotto rice",      ("Cereal", False, False, [])),

    # --- Nuts & Seeds ----------------------------------------------------
    ("almonds",           ("Nuts & Seeds", False, False, [])),
    ("hazelnuts",         ("Nuts & Seeds", False, False, [])),
    ("pine nuts",         ("Nuts & Seeds", False, False, [])),
    ("pumpkin seeds",     ("Nuts & Seeds", False, True,  [])),
    ("sunflower seeds",   ("Nuts & Seeds", False, True,  [])),
    ("sesame seeds",      ("Nuts & Seeds", False, True,  [])),

    # --- World Foods (pastes, spice mixes - nearly all staples) ----------
    ("fajita spice mix",  ("World Foods", False, True, ["fajita spice", "fajita"])),
    ("gochujang paste",   ("World Foods", False, True, [])),
    ("green curry paste", ("World Foods", False, True, ["thai green curry paste"])),
    ("harissa paste",     ("World Foods", False, True, [])),
    ("korma paste",       ("World Foods", False, True, [])),
    ("massaman paste",    ("World Foods", False, True, [])),
    ("miso",              ("World Foods", False, True, [])),
    ("red curry paste",   ("World Foods", False, True, [])),
    ("tikka curry paste", ("World Foods", False, True, [])),
    ("sweet chilli sauce",("World Foods", False, True, [])),
    ("pomegranate molasses", ("World Foods", False, True, [])),

    # --- Tinned / jarred / ambient ---------------------------------------
    ("almond butter",     ("Tinned", False, True,  [])),
    ("artichokes",        ("Tinned", False, False, [])),
    ("baked beans",       ("Tinned", False, False, [])),
    ("black beans",       ("Tinned", False, False, [])),
    ("black olives",      ("Tinned", False, True,  [])),
    ("borlotti beans",    ("Tinned", False, False, [])),
    ("broad beans",       ("Tinned", False, False, [])),
    ("butter beans",      ("Tinned", False, False, ["butterbeans"])),
    ("cannellini beans",  ("Tinned", False, False, [])),
    ("capers",            ("Tinned", False, True,  [])),
    ("chestnuts",         ("Tinned", False, False, [])),
    ("chickpeas",         ("Tinned", False, False, [])),
    ("chopped tomatoes",  ("Tinned", False, False, [])),
    ("coconut milk",      ("Tinned", False, False, [])),
    ("english mustard",   ("Tinned", False, True,  [])),
    ("green olives",      ("Tinned", False, True,  [])),
    ("green pesto",       ("Tinned", False, True,  ["pesto"])),
    ("red pesto",         ("Tinned", False, True,  [])),
    ("haricot beans",     ("Tinned", False, False, [])),
    ("jackfruit",         ("Tinned", False, False, [])),
    ("kidney beans",      ("Tinned", False, False, [])),
    ("lemon juice",       ("Tinned", False, True,  [])),
    ("lentils",           ("Tinned", False, False, [])),
    ("mayonnaise",        ("Tinned", False, True,  [])),
    ("pasta sauce",       ("Tinned", False, False, [])),
    ("pinto beans",       ("Tinned", False, False, [])),
    ("ratatouille",       ("Tinned", False, False, [])),
    ("refried beans",     ("Tinned", False, False, [])),
    ("roasted red peppers", ("Tinned", False, False, [])),
    ("salsa",             ("Tinned", False, True,  [])),
    ("sun dried tomatoes",("Tinned", False, False, [])),
    ("sun dried tomato paste", ("Tinned", False, True, [])),
    ("sweetcorn",         ("Tinned", False, False, [])),
    ("tinned new potatoes", ("Tinned", False, False, [])),
    ("tomato purée",      ("Tinned", False, True,  [])),

    # --- Frozen ----------------------------------------------------------
    ("spinach|frozen",    ("Frozen", True,  False, ["frozen spinach"])),
    ("peas|frozen",       ("Frozen", True,  False, ["frozen peas", "peas"])),
    ("mushroom medley|frozen", ("Frozen", True, False, ["frozen mushroom medley"])),
    ("mashed potato|frozen", ("Frozen", True, False, ["frozen mash", "mashed potato"])),
    ("sweet potato mash|frozen", ("Frozen", True, False, ["sweet potato mash"])),
    ("cauliflower rice|frozen", ("Frozen", True, False, ["cauliflower rice"])),
    ("roast veg|frozen",  ("Frozen", True,  False, ["roast veg"])),
    ("bean burgers|frozen", ("Frozen", True, False, ["bean burgers"])),
    ("veggie fingers|frozen", ("Frozen", True, False, ["veggie fingers"])),
    ("veggie sausages|frozen", ("Frozen", True, False, ["veggie sausage", "veggie sausages"])),
    ("vegetarian meatballs|frozen", ("Frozen", True, False, ["vegetarian meatballs"])),
    ("fish cakes|frozen", ("Frozen", True,  False, ["fish cakes"])),
    ("falafel|frozen",    ("Frozen", True,  False, ["falafel"])),
    ("dim sum|frozen",    ("Frozen", True,  False, ["dim sum"])),
    ("pizza|frozen",      ("Frozen", True,  False, ["pizza"])),
    ("jelly pack",        ("Frozen", False, False, [])),
])

# --------------------------------------------------------------------------
# Unit normalisation
# --------------------------------------------------------------------------

UNIT_MAP = {
    "g": "g", "kg": "kg", "ml": "ml", "l": "l",
    "tsp": "tsp", "tsps": "tsp", "teaspoon": "tsp", "teaspoons": "tsp",
    "tbsp": "tbsp", "tbsps": "tbsp", "tablespoon": "tbsp", "tablespoons": "tbsp",
    "bag": "bag", "bags": "bag",
    "tin": "tin", "tins": "tin", "can": "tin", "cans": "tin",
    "tub": "tub", "tubs": "tub",
    "pack": "pack", "packs": "pack", "packet": "pack", "packets": "pack",
    "stalk": "stalk", "stalks": "stalk", "stick": "stalk", "sticks": "stalk",
    "rasher": "rasher", "rashers": "rasher",
    "breast": "breast", "breasts": "breast",
    "slice": "slice", "slices": "slice",
    "portion": "portion", "portions": "portion",
    "bulb": "bulb", "bulbs": "bulb",
    "punnet": "punnet", "punnets": "punnet",
}

# unit -> dimension. Quantities only sum within a dimension.
DIMENSION = {
    "g": "mass", "kg": "mass",
    "ml": "volume", "l": "volume", "tsp": "volume", "tbsp": "volume",
}  # everything else falls through to "count" keyed by the unit itself

QTY_RE = re.compile(r"^\s*([0-9]*\.?[0-9]+)?\s*([a-zA-Z]+)?\s*$")


def parse_quantity(raw):
    """'550g' -> (550, 'g'). '0.5 bags' -> (0.5, 'bag'). '2' -> (2, None).
    '' -> (None, None). Unrecognised -> (None, None) plus a warning."""
    if raw is None:
        return None, None, None
    raw = raw.strip()
    if not raw:
        return None, None, None
    m = QTY_RE.match(raw)
    if not m:
        return None, None, f"unparsed quantity: {raw!r}"
    amount, unit = m.group(1), m.group(2)
    amount = float(amount) if amount else None
    if unit:
        key = unit.lower()
        if key not in UNIT_MAP:
            return amount, None, f"unknown unit {unit!r} in {raw!r}"
        unit = UNIT_MAP[key]
    return amount, unit, None


# --------------------------------------------------------------------------
# Build lookup
# --------------------------------------------------------------------------

ALIAS = {}


def _register(key, canon):
    """First definition wins. Frozen variants must not steal the bare base
    name from a fresh ingredient of the same name (e.g. spinach)."""
    key = key.lower()
    if key in ALIAS and ALIAS[key] != canon:
        warnings.append(f"alias collision: {key!r} already -> {ALIAS[key]!r}, "
                        f"ignoring {canon!r}")
        return
    ALIAS[key] = canon


warnings = []
for canon, (_cat, _fz, _st, aliases) in CANON.items():
    _register(canon, canon)
    if "|" not in canon:
        _register(canon.split("|")[0], canon)
    for a in aliases:
        _register(a, canon)


def slugify(canon):
    base = canon.replace("|", "-")
    base = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    return base


MEAT_WORDS = {
    "bacon", "beef", "beef mince", "burgers", "chicken", "chorizo", "ham",
    "lamb breast", "lamb mince", "lardons", "meatballs", "pepperoni",
    "sausages", "tuna",
}

# --------------------------------------------------------------------------
# Parse recipes
# --------------------------------------------------------------------------

recipes = []
used = set()

lines = [l for l in (HERE / "raw_recipes.txt").read_text().splitlines() if l.strip()]

for lineno, line in enumerate(lines, 1):
    parts = [p.strip() for p in line.split("::")]
    if len(parts) < 7:
        warnings.append(f"line {lineno}: only {len(parts)} fields, skipped")
        continue
    name, exclude, ing_raw, servings, keto, veg, time, *rest = parts
    method = rest[0].strip() if rest else ""

    ing_lines = []
    for token in ing_raw.split(","):
        token = token.strip()
        if not token:
            continue
        if "|" in token:
            iname, qty = token.split("|", 1)
        else:
            iname, qty = token, ""
        iname = iname.strip().lower()
        canon = ALIAS.get(iname)
        if not canon:
            warnings.append(f"{name}: unmapped ingredient {iname!r}")
            continue
        amount, unit, warn = parse_quantity(qty)
        if warn:
            warnings.append(f"{name} / {iname}: {warn}")
        used.add(canon)
        ing_lines.append({
            "ingredient": slugify(canon),
            "amount": amount,
            "unit": unit,
        })

    veg_flag = veg.strip().lower() == "yes"
    has_meat = any(
        CANON[ALIAS[l["ingredient"].replace("-", " ")]][0] if False else False
        for l in ing_lines
    )
    # simpler: check slugs against meat set
    meat_slugs = {slugify(m) for m in MEAT_WORDS}
    has_meat = any(l["ingredient"] in meat_slugs for l in ing_lines)
    if veg_flag and has_meat:
        warnings.append(f"{name}: flagged vegetarian but contains meat - flag set to False")
        veg_flag = False

    try:
        time_hours = float(time) if time.strip() else None
    except ValueError:
        time_hours = None
        warnings.append(f"{name}: unparsed time {time!r}")

    recipes.append({
        "slug": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
        "name": name,
        "servings": int(servings) if servings.strip() else 2,
        "vegetarian": veg_flag,
        "keto": keto.strip().lower() == "yes",
        "archived": exclude.strip().upper() == "TRUE",
        "timeHours": time_hours,
        "sourceUrl": method if method.startswith("http") else None,
        "method": None if method.startswith("http") else (method or None),
        "ingredients": ing_lines,
    })

# --------------------------------------------------------------------------
# Emit ingredients
# --------------------------------------------------------------------------

ingredients = []
for canon, (cat, frozen, staple, aliases) in CANON.items():
    display = canon.split("|")[0]
    ingredients.append({
        "slug": slugify(canon),
        "name": display,
        "category": cat,
        "categoryOrder": CATEGORIES.index(cat) + 1,
        "frozen": frozen,
        "pantryStaple": staple,
        "aliases": aliases,
        "packSize": None,
        "packUnit": None,
    })

categories = [{"name": c, "order": i + 1} for i, c in enumerate(CATEGORIES)]

(HERE / "ingredients.json").write_text(
    json.dumps({"categories": categories, "ingredients": ingredients}, indent=2, ensure_ascii=False)
)
(HERE / "recipes.json").write_text(json.dumps(recipes, indent=2, ensure_ascii=False))

# --------------------------------------------------------------------------
# Review report
# --------------------------------------------------------------------------

unused = [i["name"] for i in ingredients if i["slug"] not in {
    l["ingredient"] for r in recipes for l in r["ingredients"]}]

units_seen = defaultdict(set)
for r in recipes:
    for l in r["ingredients"]:
        if l["unit"]:
            units_seen[l["unit"]].add(r["name"])

report = ["# Migration review\n"]
report.append(f"- {len(recipes)} recipes, {len(ingredients)} canonical ingredients")
report.append(f"- {sum(1 for r in recipes if r['archived'])} archived")
report.append(f"- {sum(1 for r in recipes if r['keto'])} flagged keto")
report.append(f"- {sum(1 for r in recipes if r['vegetarian'])} vegetarian")
report.append(f"- {sum(1 for i in ingredients if i['pantryStaple'])} pantry staples")
report.append(f"- units in use: {', '.join(sorted(units_seen))}\n")
report.append("## Warnings\n")
report += [f"- {w}" for w in warnings] or ["- none"]
report.append("\n## Ingredients defined but never used\n")
report += [f"- {u}" for u in unused] or ["- none"]
(HERE / "review.md").write_text("\n".join(report))

print(f"recipes: {len(recipes)}  ingredients: {len(ingredients)}  warnings: {len(warnings)}")
