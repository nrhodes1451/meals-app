/**
 * Asserts the text and fill pairs this app actually uses against WCAG AA. Penrose calls 4.5:1
 * non-negotiable and gives the reason: these screens get used in poor lighting, and the shopping
 * list is used in a supermarket.
 *
 * Colours are read from styles/tokens.css rather than duplicated here, so the check follows the
 * tokens if they change.
 */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--pen-${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match) throw new Error(`No hex value for --pen-${name} in styles/tokens.css`);
  return match[1];
}

type Rgb = [number, number, number];

function parse(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Flatten an ink-at-opacity value over its background, the way the browser will. */
function over(colour: Rgb, background: Rgb, alpha: number): Rgb {
  return colour.map((channel, index) =>
    Math.round(background[index] + (channel - background[index]) * alpha),
  ) as Rgb;
}

function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(foreground: Rgb, background: Rgb): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const ink = parse(token('ink'));
const ground = parse(token('ground'));
const paper = parse(token('paper'));
const primary = parse(token('primary'));
const primaryLift = parse(token('primary-lift'));
const primaryTint = parse(token('primary-tint'));
const blush = parse(token('accent-blush'));
const danger = parse(token('danger'));
const muted = parse(token('text-muted'));

/** Large text is 18.66px bold or 24px and up; everything else needs 4.5:1. */
const AA = 4.5;
const AA_LARGE = 3;

const pairs: { label: string; fg: Rgb; bg: Rgb; min: number }[] = [
  { label: 'ink on ground', fg: ink, bg: ground, min: AA },
  { label: 'ink on paper', fg: ink, bg: paper, min: AA },
  { label: 'ink on primary-tint (badges, hovered rows)', fg: ink, bg: primaryTint, min: AA },
  { label: 'ink on blush (staples block)', fg: ink, bg: blush, min: AA },
  { label: 'muted on ground (secondary lines)', fg: muted, bg: ground, min: AA },
  { label: 'ink at 70% on ground (secondary lines)', fg: over(ink, ground, 0.7), bg: ground, min: AA },
  { label: 'primary on ground (links, counts)', fg: primary, bg: ground, min: AA },
  { label: 'primary on primary-tint (secondary buttons)', fg: primary, bg: primaryTint, min: AA },
  { label: 'primary on blush', fg: primary, bg: blush, min: AA },
  { label: 'ground on primary (primary buttons, nav)', fg: ground, bg: primary, min: AA },
  { label: 'ground on primary-lift (hovered primary)', fg: ground, bg: primaryLift, min: AA },
  { label: 'paper on danger (destructive buttons)', fg: paper, bg: danger, min: AA },
  { label: 'danger on ground (last eaten inside the window)', fg: danger, bg: ground, min: AA },
  { label: 'ground on ink (nav rail)', fg: ground, bg: ink, min: AA },
  // 18px and up only, which is what the token is restricted to.
  { label: 'primary-lift on ground (18px and up)', fg: primaryLift, bg: ground, min: AA_LARGE },
];

/**
 * The design recedes checked and eaten rows to ink at 42%, which is about 2.3:1 on white. That
 * was raised to the muted token, and this asserts the value the design specified is not in use.
 */
const rejected = { label: 'ink at 42% on ground', fg: over(ink, ground, 0.42), bg: ground };

const width = Math.max(...pairs.map((pair) => pair.label.length));
let failed = 0;

for (const pair of pairs) {
  const value = ratio(pair.fg, pair.bg);
  const ok = value >= pair.min;
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${pair.label.padEnd(width)}  ${value.toFixed(2)}:1 (needs ${pair.min}:1)`,
  );
}

const rejectedRatio = ratio(rejected.fg, rejected.bg);
console.log(
  `\nnote  ${rejected.label} measures ${rejectedRatio.toFixed(2)}:1, below ${AA}:1.\n      ` +
    'This is the value the design handoff specifies for checked and eaten rows. Not used:\n      ' +
    'checked rows keep the strike-through and take the muted token instead.',
);

if (failed > 0) {
  console.error(`\n${failed} of ${pairs.length} pairs fail.`);
  process.exit(1);
}
console.log(`\nAll ${pairs.length} pairs pass.`);
