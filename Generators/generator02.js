const fs = require('fs');

exports.DGenerator = class {
    /**
     * @param {object} game 
     */
    constructor(game,
        // information on the dungeon
        settings = {
            width: 150,
            height: 150,
            offsetChance: 0.15,
            specialDensity: 0.107,
            finishes: 5,
            roomSizes: {
                MaxRoomWidth: 8,
                MinRoomWidth: 4,
                MaxRoomHeight: 8,
                MinRoomHeight: 4
            },
            corridorSizes: {
                MaxLength: 7,
                MinLength: 2,
                width: 2
            },
            repeats: 30, //how many times will the generator generate the rooms
            seed: 25234
        }) {
        this.settings = settings;
        this.game = game;

        this.cellValue = { //defines the number a cell state is represented by
            empty: 0,
            filled: 1,
            special: 2,
            spawn: 3,
            end: 4
        }

        this.sideNumber = { //defines the number a side is represented by
            top: 0,
            down: 1,
            right: 2,
            left: 3
        }

        this.Carver = class {
            /**
             * 
             * @param {number} x 
             * @param {number} y 
             * @param {number} width 
             * @param {number} height 
             * @param {DGenerator} generator
             */
            constructor(x, y, width, height, generator, specialDensity = 0.107) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.specialDensity = specialDensity == 0 ? NaN : specialDensity;
                this.isSpawnRoom = false;
                this.nexts = []; // defines what branches out from this room/corridor

                this.generator = generator; // a reference to the generator is needed to access the outer scope
                this.center = {
                    x: Math.round((width) / 2) + x,
                    y: Math.round((height) / 2) + y
                }
            }

            collided(room) { //check room collision
                return this.x - 1 < room.x + room.width &&
                    this.x + this.width + 1 > room.x &&
                    this.y - 1 < room.y + room.height &&
                    this.y + this.height + 1 > room.y;
            }

            construct(dungeon) { //constructs the room by converting the data into numbers
                let y = this.y, x = this.x;

                for (let i = 0; i < this.height * this.width; i++) {
                    if (i % this.width == 0) {
                        y++;
                        x = this.x;
                    }

                    if (Math.floor(this.generator.game.Random()[0] / this.specialDensity) == 0)
                        dungeon[y][x] = this.generator.cellValue.special;
                    else
                        dungeon[y][x] = this.generator.cellValue.empty;


                    x++;
                }

                if (this.isSpawnRoom) dungeon[this.center.y][this.center.x] = this.generator.cellValue.spawn;
            }
        }
    }

    init() {
        this.game.seed = this.settings.seed;

        // sets the dungeon to an array filled with [height] amount of arrays with [width] amount of 0s
        const height = this.settings.height, width = this.settings.width;

        this.dungeon = new Array(height); //the array that stores the dungeon, will be filled after the dungeon has been generated
        for (let i = 0; i < height; ++i) {
            this.dungeon[i] = new Array(width).fill(this.cellValue.filled);
        }

        //turns the propeties into constants
        Object.freeze(this.sideNumber);
        Object.freeze(this.cellValue);
    }


    /**
     * @returns {Array<Array<number>}
     */


    generate() {
        let rooms = []; //create a temporary array of rooms
        let corridors = []; // create a temporary array of corridors

        //create a list of pending rooms a corridors waiting to be connected

        let pendingRooms = [];
        let pendingCorridors = [];

        //Generate the first room in the center

        let room = new this.Carver(
            //gets the center of the map
            Math.floor(this.settings.width / 2),
            Math.floor(this.settings.height / 2),

            Math.floor(this.game.Random()[0] * (this.settings.roomSizes.MaxRoomWidth - this.settings.roomSizes.MinRoomWidth + 1))
            + this.settings.roomSizes.MinRoomWidth, // randomises the room width

            Math.floor(this.game.Random()[0] * (this.settings.roomSizes.MaxRoomHeight - this.settings.roomSizes.MinRoomHeight + 1))
            + this.settings.roomSizes.MinRoomHeight, // randomises the room height
            this
        );
        room.isSpawnRoom = true;

        pendingRooms.push(room);

        for (let i = 0, len = this.settings.repeats; i < len; ++i) {
            let lastRoom = room;

            //#region corridor generation
            //extend corridors from each free side of the pending rooms by looping though them
            for (let i = 0, len = pendingRooms.length; i < len; ++i) {
                let currentRoom = pendingRooms[i];

                for (let side = 0; side < 4; side++) { //loops for each side
                    // if the side if taken, continue
                    if (currentRoom.takenSide == side) continue; //since the room side is defined by a number the iterator j can be used to check the sides

                    // create corridor
                    // the switch determines which side to do and the corridor size
                    let width = this.settings.corridorSizes.width, height = this.settings.corridorSizes.width, x = 0, y = 0;

                    if (side == this.sideNumber.top || side == this.sideNumber.down) {
                        // the height and x for top and down facing corridors are the same
                        height = Math.floor(this.game.Random()[0] * (this.settings.corridorSizes.MaxLength - this.settings.corridorSizes.MinLength + 1))
                            + this.settings.corridorSizes.MinLength; //random height up
                        x = currentRoom.center.x; // set the x to the room's x center

                        if (side == this.sideNumber.top) // y for the top facing
                            y = currentRoom.y - height; // the y has to be height amount up from the room's y
                        else // y for the down facing
                            y = currentRoom.y + currentRoom.height;

                    } else { // does the same for right and left facing corridors
                        // the width and y for the left and right facing corridors are the same
                        width = (Math.floor(this.game.Random()[0] * (this.settings.corridorSizes.MaxLength - this.settings.corridorSizes.MinLength + 1))
                            + this.settings.corridorSizes.MinLength); //random width right
                        y = currentRoom.center.y;

                        if (side == this.sideNumber.right) // x for the right facing
                            x = currentRoom.x + currentRoom.width;
                        else // x for the left facing
                            x = currentRoom.x - width;
                    }

                    if (x + width >= this.settings.width || x <= 0 ||
                        y + height >= this.settings.height || y <= 0)  // checks if the corridor goes over the width and height limit, if it does, skip
                        continue;

                    let corridor = new this.Carver(x, y, width, height, this, 0);
                    corridor.facing = side;
                    currentRoom.nexts.push(corridor); // add this corridor to the current room's connectons

                    pendingCorridors.push(corridor); //adds corridor to the pending array
                }
                // push the current room into the rooms array
                rooms.push(currentRoom);
                lastRoom = currentRoom; // sets the last room to the current room
            }
            pendingRooms = [];
            //#endregion

            //#region room generation
            // at corridor end generate a room

            for (let i = 0, len = pendingCorridors.length; i < len; ++i) {
                let corridor = pendingCorridors[i];
                const maxW = this.settings.roomSizes.MaxRoomWidth, // makes writing the random shorter
                    minW = this.settings.roomSizes.MinRoomWidth,
                    maxH = this.settings.roomSizes.MaxRoomHeight,
                    minH = this.settings.roomSizes.MinRoomHeight;

                let offset = Math.floor(this.game.Random()[0] / this.settings.offsetChance) == 0 ? Math.floor(this.game.Random()[0] * 3) - 1 : 0;

                let x = offset, y = offset,
                    width = Math.floor(this.game.Random()[0] * (maxW - minW + 1)) + minW,
                    height = Math.floor(this.game.Random()[0] * (maxH - minH + 1)) + minH,
                    takenSide = 0;

                // placement calculation
                switch (corridor.facing) {
                    case this.sideNumber.down:
                        x += corridor.x - Math.round(width / 2); //set x to corridor.x and move it back width/2 so its in the middle
                        y = corridor.y + corridor.height; // set y to the bottom of the corridor
                        takenSide = this.sideNumber.top;
                        break;

                    case this.sideNumber.top:
                        x += corridor.x - Math.round(width / 2);
                        y = corridor.y - height; // set y to corridor.y minus the height so it sits on top of the 
                        takenSide = this.sideNumber.down;
                        break;
                    case this.sideNumber.left:
                        x = corridor.x - width; // set x to corridor x and set it back width so it isn't inside the corridor
                        y += corridor.y - Math.round(height / 2);
                        takenSide = this.sideNumber.right;
                        break;
                    case this.sideNumber.right:
                        x = corridor.x + corridor.width; // set x to corridor x and set it back width so it isn't inside the corridor
                        y += corridor.y - Math.round(height / 2);
                        takenSide = this.sideNumber.left;
                        break;
                }

                let newRoom = new this.Carver(x, y, width, height, this);
                newRoom.takenSide = takenSide; // the side that has a corridor connected to it

                let skip = false;
                for (let i = 0, len = rooms.length; i < len; i++) {
                    if (newRoom.collided(rooms[i])) { // checks for room collision. If there is collision the current room will be skipped
                        skip = true;
                    }
                }

                if (x + width >= this.settings.width || x <= 0 ||
                    y + height >= this.settings.height || y <= 0) { // checks if the room goes over the limit and skips if it does
                    skip = true;
                }

                for (let i = 0, len = pendingRooms.length; i < len; i++) {
                    if (newRoom.collided(pendingRooms[i])) { // checks for collision in the pending rooms
                        skip = true;
                    }
                }

                if (skip) {
                    // remove the corridor from the connections because skipping this room will also skip the corridor
                    const index = lastRoom.nexts.indexOf(corridor);
                    if (index > -1) lastRoom.nexts.splice(index, 1);

                    continue;
                }
                pendingRooms.push(newRoom); // adds the room into in the pending rooms array
                corridor.nexts.push(newRoom); // adds this room into the corridor connections
                
                corridors.push(corridor); // pushes the current corridor
            }
            pendingCorridors = [];
            //#endregion
        }

        // convert the rooms into numbers and fill it into this.dungeon
        for (let i = 0, len = rooms.length; i < len; i++) {
            // convert rooms
            let room = rooms[i];

            room.construct(this.dungeon);
        }

        for (let i = 0, len = corridors.length; i < len; i++) {
            // convert corridors
            let room = corridors[i];

            room.construct(this.dungeon);
        }
        
        let counter = 0;
        for(let i = 0, len = rooms.length; i < len; i++) {
            let currRoom = rooms[i];

            if (counter < this.settings.finishes) {
                if (currRoom.nexts.length == 0) {
                    this.dungeon[currRoom.center.y][currRoom.center.x] = this.cellValue.end;
                    counter++;
                }
            } else {
                break;
            }
        } 

        return this.dungeon; // return the dungeon
    }

    textOutput() {
        let result = "";

        for (let i = 0, len = this.dungeon.length; i < len; i++) {
            for (let j = 0, len_ = this.dungeon[i].length; j < len_; j++) {
                let currentCell = this.dungeon[i][j];
                //convert the numbers into spaces and blocks
                switch (currentCell) {
                    //add the converted string into the variable result
                    case this.cellValue.filled:
                        result += "#";
                        break;
                    case this.cellValue.empty:
                        result += " ";
                        break;
                    case this.cellValue.special:
                        result += "@";
                        break;
                }
            }
            // break the current line
            result += "\n";
        }

        console.log(result); //logs the result
    }

    fileOutput() {
        //writes the dungeon data to a file called data.txt
        fs.writeFile("./data.txt", `${this.settings.width}x${this.settings.height}\n` + this.dungeon.join('').split(',').join(''), err => {
            if (err) throw err;
            console.log("done");
        });
    }
}