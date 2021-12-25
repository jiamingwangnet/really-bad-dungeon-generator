using System.Collections.Generic;
using System;
using UnityEngine;
using System.Linq;
using Random = UnityEngine.Random;

[CreateAssetMenu(fileName = "Dungeon", menuName = "DungeonGenerator", order = 1)]
public class DungeonGenerator : ScriptableObject
{
    [Header("Settings")]
    public int Dwidth = 100;
    public int Dheight = 100;
    [Space(10)]
    public int maxRoomWidth = 8;
    public int minRoomWidth = 4;
    [Space(5)]
    public int maxRoomHeight = 8;
    public int minRoomHeight = 4;
    [Space(10)]
    public int maxCorridorLength = 7;
    public int minCorridorLength = 2;
    public int corridorWidth = 2;
    [Space(10)]
    public int repeats = 20;
    public float offsetChance = 0.15f;
    public float specialDensity = 0.1f;
    public int finishes = 5;
    [Space(10)]
    public int seed = 25234;
    public int OriginalSeed
    {
        get
        {
            return seed - iteration;
        }
    }
    [Space(10)]
    public int iteration = 0;

    int[][] dungeon;

    public enum CellValue
    {
        empty = 0,
        filled = 1,
        special = 2,
        spawn = 3,
        end = 4
    }

    public enum SideNumber
    {
        top = 0,
        down = 1,
        right = 2,
        left = 3
    }

    class Carver
    {
        public int x;
        public int y;
        public int width;
        public int height;
        public DungeonGenerator generator;
        public float specialDensity;
        public Vector2Int center;
        public int? takenSide;
        public int? facing;
        public bool isSpawnRoom;
        public List<Carver> nexts = new List<Carver>();

        public Carver(int x, int y, int width, int height, DungeonGenerator Dgenerator, float specialDensityVal = 0.1f)
        {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            generator = Dgenerator;
            specialDensity = specialDensityVal == 0 ? float.NaN : specialDensityVal;
            isSpawnRoom = false;

            center = new Vector2Int((int) Math.Round((double) this.width / 2, MidpointRounding.AwayFromZero) + x, (int)Math.Round((double)this.height / 2, MidpointRounding.AwayFromZero) + y);
        }

        public bool Collided(Carver room)
        {
            return x - 1 < room.x + room.width &&
                x + width + 1 > room.x &&
                y - 1 < room.y + room.height &&
                y + height + 1 > room.y;
        }

        public void Construct(int[][] dungeon)
        {
            int y = this.y, x = this.x;

            for (int i = 0; i < height * width; i++)
            {
                if (i % width == 0)
                {
                    y++;
                    x = this.x;
                }

                if (Mathf.Floor(Random.Range(0f, 0.999999f) / specialDensity) == 0)
                    dungeon[y][x] = (int)CellValue.special;
                else
                    dungeon[y][x] = (int)CellValue.empty;

                x++;
            }

            if (isSpawnRoom) dungeon[center.y][center.x] = (int)CellValue.spawn;
        }
    }

    public void Init()
    {
        Random.InitState(seed);

        dungeon = new int[Dheight][];
        for(int i = 0; i < Dheight; i++)
        {
            int[] widthArr = new int[Dwidth];
            for(int j = 0; j < Dwidth; j++)
            {
                widthArr[j] = (int)CellValue.filled;
            }
            dungeon[i] = widthArr;
        }
    }

