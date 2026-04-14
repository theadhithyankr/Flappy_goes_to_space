import RNGSystem from '../src/systems/RNGSystem.js';
import PaylineSystem from '../src/systems/PaylineSystem.js';
import BonusSystem from '../src/systems/BonusSystem.js';

function parseArgs(argv) {
  const args = { spins: 100000, bet: 1 };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--spins') {
      args.spins = Number(argv[i + 1]);
      i += 1;
    }

    if (token === '--bet') {
      args.bet = Number(argv[i + 1]);
      i += 1;
    }
  }

  if (!Number.isFinite(args.spins) || args.spins <= 0) {
    throw new Error('Invalid --spins value. Use a positive integer.');
  }

  if (!Number.isFinite(args.bet) || args.bet <= 0) {
    throw new Error('Invalid --bet value. Use a positive number.');
  }

  return args;
}

function runSimulation({ spins, bet }) {
  const rngSystem = new RNGSystem();
  const paylineSystem = new PaylineSystem();
  const bonusSystem = new BonusSystem();

  let totalBet = 0;
  let totalPayout = 0;
  let biggestSingleWin = 0;
  let bonusTriggers = 0;
  let freeSpinsRemaining = 0;

  for (let spin = 0; spin < spins; spin += 1) {
    const isFreeSpin = freeSpinsRemaining > 0;
    const multiplier = isFreeSpin ? 2 : 1;

    if (!isFreeSpin) {
      totalBet += bet;
    } else {
      freeSpinsRemaining -= 1;
    }

    const outcome = rngSystem.spinOnce(3);
    const { totalWin } = paylineSystem.evaluate(outcome.reels, bet, multiplier);
    totalPayout += totalWin;

    if (totalWin > biggestSingleWin) {
      biggestSingleWin = totalWin;
    }

    const bonus = bonusSystem.evaluateSpin(outcome.reels);
    if (bonus.triggered) {
      bonusTriggers += 1;
      freeSpinsRemaining += bonus.awardedFreeSpins;
    }
  }

  const actualRtp = totalBet > 0 ? (totalPayout / totalBet) * 100 : 0;

  return {
    spins,
    totalBet,
    totalPayout,
    actualRtp,
    bonusTriggers,
    biggestSingleWin
  };
}

function printReport(result) {
  console.log('Simulation Result');
  console.log('-----------------');
  console.log(`Total spins: ${result.spins}`);
  console.log(`Total bet: ${result.totalBet.toFixed(2)}`);
  console.log(`Total payout: ${result.totalPayout.toFixed(2)}`);
  console.log(`Actual RTP %: ${result.actualRtp.toFixed(4)}`);
  console.log(`Bonus triggers: ${result.bonusTriggers}`);
  console.log(`Biggest single win: ${result.biggestSingleWin.toFixed(2)}`);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const result = runSimulation(args);
  printReport(result);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
