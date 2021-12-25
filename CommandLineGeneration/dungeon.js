const game = require('../lib/gameLib');
const gen = require('../Generators/generator02');

console.time("generate");
let generator = new gen.DGenerator(game.game,
    { // dungeon settings
        width: 80,
        height: 80,
        offsetChance: 0.25,
        specialDensity: 0.25,
        finishes: 5,
        roomSizes: {
            MaxRoomWidth: 10,
            MinRoomWidth: 5,
            MaxRoomHeight: 10,
            MinRoomHeight: 5
        },
        corridorSizes: {
            MaxLength: 8,
            MinLength: 3,
            width: 2
        },
        repeats: 45, //how many times will the generator generate the rooms
        seed: 234524351
    }
    );
generator.init();
generator.generate();
generator.textOutput();
generator.fileOutput();
console.timeEnd("generate");
console.log("data written to data.txt");