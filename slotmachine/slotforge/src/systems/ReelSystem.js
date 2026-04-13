import Phaser from 'phaser';

const SYMBOL_MAP = {
  Diamond: '💎',
  Bell: '🔔',
  Cherry: '🍒',
  Lemon: '🍋',
  Star: '⭐',
  Scatter: '🎰'
};

export default class ReelSystem {
  constructor(scene, rngSystem, options = {}) {
    this.scene = scene;
    this.rngSystem = rngSystem;
    this.reelCount = 3;
    this.rowCount = 3;
    this.reelWidth = options.reelWidth ?? 170;
    this.rowHeight = options.rowHeight ?? 130;
    this.gap = options.gap ?? 15;
    this.startX = options.startX ?? 180;
    this.startY = options.startY ?? 140;
    
    // Enough symbols to allow offscreen scrolling
    this.symbolsPerReel = this.rowCount + 3; 
    
    this.reels = [];
    this.buildReels();
  }

  buildReels() {
    const frameWidth = this.reelWidth * this.reelCount + this.gap * (this.reelCount - 1);
    const frameHeight = this.rowHeight * this.rowCount;

    // Reel frame background
    this.scene.add.rectangle(
      this.startX - this.reelWidth / 2 - 10, 
      this.startY - this.rowHeight / 2 - 10, 
      frameWidth + 20, 
      frameHeight + 20, 
      0x111111
    ).setOrigin(0).setStrokeStyle(8, 0xe0c169, 1);

    // Inner bright rim
    this.scene.add.rectangle(
      this.startX - this.reelWidth / 2 - 6, 
      this.startY - this.rowHeight / 2 - 6, 
      frameWidth + 12, 
      frameHeight + 12, 
      0x050505
    ).setOrigin(0).setStrokeStyle(3, 0xffeb99, 1);

    const maskShape = this.scene.make.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(
      this.startX - this.reelWidth / 2 - 5, 
      this.startY - this.rowHeight / 2 - 5, 
      frameWidth + 10, 
      frameHeight + 10
    );
    const reelMask = maskShape.createGeometryMask();

    for (let reelIndex = 0; reelIndex < this.reelCount; reelIndex += 1) {
      const reelX = this.startX + reelIndex * (this.reelWidth + this.gap);
      const reelCenterY = this.startY + (frameHeight / 2) - (this.rowHeight / 2);
      
      // Vertical bright base
      this.scene.add.rectangle(reelX, reelCenterY, this.reelWidth, frameHeight, 0x3d1d07).setOrigin(0.5);
      if (reelIndex > 0) { this.scene.add.rectangle(reelX - this.reelWidth/2 - this.gap/2, reelCenterY, 6, frameHeight, 0x0a0500).setOrigin(0.5); }
      
      // Container holding only the moving symbols
      const container = this.scene.add.container(reelX, this.startY);
      container.setMask(reelMask);

      // Inner shadow (cylindrical effect overlay)
      const gradRect = this.scene.add.graphics();
      gradRect.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0); // top heavy
      gradRect.fillRect(reelX - this.reelWidth / 2, reelCenterY - frameHeight / 2, this.reelWidth, frameHeight / 3);
      gradRect.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.7, 0.7); // bottom heavy
      gradRect.fillRect(reelX - this.reelWidth / 2, reelCenterY + frameHeight / 6, this.reelWidth, frameHeight / 3);
      gradRect.setDepth(10); // Keep on top of symbols


      const symbolObjects = [];

      for (let i = 0; i < this.symbolsPerReel; i += 1) {
        // Positioned downward starting above the mask
        const yPos = (i - 1) * this.rowHeight; 
        
        // Remove the heavy background cell, just make it look like painted reel ribbon
        const cellBg = this.scene.add.rectangle(0, 0, this.reelWidth - 8, this.rowHeight - 8, 0xffffff, 0)
          .setOrigin(0.5);

        // Huge clean emojis as graphic substitutes
        const textLabel = this.scene.add.text(0, -5, '-', {
          fontFamily: 'Arial, sans-serif',
          fontSize: 80,
          shadow: { color: '#000', fill: true, offsetY: 2, offsetX: 2, blur: 4 }
        }).setOrigin(0.5);
        
        const subLabel = this.scene.add.text(0, 48, '-', {
            fontFamily: 'Impact, sans-serif',
            fontSize: 16,
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const itemContainer = this.scene.add.container(0, yPos, [cellBg, textLabel, subLabel]);
        container.add(itemContainer);

        symbolObjects.push({
          wrapper: itemContainer,
          bg: cellBg,
          emoji: textLabel,
          label: subLabel,
          symbolName: '-'
        });
      }

      this.reels.push({
        container,
        symbolObjects,
        currentTween: null
      });
    }
  }

  setSymbolDisplay(obj, symbol) {
    obj.symbolName = symbol;
    obj.emoji.setText(SYMBOL_MAP[symbol] || '❓');
    
    if (symbol === 'Scatter') {
      obj.label.setText('BONUS');
      obj.label.setColor('#e02424');
      obj.bg.setStrokeStyle(3, 0xffd24d, 0);
      obj.emoji.setScale(1.1);
    } else {
      obj.label.setText(symbol.toUpperCase());
      obj.label.setColor('#333333');
      obj.bg.setStrokeStyle(2, 0x8a6237, 0);
      obj.emoji.setScale(1.0);
    }
  }