    public int[][] Generate()
    {
        List<Carver> rooms = new List<Carver>();
        List<Carver> corridors = new List<Carver>();

        List<Carver> pendingRooms = new List<Carver>();
        List<Carver> pendingCorridors = new List<Carver>();

        Carver room = new Carver(
            Mathf.FloorToInt(Dwidth / 2),
            Mathf.FloorToInt(Dheight / 2),

            Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxRoomWidth - minRoomWidth + 1)) + minRoomWidth,
            Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxRoomHeight - minRoomHeight + 1)) + minRoomHeight,
            this,
            specialDensity
        );
        room.isSpawnRoom = true;
        pendingRooms.Add(room);

        for (int i = 0; i < repeats; i++)
        {
            Carver lastRoom = room;

            #region corridor generation
            foreach(Carver currentRoom in pendingRooms)
            {
                for(int side = 0; side < 4; side++)
                {
                    if (currentRoom.takenSide == side) continue;

                    int width = corridorWidth, height = corridorWidth, x = 0, y = 0;

                    if (side == (int)SideNumber.top || side == (int)SideNumber.down)
                    {
                        height = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxCorridorLength - minCorridorLength + 1)) + minCorridorLength;
                        x = currentRoom.center.x;
                        
                        if (side == (int)SideNumber.top)
                            y = currentRoom.y - height;
                        else
                            y = currentRoom.y + currentRoom.height;
                    }
                    else
                    {
                        width = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxCorridorLength - minCorridorLength + 1)) + minCorridorLength;
                        y = currentRoom.center.y;

                        if (side == (int)SideNumber.right)
                            x = currentRoom.x + currentRoom.width;
                        else
                            x = currentRoom.x - width;
                    }

                    if (x + width >= Dwidth || x <= 0 ||
                        y + height >= Dheight || y <= 0) continue;

                    Carver corridor = new Carver(x, y, width, height, this, 0);
                    corridor.facing = side;
                    currentRoom.nexts.Add(corridor);

                    pendingCorridors.Add(corridor);
                }
                rooms.Add(currentRoom);
                lastRoom = currentRoom;
            }
            pendingRooms = new List<Carver>();
            #endregion

            #region room generation
            foreach(Carver corridor in pendingCorridors)
            {
                int offset = Mathf.FloorToInt(Random.Range(0f, 0.999999f) / offsetChance) == 0 ? Mathf.FloorToInt(Random.Range(0f, 0.999999f) * 3) - 1 : 0;

                int x = offset, y = offset,
                    width = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxRoomWidth - minRoomWidth + 1)) + minRoomWidth,
                    height = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxRoomHeight - minRoomHeight + 1)) + minRoomHeight,
                    takenSide = 0;

                switch (corridor.facing)
                {
                    case (int)SideNumber.down:
                        x += corridor.x - (int)Math.Round((double)width / 2, MidpointRounding.AwayFromZero);
                        y = corridor.y + corridor.height;
                        takenSide = (int)SideNumber.top;
                        break;

                    case (int)SideNumber.top:
                        x += corridor.x - (int)Math.Round((double)width / 2, MidpointRounding.AwayFromZero);
                        y = corridor.y - height;
                        takenSide = (int)SideNumber.down;
                        break;

                    case (int)SideNumber.left:
                        x = corridor.x - width;
                        y += corridor.y - (int)Math.Round((double)height / 2, MidpointRounding.AwayFromZero);
                        takenSide = (int)SideNumber.right;
                        break;

                    case (int)SideNumber.right:
                        x = corridor.x + corridor.width;
                        y += corridor.y - (int)Math.Round((double)height / 2, MidpointRounding.AwayFromZero);
                        takenSide = (int)SideNumber.left;
                        break;
                }

                Carver newRoom = new Carver(x, y, width, height, this, specialDensity);
                newRoom.takenSide = takenSide;

                bool skip = false;

                foreach (Carver currRoom in rooms)
                {
                    if (newRoom.Collided(currRoom))
                    {
                        skip = true;
                    }
                }

                foreach (Carver pendRoom in pendingRooms)
                {
                    if (newRoom.Collided(pendRoom))
                    {
                        skip = true;
                    }
                }

                if (x + width >= Dwidth || x <= 0 ||
                   y + height >= Dheight || y <= 0)
                {
                    skip = true;
                }

                if (skip)
                {
                    lastRoom.nexts.Remove(corridor);
                    continue;
                }

                pendingRooms.Add(newRoom);
                corridor.nexts.Add(newRoom);

                corridors.Add(corridor);
            }
            pendingCorridors = new List<Carver>();
            #endregion
        }

        foreach(Carver currRoom in rooms)
        {
            currRoom.Construct(dungeon);
        }

        foreach (Carver corridor in corridors)
        {
            corridor.Construct(dungeon);
        }

        int counter = 0;
        foreach (Carver currRoom in rooms)
        {
            Debug.Log(currRoom.nexts.Count);

            if (counter < finishes)
            {
                if (currRoom.nexts.Count == 0)
                {
                    dungeon[currRoom.center.y][currRoom.center.x] = (int)CellValue.end;
                    counter++;
                }
            }
            else
            {
                break;
            }
        }
        return dungeon;
    }

    public void TextOutput()
    {
        string result = "";
        foreach(int[] y in dungeon)
        {
            foreach(int x in y)
            {
                result += x.ToString();
            }
        }

        Debug.Log(result);
    }
}
