import { BONUS_CONFIG, SCATTER_SYMBOL } from '../config/paytable.js';

export default class BonusSystem {
  constructor({ config = BONUS_CONFIG, scatterSymbol = SCATTER_SYMBOL } = {}) {
    this.config = config;
    this.scatterSymbol = scatterSymbol;
  }

  evaluateSpin(reels) {
    const scatterCount = reels
      .flatMap((reelSymbols) => reelSymbols)
      .filter((symbol) => symbol === this.scatterSymbol).length;

    const triggered = scatterCount >= this.config.triggerScatterCount;

    return {
      scatterCount,
      triggered,
      awardedFreeSpins: triggered ? this.config.freeSpinsAwarded : 0,
      multiplier: this.config.freeSpinMultiplier
    };
  }
}
