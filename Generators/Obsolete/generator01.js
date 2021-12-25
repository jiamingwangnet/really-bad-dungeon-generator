/*
This one doesn't work
Dont use it
*/

class Generator {
    constructor(game, seed, sizeX, sizeY, heightMin, heightMax, widthMin, widthMax, maxRoom, oneInChance) {
        this.game = game;

        this.dungeon = [];

        this.seed = seed;
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.heightMin = heightMin;
        this.heightMax = heightMax;
        this.widthMin = widthMin;
        this.widthMax = widthMax;

        this.maxRoom = maxRoom;

        this.oneInChance = oneInChance;

        this.ListOfRooms = [];
        this.room = 0;

        this.Room = function (x, y, w, h) {
            this.width = w;
            this.height = h;


            this.x1 = x;
            this.x2 = x + w;
            this.y1 = y;
            this.y2 = y + h;

            this.center = [
                Math.floor((x + (x + w)) / 2),
                Math.floor((y + (y + h)) / 2)
            ];

            this.Construct = (dungeon) => {
                let yIndex = 0;

                for (let index = 0; index < dungeon.length; index++) {
                    let y = dungeon[index];
                    yIndex++;

                    if ((index > this.y1 - 1 && index < this.y2)) {
                        for (let index_ = 0; index_ < y.length; index_++) {
                            if ((index_ > this.x1 - 1 && index_ < this.x2) && (yIndex != 0)) {
                                y[index_] = 1;
                            }
                        }
                    }
                }
            }

            this.Intersect = (room) => {
                return (this.x1 <= room.x2 && this.x2 >= room.x1 &&
                     this.y1 <= room.y2 && this.y2 >= room.y1);
            }
        }
    }

    Init() {
        this.game.seed = this.seed;
    }

    PlaceRooms(heightMin, heightMax, widthMin, widthMax) {
        for (let i = 0; i < this.maxRoom; i++) {
            let height = Math.floor(this.game.Random()[0] *
                (heightMax - heightMin + 1)) + heightMin;

            let width = Math.floor(this.game.Random()[0] *
                (widthMax - widthMin + 1)) + widthMin;


            let x = Math.floor(this.game.Random()[0] *
                (this.sizeX - width - 1)) + 1;

            let y = Math.floor(this.game.Random()[0] *
                (this.sizeY - height - 1)) + 1;

            let room = new this.Room(x, y, width, height);

            let failed = false;

            //checks for faliure, could make the dungeon have less rooms

            for (let index in this.ListOfRooms) {
                let otherRoom = this.ListOfRooms[index];
                if (room.Intersect(otherRoom)) {
                    failed = true;
                    break;
                }
            }

            if (!failed) {
                this.room++;
                room.Construct(this.dungeon);



                let newCenter = room.center;


                if (this.ListOfRooms.length != 0) {
                    let prevCenter = this.ListOfRooms[this.ListOfRooms.length - 1].center;

                    if (Math.floor(this.game.Random()[0] * 2) == 1) {
                        this.hCorridor(prevCenter[0], newCenter[0], prevCenter[1]);
                        this.vCorridor(prevCenter[1], newCenter[1], newCenter[0]);
                    } else {
                        this.vCorridor(prevCenter[1], newCenter[1], prevCenter[0]);
                        this.hCorridor(prevCenter[0], newCenter[0], newCenter[1]);

                    }
                }

                this.ListOfRooms.push(room);
            }

        }
    }

    hCorridor(x1, x2, y) {
        for (let x = Math.min(x1, x2); x < Math.max(x1, x2) + 1; x++) {
            if (x == Math.min(x1, x2)) {
                this.dungeon[y][x] = 5;
            } else {
                this.dungeon[y][x] = 2;
            }
        }
    }

    vCorridor(y1, y2, x) {
        for (let y = Math.min(y1, y2); y < Math.max(y1, y2) + 1; y++) {
            if (y == Math.min(y1, y2)) {
                this.dungeon[y][x] = 5;
            } else {
                this.dungeon[y][x] = 2;
            }
        }
    }

    AddObjects() {
        for (let index = 0; index < this.dungeon.length; index++) {
            let y = this.dungeon[index];

            for (let index_ = 0; index_ < y.length; index_++) {
                if (y[index_] == 1 || y[index_] == 2) {
                    let chance = Math.floor(this.game.Random() * (this.oneInChance)) + 1;

                    if (chance == 1) {
                        y[index_] = 3;
                    }
                }
            }
        }
    }

    GenerateData() {
        // for (let i = 0; i < this.sizeY; i++) {
        //     let x = [];
        //     for (let i_ = 0; i_ < this.sizeX; i_++) {
        //         x.push(0);
        //     }
        //     this.dungeon.push(x);
        // }
        this.dungeon = new Array(this.sizeY); 
        for (let i = 0; i < this.sizeY; ++i) {
            this.dungeon[i] = new Array(this.sizeX).fill(0);
        }

        this.PlaceRooms(this.heightMin, this.heightMax, this.widthMin, this.widthMax);
        this.AddObjects();

        let output = "";

        for (let index in this.dungeon) {
            let y = this.dungeon[index];
            for (let index_ in y) {
                let x = y[index_];

                if (x == 1) {
                    output += "░";
                } else if (x == 2) {
                    output += "[";
                } else if (x == 3) {
                    output += "&";
                } else if (x == 5) {
                    output += "@"
                } else {
                    output += "█";
                }
            }

            output += "\n";
        }

        
        return output;
    }
}

String.prototype.hashCode = function () {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

let game = {
    seed: "asdfasdfasdfasdfasdfasdfasdffadfad",
    Random: (n = 1, a = 1103515245, b = 12345, m = 0x80000000) =>  {
        const results = []
        if (typeof game.seed === "string") {
            game.seed = Math.abs(game.seed.hashCode());
        }
        for (let i = 0; i < n; i++) {
            game.seed = (a * game.seed + b) % m
            results.push(parseFloat("0." + game.seed))
        }
        return results;
    }
}

let dungeon = new Generator(game, "asdfasdfasdfasdfasdfasdfasdffadfad", 100, 100, 7, 7, 7, 7, 1000, 3).GenerateData();
console.log(dungeon);