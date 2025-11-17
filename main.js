import SelectionScene from './scenes/SelectionScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#1b1b1b',
    width: 800,
    height: 600,
    scene: [
        SelectionScene, GameScene
    ],
    scale : {
        mode: Phaser.Scale.FIT,
        width: 800,
        height: 600
    },
};

const game = new Phaser.Game(config);
game.scene.start('load');