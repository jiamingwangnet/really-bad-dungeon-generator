const game = require('./gameLib');
const gen = require('./generator02');

console.time("generate");
let generator = new gen.DGenerator(game.game);
generator.init();
generator.generate();
generator.textOutput();
generator.fileOutput();
console.timeEnd("generate");