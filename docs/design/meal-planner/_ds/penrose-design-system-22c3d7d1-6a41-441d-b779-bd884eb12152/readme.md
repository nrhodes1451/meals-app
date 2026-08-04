# Penrose Design System

Penrose is the design system for a household of two. It dresses personal tools — dashboards, ledgers, lists, small web apps — built for daily use rather than for an audience. **Modern art deco:** geometric, symmetrical, high-contrast, unfussy. Named after the street, and after the tiling.

These are private tools, not products. No onboarding, no marketing, no feature discovery, no stock photography.

## Sources

This system was authored **from a written brief only**. No codebase, Figma file, deck, logo, or font binary was supplied. Every value below comes from that brief; anything not specified there (component inventory, screen composition, icon set) was authored to fit and is flagged as such.

- Codebase: none provided
- Figma: none provided
- Brand assets / logo: none provided — see *Brand mark* below
- Fonts: Roboto + Roboto Condensed named in the brief; no licensed files supplied, so they are loaded from Google Fonts (`tokens/fonts.css`). **Send local font files if you want them self-hosted.**

## Products

Two surfaces are recreated as UI kits, both drawn from the brief's description of the tools rather than from an existing product:

- **Household** (`ui_kits/household/`) — today's list, recurring house jobs, settings.
- **Ledger** (`ui_kits/ledger/`) — spending entries with a detail panel, a new-entry form, and the meter log.

---

## CONTENT FUNDAMENTALS

**Who is speaking.** The tool, flatly, to two people who already know how it works. There is no brand voice and no personality layer.

**Person.** Prefer no pronoun at all. Label the thing: "Amount", "Paid by", "Read on the 1st". Where a pronoun is unavoidable, use *you* sparingly and never *we* — there is no company here. Household members are named or initialled ("A", "B", "Either"), never "user".

**Casing.** Two registers, no third:
- Display / headings / labels / buttons / table headers: **UPPERCASE**, Roboto Condensed, tracked.
- Everything else: **sentence case**. Never Title Case, ever.

**Length.** Copy is short and finished. "Entry saved." not "Your entry has been saved successfully!" Full stops on sentences; no full stop on a label.

**Tone examples**
- Button: `SAVE ENTRY` / `RECORD` / `ADD JOB` — verb + object, no "Let's" or "Get started"
- Confirmation: "Entry saved." / "Reading recorded."
- Destructive confirm: "This removes the entry from the ledger. There is no undo."
- Empty state: "Nothing matches that." — one line, no illustration, no suggestion
- Hint: "Rounded to the nearest pound." / "Photograph the dial."
- Error: "Numbers only." — say what to do, don't apologise

**Never.** Emoji. Exclamation marks. "Oops". "Awesome". Motivational streaks. Marketing adjectives. Onboarding tours. Tips-and-tricks. Anything that assumes an audience.

**Numbers.** Figures are the content in most of these screens: show them large, tabular, and unrounded where accuracy matters. Currency codes are set as a light label beside the figure (`284.40 GBP`), not as a glyph crammed into it.

---

## VISUAL FOUNDATIONS

**Palette — fixed roles.** Never use a colour outside its role. See `tokens/colors.css` and the Colors cards.

| Role | Hex | Use |
| --- | --- | --- |
| ink | `#2F3D32` | body text, dark surfaces. A near-black green — this, not pure black |
| hard-black | `#000000` | focus rings and fine geometric linework only |
| paper | `#FFFFFF` | cards, panels, list surfaces |
| ground | `#FFFFFF` | the page canvas — plain white |
| primary | `#7A104E` | buttons, active state, links, primary geometry |
| primary-lift | `#C23585` | hover, secondary emphasis, 18px+ text only |
| primary-tint | `#FFCCE9` | selected rows, badges, soft fills |
| accent-blush | `#FEE5D5` | the softest step of the warm ramp — a quiet red for tinted surfaces, fills and geometry. Never a page background |
| accent-hot | `#EB4414` | fill / geometry |
| accent | `#F99B1D` | fill / geometry, also warning |
| accent-soft | `#FBAE42` | fill / geometry |
| accent-gold | `#E9CB4F` | the deco metallic — thin rules, dividers, hairlines |
| success | `#446048` | |
| danger | `#C01B2F` | destructive |

**Colour discipline.** Any single screen uses white + ink + **one** accent family. Gold is the only colour permitted alongside another accent, and only as hairline rules. There is no blue and none may be invented; informational states are ink on primary-tint.

**Contrast — non-negotiable.** Body text is ink or primary only. `EB4414`, `F99B1D`, `FBAE42`, `E9CB4F` never carry text on a light background — they are fills, and text on top of them is ink. `C23585` is for 18px+ and UI elements, not body copy. 4.5:1 minimum everywhere; these interfaces get used in poor lighting.

**Type.** Roboto throughout; Roboto Condensed for display and headings. Headings uppercase, 0.08–0.12em tracking, weight 700–900. Body sentence case, 400, normal tracking, 1.5 line height. Hard weight contrast only — pair Thin/Light with Bold/Black, avoid 400–600 in display roles. Tabular numerals wherever figures align in a column.

**Spacing and layout.** 8px scale (4px half-step). Dense and utilitarian — these are tools used at speed by people who already know them. Thin rules do all the dividing work: prefer a rule over a card, and a card over whitespace. Nothing is boxed. Section headers carry a single hairline beneath, nothing heavier. Strong bilateral symmetry, strong verticals.

