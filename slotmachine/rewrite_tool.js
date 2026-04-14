const fs = require('fs');

const code = `import Phaser from 'phaser';
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
      startX: 295,
      startY: 195,
      reelWidth: 140,
      rowHeight: 120,
      gap: 15
    });

    this.lineOverlay = this.add.graphics();
    this.sparkles = this.add.group();

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

    // Dark purple/violet background behind everything
    graphics.fillGradientStyle(0x3a0050, 0x3a0050, 0x190022, 0x190022, 1);
    graphics.fillRect(0, 0, width, height);

    for (let i = 0; i < 16; i++) {
        graphics.fillStyle(0x40005a, 0.4);
        graphics.beginPath();
        graphics.moveTo(0, height/2);
        graphics.lineTo(width, (i * height) / 16);
        graphics.lineTo(width, (i * height) / 16 + 30);
        graphics.fillPath();
    }

    // Red cabinet frame wrapping the entire game
    graphics.lineStyle(20, 0x6e0000, 1);
    graphics.strokeRect(10, 10, width - 20, height - 20);
    // Gold/brass trim on all borders and bars
    graphics.lineStyle(4, 0xffa500, 1); 
    graphics.strokeRect(20, 20, width - 40, height - 40);

    // Top Bar (Gold)
    graphics.fillGradientStyle(0xffdf00, 0xffdf00, 0xb8860b, 0xb8860b, 1);
    graphics.fillRect(20, 20, width - 40, 60);
    graphics.lineStyle(4, 0xffa500, 1);
    graphics.strokeRect(20, 20, width - 40, 60);
    graphics.lineStyle(2, 0x5a3200, 1);
    graphics.strokeRect(20, 20, width - 40, 60);

    // Bottom Bar (Gold)
    graphics.fillGradientStyle(0xffdf00, 0xffdf00, 0xb8860b, 0xb8860b, 1);
    graphics.fillRect(20, 520, width - 40, 100);
    graphics.lineStyle(4, 0xffa500, 1);
    graphics.strokeRect(20, 520, width - 40, 100);
    graphics.lineStyle(2, 0x5a3200, 1);
    graphics.strokeRect(20, 520, width - 40, 100);

    // "SLOTFORGE" banner background
    graphics.fillGradientStyle(0x1a0000, 0x1a0000, 0x000000, 0x000000, 1);
    graphics.fillRoundedRect(width / 2 - 120, 25, 240, 50, 10);
    graphics.lineStyle(2, 0xffa500, 1);
    graphics.strokeRoundedRect(width / 2 - 120, 25, 240, 50, 10);

    this.drawPaylineIndicators(graphics, 295, 195, 140, 120, 15);
  }

  drawPaylineIndicators(graphics, startX, startY, reelW, rowH, gap) {
    const rx = startX - reelW/2;
    const frameW = reelW * 3 + gap * 2;
    const indicators = [
      {yOffset: -rowH, num: '1'},
      {yOffset: 0, num: '2'},
      {yOffset: rowH, num: '3'}
    ];

    const leftX = rx - 55;
    const rightX = rx + frameW + 55;

    indicators.forEach(ind => {
        graphics.lineStyle(2, 0xffdf00, 0.5);
        graphics.beginPath();
        graphics.moveTo(leftX, startY + ind.yOffset);
        graphics.lineTo(leftX + 20, startY + ind.yOffset);
        graphics.strokePath();

        graphics.beginPath();
        graphics.moveTo(rightX - 20, startY + ind.yOffset);
        graphics.lineTo(rightX, startY + ind.yOffset);
        graphics.strokePath();

        graphics.fillGradientStyle(0x8b0000, 0x8b0000, 0x3d0000, 0x3d0000, 1);
        graphics.fillCircle(leftX, startY + ind.yOffset, 16);
        graphics.lineStyle(2, 0xffdf00, 1);
        graphics.strokeCircle(leftX, startY + ind.yOffset, 16);
        
        graphics.fillGradientStyle(0x8b0000, 0x8b0000, 0x3d0000, 0x3d0000, 1);
        graphics.fillCircle(rightX, startY + ind.yOffset, 16);
        graphics.lineStyle(2, 0xffdf00, 1);
        graphics.strokeCircle(rightX, startY + ind.yOffset, 16);
    });
  }

  buildUi() {
    const { width, height } = this.scale;

    // Top Bar - left
    this.add.text(45, 50, '🪙', { fontSize: 24 }).setOrigin(0.5, 0.5);
    this.balanceText = this.add.text(70, 50, '', {
      fontFamily: 'Impact', fontSize: 28, color: '#331a00',
    }).setOrigin(0, 0.5);

    // Top Bar - center
    this.add.text(width / 2, 50, 'S L O T F O R G E', {
      fontFamily: 'Impact', fontSize: 32, color: '#ffdf00',
      shadow: { color: '#ff6600', fill: true, offsetY: 0, blur: 15 }
    }).setOrigin(0.5, 0.5);

    // Top Bar - right
    this.paytableButton = this.createButton(width - 100, 50, 140, 40, 'PAYTABLE', () => this.togglePaytable(), 'blue', 18);

    // Win / Free Spin Text overlay
    this.freeSpinText = this.add.text(width / 2, 120, '', {
      fontFamily: 'Impact', fontSize: 40, color: '#ffffff',
      stroke: '#a80000', strokeThickness: 6,
      shadow: { color: '#ff0000', fill: true, offsetY: 0, blur: 15 }
    }).setOrigin(0.5, 0.5).setDepth(20);

    this.winText = this.add.text(width / 2, 120, '', {
      fontFamily: 'Impact', fontSize: 60, color: '#ffdf00',
      stroke: '#8a0000', strokeThickness: 10,
      shadow: { color: '#000', fill: true, offsetY: 4, blur: 10 }
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    // Bottom Bar
    const btnY = 570;

    // Bet controls
    this.add.text(125, 540, 'BET', {fontFamily: 'Impact', fontSize: 16, color: '#4a2500'}).setOrigin(0.5);
    this.createButton(80, 570, 40, 40, '-', () => this.cycleBet(-1), 'red', 24);
    this.betDisplay = this.add.text(125, 570, '0', {fontFamily: 'Impact', fontSize: 24, color: '#2a1500'}).setOrigin(0.5);
    this.createButton(170, 570, 40, 40, '+', () => this.cycleBet(1), 'red', 24);

    // Center Display Panel
    const dispBg = this.add.graphics();
    dispBg.fillGradientStyle(0x1a0a00, 0x1a0a00, 0x0a0500, 0x0a0500, 1);
    dispBg.fillRoundedRect(220, 535, 420, 70, 8);
    dispBg.lineStyle(2, 0xffa500, 1);
    dispBg.strokeRoundedRect(220, 535, 420, 70, 8);

    this.add.text(240, 570, 'TOTAL BET:', {fontFamily: 'Impact', fontSize: 24, color: '#aaaaaa'}).setOrigin(0, 0.5);
    this.totalBetValueText = this.add.text(370, 570, '0', {fontFamily: 'Impact', fontSize: 28, color: '#ffffff'}).setOrigin(0, 0.5);

    this.add.text(430, 570, 'WIN:', {fontFamily: 'Impact', fontSize: 24, color: '#ffdf00'}).setOrigin(0, 0.5);
    this.totalWinValueText = this.add.text(490, 570, '0', {fontFamily: 'Impact', fontSize: 32, color: '#ffffff'}).setOrigin(0, 0.5);

    // MAX BET
    this.maxBetButton = this.createButton(700, btnY, 100, 55, 'MAX BET', () => this.maxBet(), 'pink', 18);

    // SPIN
    this.spinButton = this.createButton(820, btnY, 110, 70, 'SPIN', () => this.startSpin(), 'blue', 34);

    this.add.text(295 - 140/2 - 55, 195 - 120, '1', {fontFamily: 'Impact', fontSize: 18, color: '#ffffff'}).setOrigin(0.5);
    this.add.text(295 - 140/2 - 55, 195, '2', {fontFamily: 'Impact', fontSize: 18, color: '#ffffff'}).setOrigin(0.5);
    this.add.text(295 - 140/2 - 55, 195 + 120, '3', {fontFamily: 'Impact', fontSize: 18, color: '#ffffff'}).setOrigin(0.5);
    
    this.add.text(295 - 140/2 + 420 + 30 + 55, 195 - 120, '1', {fontFamily: 'Impact', fontSize: 18, color: '#ffffff'}).setOrigin(0.5);
    this.add.text(295 - 140/2 + 420 + 30 + 55, 195, '2', {fontFamily: 'Impact', fontSize: 18, color: '#ffffff'}).setOrigin(0.5);
    this.add.text(295 - 140/2 + 420 + 30 + 55, 195 + 120, '3', {fontFamily: 'Impact', fontSize: 18, color: '#ffffff'}).setOrigin(0.5);

    this.buildPaytableOverlay();
  }

  buildPaytableOverlay() {
    this.overlayContainer = this.add.container(0, 0).setDepth(100).setAlpha(0);
    this.overlayContainer.setVisible(false);

    const { width, height } = this.scale;
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);
    
    const panel = this.add.graphics();
    panel.fillGradientStyle(0x3a0050, 0x3a0050, 0x190022, 0x190022, 1);
    panel.fillRoundedRect(200, 100, 500, 440, 16);
    panel.lineStyle(4, 0xffa500, 1);
    panel.strokeRoundedRect(200, 100, 500, 440, 16);

    this.overlayContainer.add([bg, panel]);

    this.overlayContainer.add(this.add.text(450, 140, 'PAYTABLE', {
        fontFamily: 'Impact', fontSize: 40, color: '#ffdf00',
        stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5, 0.5));

    const payouts = [
      { sym: '💎 Diamond', val: '500x' },
      { sym: '🔔 Bell', val: '100x' },
      { sym: '🍒 Cherry', val: '50x' },
      { sym: '🍋 Lemon', val: '20x' },
      { sym: '⭐ Star', val: '10x' }
    ];

    payouts.forEach((p, idx) => {
      this.overlayContainer.add(this.add.text(350, 220 + idx * 50, p.sym, {
        fontSize: 28, color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0, 0.5));
      this.overlayContainer.add(this.add.text(550, 220 + idx * 50, p.val, {
        fontFamily: 'Impact', fontSize: 32, color: '#ffdf00'
      }).setOrigin(1, 0.5));
    });

    const closeBtn = this.createButton(450, 500, 120, 50, 'CLOSE', () => this.togglePaytable(), 'red', 24);
    this.overlayContainer.add(closeBtn.container);
    bg.setInteractive();
  }

  togglePaytable() {
    if (this.overlayContainer.visible && this.overlayContainer.alpha === 1) {
        this.tweens.add({
            targets: this.overlayContainer,
            alpha: 0,
            duration: 200,
            onComplete: () => this.overlayContainer.setVisible(false)
        });
    } else if (!this.overlayContainer.visible) {
        this.overlayContainer.setVisible(true);
        this.tweens.add({
            targets: this.overlayContainer,
            alpha: 1,
            duration: 200
        });
    }
  }

  createButton(x, y, width, height, label, onClick, styleType = "red", forcedFontSize = null) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    
    const setStyle = (state) => {
        bg.clear();
        let topColor, botColor, lineCol = 0xffa500;
        if (styleType === "red") {
            topColor = state === "hover" ? 0xff5555 : 0xc00000;
            botColor = state === "hover" ? 0xcc0000 : 0x730000;
        } else if (styleType === "blue") {
            topColor = state === "hover" ? 0x33b8ff : 0x0066cc;
            botColor = state === "hover" ? 0x008ae6 : 0x003d99;
        } else { // pink
            topColor = state === "hover" ? 0xff4dd2 : 0xcc0099;
            botColor = state === "hover" ? 0xcc0099 : 0x800060;
        }

        if (state === "disabled") {
            topColor = 0x555555; botColor = 0x222222; lineCol = 0x777777;
        }
        
        bg.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
        if (height === width) { 
            bg.fillCircle(0, 0, width/2);
            bg.lineStyle(3, lineCol, 1);
            bg.strokeCircle(0, 0, width/2);
        } else {
            bg.fillRoundedRect(-width/2, -height/2, width, height, height/2.5);
            bg.lineStyle(3, lineCol, 1);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, height/2.5);
        }
    };
    
    setStyle("normal");

    const hitArea = this.add.rectangle(-width/2, -height/2, width, height, 0xffffff, 0).setOrigin(0);

    const text = this.add.text(0, 0, label, {
      fontFamily: "Impact, sans-serif",
      fontSize: forcedFontSize || (styleType === "blue" ? 32 : (styleType === "pink" ? 18 : 22)),
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);
    
    text.setShadow(0, 2, "#000000", 0, true, false);

    container.add([bg, hitArea, text]);
    hitArea.setInteractive({ useHandCursor: true })
      .on("pointerover", () => { if (hitArea.input.enabled) setStyle("hover"); })
      .on("pointerout", () => { if (hitArea.input.enabled) setStyle("normal"); else setStyle("disabled"); })
      .on("pointerdown", () => { if (hitArea.input.enabled) onClick(); });

    hitArea.on("pointerdown", () => { if (hitArea.input.enabled) container.y = y + 2; });
    hitArea.on("pointerup", () => { container.y = y; });
    hitArea.on("pointerupoutside", () => { container.y = y; });

    return { container, bg, hitArea, text, width, height, setStyle, defaultY: y };
  }

  setButtonEnabled(button, enabled) {
    if (!button || !button.hitArea) return;
    button.hitArea.disableInteractive();
    if (enabled) button.hitArea.setInteractive({ useHandCursor: true });
    button.setStyle(enabled ? 'normal' : 'disabled');
    button.text.setAlpha(enabled ? 1 : 0.6);
  }

  cycleBet(dir) {
    if (this.isSpinning || this.freeSpinsRemaining > 0) return;
    this.betIndex += dir;
    if (this.betIndex < 0) this.betIndex = this.betOptions.length - 1;
    if (this.betIndex >= this.betOptions.length) this.betIndex = 0;
    this.updateUi();
  }

  maxBet() {
    if (this.isSpinning || this.freeSpinsRemaining > 0) return;
    this.betIndex = this.betOptions.length - 1;
    this.updateUi();
  }

  startSpin(fromAutoplay = false) {
    if (this.isSpinning) return;

    if (this.overlayContainer && this.overlayContainer.visible && this.overlayContainer.alpha === 1) {
        return; 
    }

    const isFreeSpin = this.freeSpinsRemaining > 0;
    const canAfford = this.balance >= this.currentBet;

    if (!isFreeSpin && !canAfford) {
      this.showWinPopup('NOT ENOUGH COINS');
      this.updateUi();
      return;
    }

    if (!isFreeSpin) {
      this.balance -= this.currentBet;
    } else {
      this.freeSpinsRemaining -= 1;
    }

    this.isSpinning = true;
    this.lineOverlay.clear();
    this.sparkles.clear(true, true);
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
      }
    );
  }

  animateWinningLines(wins) {
    if (!wins.length) return;

    this.lineOverlay.clear();
    this.lineOverlay.lineStyle(8, 0xffdf00, 1);

    for (const win of wins) {
      const first = this.reelSystem.getCellCenter(win.positions[0].reelIndex, win.positions[0].row);
      this.lineOverlay.beginPath();
      this.lineOverlay.moveTo(first.x, first.y);

      for (let i = 1; i < win.positions.length; i += 1) {
        const point = this.reelSystem.getCellCenter(win.positions[i].reelIndex, win.positions[i].row);
        this.lineOverlay.lineTo(point.x, point.y);
      }

      this.lineOverlay.strokePath();

      win.positions.forEach(pos => {
        const point = this.reelSystem.getCellCenter(pos.reelIndex, pos.row);
        
        const sparkle = this.add.graphics();
        sparkle.x = point.x;
        sparkle.y = point.y;
        sparkle.fillStyle(0x00aaff, 0.4);
        sparkle.fillCircle(0, 0, 50);
        sparkle.fillStyle(0xffffaa, 0.8);
        sparkle.fillCircle(0, 0, 15);
        this.sparkles.add(sparkle);

        this.tweens.add({
            targets: sparkle,
            scale: 1.4,
            alpha: 0,
            duration: 800,
            repeat: -1,
            yoyo: false
        });
      });
    }

    this.lineOverlay.setAlpha(1);
    this.tweens.add({
      targets: this.lineOverlay,
      alpha: 0.4,
      yoyo: true,
      repeat: 4,
      duration: 200,
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
    this.balanceText.setText(`${this.balance.toFixed(0)}`);
    this.betDisplay.setText(`${this.currentBet}`);

    const freeSpinLabel = this.freeSpinsRemaining > 0
      ? `FREE SPINS: ${this.freeSpinsRemaining} (2x)`
      : '';
    this.freeSpinText.setText(freeSpinLabel);

    const canSpin = !this.isSpinning;
    const canBetChange = canSpin && this.freeSpinsRemaining === 0;

    this.setButtonEnabled(this.spinButton, canSpin);
    this.setButtonEnabled(this.maxBetButton, canBetChange);
    this.paytableButton.setStyle(canSpin ? 'normal' : 'disabled');
    this.paytableButton.hitArea.input.enabled = canSpin;

    this.totalBetValueText.setText(`${this.currentBet * 3}`);
  }
}
`;

fs.writeFileSync('slotforge/src/scenes/GameScene.js', code);