  setGrid(reelsData) {
    for (let reelIndex = 0; reelIndex < this.reelCount; reelIndex += 1) {
      const reelState = this.reels[reelIndex];
      // Sync symbols to visible rows
      for (let i = 0; i < this.symbolsPerReel; i += 1) {
        const obj = reelState.symbolObjects[i];
        if (i >= 1 && i <= 3) {
          const row = i - 1;
          this.setSymbolDisplay(obj, reelsData[reelIndex][row]);
        } else {
          this.setSymbolDisplay(obj, this.rngSystem.getRandomSymbol(reelIndex));
        }
      }
    }
  }

  startContinuousSpin(reelIndex) {
    const reelState = this.reels[reelIndex];
    if (reelState.currentTween) reelState.currentTween.stop();

    // Constant fast spinning
    reelState.currentTween = this.scene.tweens.add({
      targets: reelState.container,
      y: `+=800`,
      duration: 300,
      ease: 'Linear',
      repeat: -1,
      onUpdate: () => this.wrapSymbols(reelIndex)
    });
  }

  wrapSymbols(reelIndex) {
    const reelState = this.reels[reelIndex];
    const containerY = reelState.container.y;
    // Visible threshold calculation
    const bottomThreshold = this.startY + (this.rowCount * this.rowHeight) + this.rowHeight;

    let minLocalY = Math.min(...reelState.symbolObjects.map(o => o.wrapper.y));

    reelState.symbolObjects.forEach(obj => {
      const globalY = containerY + obj.wrapper.y;
      
      // If it scrolled way past the bottom
      if (globalY > bottomThreshold) {
        // Move it strictly above the highest visible item
        obj.wrapper.setY(minLocalY - this.rowHeight);
        minLocalY = obj.wrapper.y;
        
        // Randomize
        this.setSymbolDisplay(obj, this.rngSystem.getRandomSymbol(reelIndex));
        
        // Add vertical stretch for motion blur effect
        obj.emoji.setScale(1, 1.4);
      }
    });
  }

  spinToResult(reelsData, onReelStop, onComplete) {
    // Start continuous spin for all with anticipation
    for (let i = 0; i < this.reelCount; i += 1) {
      const rs = this.reels[i];
      if (rs.currentTween) rs.currentTween.stop();
      
      // Small anticipation bump up
      rs.currentTween = this.scene.tweens.add({
        targets: rs.container,
        y: `-=40`,
        duration: 150,
        ease: 'Quad.easeOut',
        onComplete: () => this.startContinuousSpin(i)
      });
    }

    let stoppedCount = 0;
    
    // Stop them sequentially
    for (let reelIndex = 0; reelIndex < this.reelCount; reelIndex += 1) {
      this.scene.time.delayedCall(500 + reelIndex * 400, () => {
        const reelState = this.reels[reelIndex];
        const finalSymbols = reelsData[reelIndex];

        if (reelState.currentTween) reelState.currentTween.stop();

        // Sort objects by their vertical position (highest up = lowest local Y)
        // We know exactly 3 objects must land on local origin (y=0, y=rowHeight, y=2*rowHeight)
        const sortedObjects = [...reelState.symbolObjects].sort((a, b) => a.wrapper.y - b.wrapper.y);
        
        // Snap container seamlessly:
        // We take the top 3 items in the container, assign them the final output, 
        // put them at standard local positions, and trigger an ease into place.
        for (let row = 0; row < 3; row += 1) {
          const obj = sortedObjects[row];
          this.setSymbolDisplay(obj, finalSymbols[row]);
          // Reset blur
          obj.emoji.setScale(obj.symbolName === 'Scatter' ? 1.1 : 1.0);
        }
        
        // Move the container so these 3 top items land perfectly at startY, startY+rowHight, etc.
        // We calculate distance from current container.y + topItem.wrapper.y  to startY.
        const topLocalY = sortedObjects[0].wrapper.y;
        const currentGlobalY = reelState.container.y + topLocalY;
        
        // We want it to sink smoothly from above
        // Shift container way up (so final symbols are offscreen), then tween it down perfectly
        reelState.container.setY(this.startY - topLocalY - (this.rowHeight * 3));
        
        reelState.currentTween = this.scene.tweens.add({
          targets: reelState.container,
          y: this.startY - topLocalY, 
          duration: 600,
          ease: 'Back.easeOut',
          easeParams: [1.2], // Bouncy end
          onUpdate: () => this.wrapSymbols(reelIndex),
          onComplete: () => {
            // Restore normal scales just to be safe
            reelState.symbolObjects.forEach(o => {
              o.emoji.setScale(o.symbolName === 'Scatter' ? 1.1 : 1.0);
            });
            
            // Pop effect for final visible symbols
            this.scene.tweens.add({
               targets: sortedObjects.slice(0, 3).map(o => o.emoji),
               scale: "+=0.2",
               yoyo: true,
               duration: 150,
               repeat: 1
            });

            stoppedCount += 1;
            if (onReelStop) onReelStop(reelIndex);

            if (stoppedCount === this.reelCount && onComplete) {
              onComplete();
            }
          }
        });
      });
    }
  }

  getCellCenter(reelIndex, rowIndex) {
    const x = this.startX + reelIndex * (this.reelWidth + this.gap);
    const y = this.startY + rowIndex * this.rowHeight;
    return { x, y };
  }
}
