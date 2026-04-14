import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import BonusScene from './scenes/BonusScene.js';
import './styles.css';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 900,
  height: 640,
  backgroundColor: '#0d1117',
  scene: [GameScene, BonusScene],
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  }
};

new Phaser.Game(config);
