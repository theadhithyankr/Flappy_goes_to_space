import { PAYLINES, PAYOUT_MULTIPLIERS, SCATTER_SYMBOL } from '../config/paytable.js';

export default class PaylineSystem {
  constructor({ paylines = PAYLINES, paytable = PAYOUT_MULTIPLIERS } = {}) {
    this.paylines = paylines;
    this.paytable = paytable;
  }

  evaluate(reels, bet, winMultiplier = 1) {
    const wins = [];
    let totalWin = 0;

    for (const line of this.paylines) {
      const symbolsOnLine = line.rows.map((row, reelIndex) => reels[reelIndex][row]);
      const firstSymbol = symbolsOnLine[0];
      const allMatch = symbolsOnLine.every((symbol) => symbol === firstSymbol);
      const baseMultiplier = this.paytable[firstSymbol] ?? 0;

      if (allMatch && firstSymbol !== SCATTER_SYMBOL && baseMultiplier > 0) {
        const amount = bet * baseMultiplier * winMultiplier;
        totalWin += amount;
        wins.push({
          lineId: line.id,
          lineName: line.name,
          symbol: firstSymbol,
          amount,
          baseMultiplier,
          appliedMultiplier: winMultiplier,
          positions: line.rows.map((row, reelIndex) => ({ reelIndex, row }))
        });
      }
    }

    return { wins, totalWin };
  }
}
