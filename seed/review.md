# Migration review

- 170 recipes, 179 canonical ingredients
- 57 archived
- 73 flagged keto
- 125 vegetarian
- 0 pantry staples (cleared: suppression was causing more issues than it solved)
- units in use: bag, breast, g, ml, pack, rasher, slice, stalk, tbsp, tin, tsp, tub

## Warnings

- Courgette Lasagne: flagged vegetarian but contains meat - flag set to False
- Courgetti Bolognese: flagged vegetarian but contains meat - flag set to False
- Egg fried cauliflower rice: flagged vegetarian but contains meat - flag set to False
- Pasta Bolognese: flagged vegetarian but contains meat - flag set to False
- Tortilla Pizzas: flagged vegetarian but contains meat - flag set to False
- Courgetti & Meatballs (small): flagged vegetarian but contains meat - flag set to False
- Sausage casserole: flagged vegetarian but contains meat - flag set to False

## Ingredients defined but never used

- beef
- chestnuts
- jackfruit
- mayonnaise

## Unit harmonisation

Shoppable "some" lines were given a typical amount in a preferred unit. Herbs, pantry staples,
ginger, and a splash of cream stay "some". Mixed leftover buckets render as a comma-separated
list on the shopping list, with "some" last.

Judgement calls:

- Tinned goods (beans, chopped tomatoes, coconut milk, tuna, sweetcorn) are tins. Chopped
  tomatoes 800g became 2 tins. Potato and egg salad's `potatoes` + 1 tin was retagged to
  `tinned-new-potatoes`.
- Whole produce is a bare count. 100g is one medium onion, carrot, or tomato; peppers under
  80g are half a pepper; a garlic bulb is 10 cloves; 100g celery is 2 stalks. Shepherds Pie
  celery stays 1 pack.
- Cherry tomato 0.5 / 1 with no unit were punnets (125g / 250g). Spinach bags are 200g.
  Yoghurt tablespoons are 15g. Cream grams became millilitres. A mozzarella ball is 125g.
  Ricotta 250g is 1 tub.
- Sunday roast chicken "some" is 1 whole bird. Hit N Run 6 portions became 6 breasts. Gram
  chicken lines were left as grams.
- Feta 0.5 is half a pack. Tofu "some" is 1 pack.
- Tofu tikka had onions twice (1 and 100g); the gram line was dropped.
- Remaining mixed units, shown as-is on the list: potatoes and sweet potatoes (count vs
  grams), chicken (breast vs whole vs grams), celery (stalk vs pack), feta / tofu /
  stir-fry veg (pack vs grams), green pesto (grams vs spoons, a staple).
