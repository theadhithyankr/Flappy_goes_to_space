import Phaser from 'phaser';
import ReelSystem from '../systems/ReelSystem.js';
import RNGSystem from '../systems/RNGSystem.js';
import PaylineSystem from '../systems/PaylineSystem.js';
import BonusSystem from '../systems/BonusSystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    this.balance = 1000;
    this.betOptions = [1, 5, 10, 25];
    this.betIndex = 0;
    this.isSpinning = false;
    this.autoSpinsRemaining = 0;
    this.freeSpinsRemaining = 0;
  }

  create() {
    this.drawBackground();

    this.rngSystem = new RNGSystem();
    this.paylineSystem = new PaylineSystem();
    this.bonusSystem = new BonusSystem();

    this.reelSystem = new ReelSystem(this, this.rngSystem, {
      startX: 120,
      startY: 195,
      reelWidth: 140,
      rowHeight: 120,
      gap: 15
    });

    this.lineOverlay = this.add.graphics();

    this.buildUi();
    this.scene.launch('BonusScene');
    this.scene.bringToTop('BonusScene');

    const initialSpin = this.rngSystem.spinOnce(3);
    this.reelSystem.setGrid(initialSpin.reels);
    this.updateUi();
  }

  get currentBet() {
    return this.betOptions[this.betIndex];
  }

  drawBackground() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();

    // Purple/Pink rays background
    graphics.fillGradientStyle(0x7a0066, 0x7a0066, 0x3d0033, 0x3d0033, 1);
    graphics.fillRect(0, 0, width, height);
    for (let i = 0; i < 16; i++) {
        graphics.fillStyle(0x990088, 0.4);
        graphics.beginPath();
        graphics.moveTo(0, height/2);
        graphics.lineTo(width, (i * height) / 16);
        graphics.lineTo(width, (i * height) / 16 + 30);
        graphics.fillPath();
    }

    // Top Bar (Gold gradient)
    graphics.fillGradientStyle(0xffe270, 0xffe270, 0xc18f00, 0xc18f00, 1);
    graphics.fillRect(0, 0, width, 55);
    graphics.lineStyle(4, 0x5a3200, 1);
    graphics.strokeRect(0, 0, width, 55);

    // Bottom Bar (Gold gradient)
    graphics.fillGradientStyle(0xffe270, 0xffe270, 0xc18f00, 0xc18f00, 1);
    graphics.fillRect(0, 540, width, 100);
    graphics.lineStyle(4, 0x5a3200, 1);
    graphics.strokeRect(0, 540, width, 100);

    // Slot Cabinet Header removed
    
    // Main cabinet back (Bright Red) removed to free space

    // Dark dotted area above the reels for messages
    const infoY = 65;
    graphics.fillGradientStyle(0x1a0505, 0x1a0505, 0x010000, 0x010000, 1);
    graphics.fillRoundedRect(30, infoY, width - 60, 50, 8);
    graphics.lineStyle(2, 0xffd700, 1);
    graphics.strokeRoundedRect(30, infoY, width - 60, 50, 8);
  }

  buildUi() {
    this.titleText = this.add.text(20, 27, 'Slotforge', {
      fontFamily: 'Impact, sans-serif',
      fontSize: 42,
      color: '#fff9e6',
      stroke: '#a82c2c',
      strokeThickness: 8,
      fontStyle: 'bold',
      shadow: { color: '#ffb300', fill: true, offsetY: 0, blur: 10 }
    }).setOrigin(0, 0.5);

    this.balanceText = this.add.text(this.scale.width - 20, 27, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: 28,
      color: '#ffd570',
      stroke: '#000',
      strokeThickness: 4,
      shadow: { color: '#000', fill: true, offsetY: 2, blur: 2 }
    }).setOrigin(1, 0.5);

    // Paytable Header
    this.add.text(this.scale.width - 150, 140, 'PAYTABLE', {
      fontFamily: 'Impact, sans-serif',
      fontSize: 32,
      color: '#ffdf00',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5);

    // Paytable Items
    const payStartY = 190;
    const paySpacing = 50;
    const payouts = [
      { sym: '💎', val: '500x' },
      { sym: '🔔', val: '100x' },
      { sym: '🍒', val: '50x' },
      { sym: '🍋', val: '20x' },
      { sym: '⭐', val: '10x' }
    ];

    payouts.forEach((p, idx) => {
      this.add.text(this.scale.width - 200, payStartY + idx * paySpacing, p.sym, {
        fontSize: 32
      }).setOrigin(0.5, 0.5);
      this.add.text(this.scale.width - 110, payStartY + idx * paySpacing, p.val, {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
    });

    this.freeSpinText = this.add.text(this.scale.width / 2, 250, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: 48,
      color: '#ffffff',
      stroke: '#a80000',
      strokeThickness: 8,
      shadow: { color: '#ff0000', fill: true, offsetY: 0, blur: 15 }
    }).setOrigin(0.5, 0.5).setDepth(20);

    this.winText = this.add.text(this.scale.width / 2, 90, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: 72,
      color: '#ffdf00',
      stroke: '#8a0000',
      strokeThickness: 14,
      shadow: { color: '#000', fill: true, offsetY: 6, blur: 12 }
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    const btnY = 590;

    this.createButton(45, btnY, 40, 40, '-', () => this.cycleBet(), 'red');
    this.betDisplay = this.add.text(95, btnY, 'BET\n0', {fontFamily:'Impact', fontSize:14, align:'center', color:'#ffffff'}).setOrigin(0.5);
    this.createButton(145, btnY, 40, 40, '+', () => this.cycleBet(), 'red');

    this.add.text(95, 555, '3 LINES', {fontFamily: 'Arial', fontSize: 12, color: '#aaaaaa', fontStyle: 'bold'}).setOrigin(0.5, 0.5);

    const statBg = this.add.graphics();
    statBg.fillStyle(0x1a0a00, 1);
    statBg.lineStyle(2, 0xffd700);
    statBg.fillRect(205, 565, 415, 50);
    statBg.strokeRect(205, 565, 415, 50);
    
    this.add.text(230, 572, 'TOTAL BET: ', {fontFamily: 'Arial', fontSize: 16, color: '#ffdf00', fontStyle: 'bold'});
    this.totalBetValueText = this.add.text(340, 568, '0', {fontFamily: 'Impact', fontSize: 20, color: '#ffffff'}).setOrigin(0, 0);
    
    this.add.text(450, 572, 'WIN: ', {fontFamily: 'Arial', fontSize: 16, color: '#ffffff', fontStyle: 'bold'});
    this.totalWinValueText = this.add.text(500, 568, '0', {fontFamily: 'Impact', fontSize: 20, color: '#ffffff'}).setOrigin(0, 0);

    this.autoplayButton = this.createButton(680, btnY, 90, 50, 'AUTOPLAY', () => this.startAutoplay(), 'pink');
    this.spinButton = this.createButton(800, btnY, 110, 60, 'SPIN', () => this.startSpin(), 'blue');

    this.betButton = {hitArea:{disableInteractive:()=>null,setInteractive:()=>null}, bg:{clear:()=>null}, text:{setAlpha:()=>null}, setStyle:()=>null}; // mocked
  }

  createButton(x, y, width, height, label, onClick, styleType = 'red') {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    
    const setStyle = (state) => {
        bg.clear();
        let topColor, botColor, lineCol = 0xffffff;
        if (styleType === 'red') {
            topColor = state === 'hover' ? 0xff5555 : 0xff2222;
            botColor = state === 'hover' ? 0xcc0000 : 0xaa0000;
        } else if (styleType === 'blue') {
            topColor = state === 'hover' ? 0x55ffff : 0x00d4ff;
            botColor = state === 'hover' ? 0x00aaaa : 0x0080ff;
            lineCol = 0xffffff;
        } else { // pink
            topColor = state === 'hover' ? 0xff66bb : 0xff3399;
            botColor = state === 'hover' ? 0xcc0066 : 0x990044;
        }

        if (state === 'disabled') {
            topColor = 0x555555; botColor = 0x222222; lineCol = 0x999999;
        }
        
        bg.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
        if (styleType === 'blue' || styleType === 'pink' || height === width) {
            bg.fillRoundedRect(-width/2, -height/2, width, height, height/2);
            bg.lineStyle(3, lineCol, 1);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, height/2);
        } else {
            bg.fillRoundedRect(-width/2, -height/2, width, height, 16);
            bg.lineStyle(3, lineCol, 1);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, 16);
        }
    };
    
    setStyle('normal');

    const hitArea = this.add.rectangle(-width/2, -height/2, width, height, 0xffffff, 0).setOrigin(0);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Impact, sans-serif',
      fontSize: styleType === 'blue' ? 32 : (styleType === 'pink' ? 18 : 22),
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: styleType === 'blue' ? 4 : 2,
      align: 'center'
    }).setOrigin(0.5);

    container.add([bg, hitArea, text]);
    hitArea.setInteractive({ useHandCursor: true })
      .on('pointerover', () => { if (hitArea.input.enabled) setStyle('hover'); })
      .on('pointerout', () => { if (hitArea.input.enabled) setStyle('normal'); else setStyle('disabled'); })
      .on('pointerdown', () => { if (hitArea.input.enabled) onClick(); });

    return { container, bg, hitArea, text, width, height, setStyle };
  }

  setButtonEnabled(button, enabled) {
    if (!button || !button.hitArea) return;
    button.hitArea.disableInteractive();
    if (enabled) button.hitArea.setInteractive({ useHandCursor: true });
    button.setStyle(enabled ? 'normal' : 'disabled');
    button.text.setAlpha(enabled ? 1 : 0.6);
  }

  cycleBet() {
    if (this.isSpinning || this.freeSpinsRemaining > 0) return;
    this.betIndex = (this.betIndex + 1) % this.betOptions.length;
    this.updateUi();
  }

  startAutoplay() {
    if (this.isSpinning || this.autoSpinsRemaining > 0) return;
    this.autoSpinsRemaining = 10;
    this.updateUi();
    this.tryNextAutoplaySpin();
  }

  tryNextAutoplaySpin() {
    if (this.autoSpinsRemaining <= 0 || this.isSpinning) return;

    this.time.delayedCall(1000, () => {
      if (this.autoSpinsRemaining <= 0 || this.isSpinning) return;
      this.startSpin(true);
    });
  }

  startSpin(fromAutoplay = false) {
    if (this.isSpinning) return;

    const isFreeSpin = this.freeSpinsRemaining > 0;
    const canAfford = this.balance >= this.currentBet;

    if (!isFreeSpin && !canAfford) {
      this.showWinPopup('NOT ENOUGH COINS');
      this.autoSpinsRemaining = 0;
      this.updateUi();
      return;
    }

    if (!isFreeSpin) {
      this.balance -= this.currentBet;
    } else {
      this.freeSpinsRemaining -= 1;
    }

    if (fromAutoplay && this.autoSpinsRemaining > 0) {
      this.autoSpinsRemaining -= 1;
    }

    this.isSpinning = true;
    this.lineOverlay.clear();
    this.totalWinValueText.setText('0');
    this.showWinPopup('');
    this.updateUi();

    const spinMultiplier = isFreeSpin ? 2 : 1;
    const outcome = this.rngSystem.spinOnce(3);

    this.reelSystem.spinToResult(
      outcome.reels,
      null,
      () => {
        const { wins, totalWin } = this.paylineSystem.evaluate(outcome.reels, this.currentBet, spinMultiplier);
        const bonusResult = this.bonusSystem.evaluateSpin(outcome.reels);

        if (totalWin > 0) {
          this.balance += totalWin;
          this.totalWinValueText.setText(`${totalWin.toFixed(0)}`);
          this.animateWinningLines(wins);
          this.showWinPopup(`WIN ${totalWin.toFixed(0)}`);
        } else {
          this.totalWinValueText.setText('0');
        }

        if (bonusResult.triggered) {
          this.freeSpinsRemaining += bonusResult.awardedFreeSpins;
          this.game.events.emit('show-free-spins-banner');
        }

        this.isSpinning = false;
        this.updateUi();

        if (this.autoSpinsRemaining > 0) {
          this.tryNextAutoplaySpin();
        }
      }
    );
  }

  animateWinningLines(wins) {
    if (!wins.length) return;

    this.lineOverlay.clear();
    this.lineOverlay.lineStyle(5, 0xffd466, 0.95);

    for (const win of wins) {
      const first = this.reelSystem.getCellCenter(win.positions[0].reelIndex, win.positions[0].row);
      this.lineOverlay.beginPath();
      this.lineOverlay.moveTo(first.x, first.y);

      for (let i = 1; i < win.positions.length; i += 1) {
        const point = this.reelSystem.getCellCenter(win.positions[i].reelIndex, win.positions[i].row);
        this.lineOverlay.lineTo(point.x, point.y);
      }

      this.lineOverlay.strokePath();
    }

    this.lineOverlay.setAlpha(1);
    this.tweens.add({
      targets: this.lineOverlay,
      alpha: 0.2,
      yoyo: true,
      repeat: 4,
      duration: 180,
      onComplete: () => this.lineOverlay.setAlpha(1)
    });
  }

  showWinPopup(text) {
    this.winText.setText(text);

    if (!text) {
      this.winText.setAlpha(0);
      return;
    }

    this.winText.setAlpha(1);
    this.winText.setScale(0.8);

    this.tweens.add({
      targets: this.winText,
      scale: 1,
      y: this.winText.y - 12,
      yoyo: true,
      duration: 260,
      ease: 'Back.easeOut'
    });
  }

  updateUi() {
    this.balanceText.setText(`Balance: ${this.balance.toFixed(0)} coins`);
    this.betDisplay.setText(`BET\n${this.currentBet}`);

    const freeSpinLabel = this.freeSpinsRemaining > 0
      ? `FREE SPINS: ${this.freeSpinsRemaining} (2x)`
      : '';
    this.freeSpinText.setText(freeSpinLabel);

    const canSpin = !this.isSpinning;
    const canBetChange = canSpin && this.freeSpinsRemaining === 0;
    const canAutoplay = canSpin && this.autoSpinsRemaining === 0;

    this.setButtonEnabled(this.spinButton, canSpin);
    this.setButtonEnabled(this.betButton, canBetChange);
    this.setButtonEnabled(this.autoplayButton, canAutoplay);

    this.autoplayButton.text.setText(this.autoSpinsRemaining > 0 ? `AUTO: ${this.autoSpinsRemaining}` : 'AUTOPLAY');
    this.totalBetValueText.setText(`${this.currentBet * 3}`);
  }
}
