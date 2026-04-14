import { REEL_STRIPS, getVisibleWindow } from '../config/reelStrips.js';

export default class RNGSystem {
  constructor({ reelStrips = REEL_STRIPS, random = Math.random } = {}) {
    this.reelStrips = reelStrips;
    this.random = random;
  }

  pickStopIndex(reelIndex) {
    const strip = this.reelStrips[reelIndex];
    if (!strip || strip.length === 0) {
      throw new Error(`Missing strip data for reel ${reelIndex}.`);
    }

    return Math.floor(this.random() * strip.length);
  }

  getRandomSymbol(reelIndex) {
    const strip = this.reelStrips[reelIndex];
    const randomIndex = Math.floor(this.random() * strip.length);
    return strip[randomIndex];
  }

  spinOnce(rows = 3) {
    const reels = [];
    const stopIndexes = [];

    for (let reelIndex = 0; reelIndex < this.reelStrips.length; reelIndex += 1) {
      const stopIndex = this.pickStopIndex(reelIndex);
      stopIndexes.push(stopIndex);
      reels.push(getVisibleWindow(this.reelStrips[reelIndex], stopIndex, rows));
    }

    return {
      reels,
      stopIndexes
    };
  }
}
