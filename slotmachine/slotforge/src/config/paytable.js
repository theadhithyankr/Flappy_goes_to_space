export const SYMBOLS = ['Diamond', 'Bell', 'Cherry', 'Lemon', 'Star', 'Scatter'];

export const SCATTER_SYMBOL = 'Scatter';

export const PAYOUT_MULTIPLIERS = {
  Diamond: 500,
  Bell: 100,
  Cherry: 50,
  Lemon: 20,
  Star: 10
};

export const PAYLINES = [
  {
    id: 1,
    name: 'Top',
    rows: [0, 0, 0]
  },
  {
    id: 2,
    name: 'Middle',
    rows: [1, 1, 1]
  },
  {
    id: 3,
    name: 'Bottom',
    rows: [2, 2, 2]
  }
];

export const BONUS_CONFIG = {
  triggerScatterCount: 3,
  freeSpinsAwarded: 10,
  freeSpinMultiplier: 2
};
