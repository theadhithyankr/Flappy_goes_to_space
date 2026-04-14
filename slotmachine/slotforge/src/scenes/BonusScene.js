import Phaser from 'phaser';

export default class BonusScene extends Phaser.Scene {
  constructor() {
    super('BonusScene');
  }

  create() {
    const { width } = this.scale;

    this.bannerContainer = this.add.container(width / 2, 70);

    const bg = this.add
      .rectangle(0, 0, 320, 64, 0x9f2d2d, 0.95)
      .setStrokeStyle(3, 0xf2c55f, 1)
      .setOrigin(0.5);

    const label = this.add
      .text(0, 0, 'FREE SPINS', {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: 30,
        color: '#ffe8a3',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.bannerContainer.add([bg, label]);
    this.bannerContainer.setVisible(false);
    this.bannerContainer.setAlpha(0);

    this.game.events.on('show-free-spins-banner', this.showBanner, this);
  }

  showBanner() {
    this.bannerContainer.setVisible(true);
    this.bannerContainer.setAlpha(1);
    this.bannerContainer.setScale(0.8);

    this.tweens.add({
      targets: this.bannerContainer,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: this.bannerContainer,
      alpha: 0,
      duration: 700,
      delay: 1100,
      ease: 'Quad.easeIn',
      onComplete: () => this.bannerContainer.setVisible(false)
    });
  }
}
