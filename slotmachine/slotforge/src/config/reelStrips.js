import { SYMBOLS } from './paytable.js';

// All reel math is client-side for this demo.
// Production social casino games should move RNG and verification server-side.
export const REEL_WEIGHTS = [
  {
    Diamond: 2,
    Bell: 0,
    Cherry: 1,
    Lemon: 27,
    Star: 11,
    Scatter: 1
  },
  {
    Diamond: 0,
    Bell: 2,
    Cherry: 16,
    Lemon: 12,
    Star: 11,
    Scatter: 1
  },
  {
    Diamond: 2,
    Bell: 27,
    Cherry: 1,
    Lemon: 0,
    Star: 11,
    Scatter: 1
  }
];

export function buildWeightedStrip(weightsBySymbol) {
  const strip = [];

  for (const symbol of SYMBOLS) {
    const weight = Math.max(0, Number(weightsBySymbol[symbol] ?? 0));
    for (let i = 0; i < weight; i += 1) {
      strip.push(symbol);
    }
  }

  return strip;
}

export const REEL_STRIPS = REEL_WEIGHTS.map((weights) => buildWeightedStrip(weights));

export function getVisibleWindow(strip, stopIndex, rows = 3) {
  if (!Array.isArray(strip) || strip.length === 0) {
    throw new Error('Reel strip must contain at least one symbol.');
  }

  if (rows % 2 === 0) {
    throw new Error('Visible row count must be odd to center on the stop index.');
  }

  const half = Math.floor(rows / 2);
  const result = [];

  for (let offset = -half; offset <= half; offset += 1) {
    const index = (stopIndex + offset + strip.length) % strip.length;
    result.push(strip[index]);
  }

  return result;
}
