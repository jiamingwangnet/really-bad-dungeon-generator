const game = require('../lib/gameLib');
const gen = require('../Generators/generator02');

console.time("generate");
let generator = new gen.DGenerator(game.game,
    { //dungeon settings
        width: 80,
        height: 80,
        offsetChance: 0.15,
        roomSizes: {
            MaxRoomWidth: 8,
            MinRoomWidth: 4,
            MaxRoomHeight: 8,
            MinRoomHeight: 4
        },
        corridorSizes: {
            MaxLength: 7,
            MinLength: 2,
        },
        repeats: 30, //how many times will the generator generate the rooms
        seed: 7654321
    }
    );
generator.init();
generator.generate();
generator.textOutput();
generator.fileOutput();
console.timeEnd("generate");
console.log("data written to data.txt");