**Backgrounds.** Flat white. Cream (`#FEE5D5`) is *not* a background — it is the softest step of the warm/red ramp, used for tinted surfaces and fills the way `primary-tint` serves the magenta ramp. No imagery, no photography, no illustration, no texture, no repeating pattern behind content, no gradient — anywhere, ever. The only decoration is flat geometry (see below) and it never sits behind content.

**Geometry.** Penrose tiling, simplified: rhombs, kites, darts, chevrons, fans, stepped ziggurats, concentric arcs, radiating sunbursts. Flat fills, hard edges. Decorative geometry belongs in headers, dividers and empty areas — never behind content, never reducing legibility. Shipped as `DecoBand`.

**Depth.** There is none, and nothing is outlined. **Containers have no borders** — no card frames, no boxed buttons, no table outline. Separation comes from three things only: a change of surface (paper on ground), a **rule** between items, and flat colour. Rules are 1px ink at 25% for row separation, solid ink for structure, and a gold hairline for deco. There is no double rule — the motif read as dated. Inputs and selects carry a single bottom rule, nothing else. Never a shadow, never a frame. No drop shadow, no inner shadow, no blur, no glassmorphism, no transparency except the modal scrim (ink at 70%).

**Corners.** 0–2px radius. Where softening is needed, chamfer the corner (a clipped 45° cut) rather than curve it.

**Cards.** On a white page a paper card carries a single top rule to register; the blush tone (`#FEE5D5`) is the quiet alternative when a card needs to sit apart without a fill. No border, square, no shadow, 24px padding, uppercase condensed title with a hairline beneath. Dialogs are the same — borderless paper over an ink scrim.

**Interaction states.**
- Hover: the fill moves one step up its ramp (primary → primary-lift); quiet controls take a primary-tint wash. Never opacity fades.
- Press: colour only. Nothing shrinks, lifts or moves.
- Selected: solid primary fill (controls) or primary-tint (rows).
- Focus: **2px hard-black outline at 2px offset** (the one place pure black still reads correctly) — always visible, never removed.
- Disabled: 40% opacity, cursor not-allowed.

**Animation.** Minimal and functional: 80–200ms colour swaps on a single standard easing (`cubic-bezier(0.2,0,0,1)`). No bounce, no scale, no parallax, no page transitions, no skeleton shimmer. Motion is never decorative.

**Accessibility — hard constraint.** 44px minimum touch target, 48px preferred; 56px for primary page actions and nav rows. No drag-and-drop as the only route to any action, no precision gestures, no small close buttons. Every interaction must work with imprecise taps — one user has limited fine motor control on bad days.

---

## ICONOGRAPHY

No icon set was supplied. **Substituted: [Lucide](https://lucide.dev)**, loaded from CDN (`https://unpkg.com/lucide@latest/dist/umd/lucide.js`) — chosen for its 2px stroke, geometric construction and square terminals, which sit correctly against Penrose's hard linework. **Flagging this: if the household has a preferred icon set, swap it and the `Icon` component picks it up.**

Rules:
- Icons are always accompanied by a text label or an `aria-label`; icon-only controls use `IconButton`, which requires `label`.
- 20–24px glyphs inside a 44–48px target. Never smaller.
- `currentColor` only — icons inherit ink, ground or primary; they are never coloured from the accent ramp.
- **No emoji.** Not in UI, not in copy, not in empty states.
- Unicode is used for exactly two glyphs: `×` in the dialog close control and `&` in headings. Nothing else.
- No hand-rolled SVG in screens. Brand geometry comes from `DecoBand`, never from an inline path.

## Brand mark

**No logo was supplied and none was drawn.** Wherever a mark would go, the word PENROSE is set in Roboto Condensed 900, uppercase, 0.14em tracking — ground on primary. See `guidelines/wordmark.html`. Replace it if a real mark is ever made.

---

## Index

| Path | What |
| --- | --- |
| `styles.css` | Global entry point — `@import` list only |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `borders.css`, `motion.css`, `base.css` |
| `guidelines/` | 16 foundation specimen cards (Colors, Type, Spacing, Brand) |
| `components/` | React primitives, grouped by concern |
| `ui_kits/household/` | Household tool — Today, House, Settings |
| `ui_kits/ledger/` | Ledger tool — Entries, Detail, New entry, Meters |
| `thumbnail.html` | Homepage tile |
| `SKILL.md` | Agent Skills entry point |

### Components

- **actions/** — `Button`, `IconButton`
- **forms/** — `Field`, `Input`, `Select`, `Checkbox`, `Radio`, `Switch`
- **surfaces/** — `Card`, `Divider`, `SectionHeader`, `Dialog`
- **status/** — `Badge`, `Tag`, `Toast`, `Tooltip`
- **navigation/** — `Tabs`, `NavRail`
- **data/** — `DataTable`, `ListRow`, `StatFigure`
- **deco/** — `DecoBand`
- **icon/** — `Icon`

Each directory holds `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` and one card HTML.

### Intentional additions

No source defined a component inventory, so the standard set was authored. These go beyond it and are here for a reason:

- `Icon` — wrapper for the substituted Lucide glyph set, so screens never inline SVG.
- `Field` — keeps the uppercase label + hint/error treatment identical across every control.
- `SectionHeader` — the hairline-under-heading motif appears on every screen; componentised so it can't drift.
- `Divider` — rules are the primary structural device in this system, so they are a component, not a raw `<hr>`.
- `NavRail` — every tool in the household shares one left rail.
- `DataTable`, `ListRow`, `StatFigure` — these tools are lists and figures; without them each kit would re-roll its own table.
- `DecoBand` — the house geometry, so it is never hand-drawn per screen.
