using System.Collections.Generic;
using System;
using UnityEngine;
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
    [Space(10)]
    public int repeats = 20;
    public float offsetChance = 0.15f;
    public float specialDensity = 0.1f;
    public int finishes = 5;
    [Space(10)]
    public int seed = 25234;

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

        public Carver(int xVal, int yVal, int widthVal, int heightVal, DungeonGenerator Dgenerator, float specialDensityVal = 0.1f)
        {
            x = xVal;
            y = yVal;
            width = widthVal;
            height = heightVal;
            generator = Dgenerator;
            specialDensity = specialDensityVal == 0 ? float.NaN : specialDensityVal;
            isSpawnRoom = false;
            takenSide = null;
            facing = null;

            center = new Vector2Int((int) Math.Round((double) width / 2, MidpointRounding.AwayFromZero) + x, (int)Math.Round((double)height / 2, MidpointRounding.AwayFromZero) + y);
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
            for(int startY = y; startY < height + y; startY++)
            {
                for(int startX = x; startX < width + x; startX++)
                {
                    if(Mathf.Floor(Random.Range(0f, 0.999999f) / specialDensity) == 0)
                    {
                        dungeon[startY][startX] = (int)CellValue.special;
                    } else
                    {
                        dungeon[startY][startX] = (int)CellValue.empty;
                    }
                }
            }
            if (isSpawnRoom)
            {
                dungeon[center.y][center.x] = (int)CellValue.spawn;
            }
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

                    int width = 0, height = 0, x = 0, y = 0, facing = 0;

                    switch (side)
                    {
                        case (int)SideNumber.top:
                            width = 2;
                            height = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxCorridorLength - minCorridorLength + 1)) + minCorridorLength;
                            x = currentRoom.center.x;
                            y = currentRoom.y - height;
                            facing = (int)SideNumber.top;
                            break;

                        case (int)SideNumber.down:
                            width = 2;
                            height = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxCorridorLength - minCorridorLength + 1)) + minCorridorLength;
                            x = currentRoom.center.x;
                            y = currentRoom.y + currentRoom.height;
                            facing = (int)SideNumber.down;
                            break;

                        case (int)SideNumber.right:
                            width = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxCorridorLength - minCorridorLength + 1)) + minCorridorLength;
                            height = 2;
                            x = currentRoom.x + currentRoom.width;
                            y = currentRoom.center.y;
                            facing = (int)SideNumber.right;
                            break;

                        case (int)SideNumber.left:
                            width = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxCorridorLength - minCorridorLength + 1)) + minCorridorLength;
                            height = 2;
                            x = currentRoom.x - width;
                            y = currentRoom.center.y;
                            facing = (int)SideNumber.left;
                            break;
                    }

                    bool skip = false;

                    if (x + width >= Dwidth || x <= 0)
                    {
                        skip = true;
                    }

                    if (y + height >= Dheight || y <= 0)
                    {
                        skip = true;
                    }

                    if (skip) continue;
                    Carver corridor = new Carver(x, y, width, height, this, 0);
                    corridor.facing = facing;
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
                int x = 0, y = 0,
                    width = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxRoomWidth - minRoomWidth + 1)) + minRoomWidth,
                    height = Mathf.FloorToInt(Random.Range(0f, 0.999999f) * (maxRoomHeight - minRoomHeight + 1)) + minRoomHeight,
                    takenSide = 0;

                int offset = Mathf.FloorToInt(Random.Range(0f, 0.999999f) / offsetChance) == 0 ? Mathf.FloorToInt(Random.Range(0f, 0.999999f) * 3) - 1 : 0;

                switch (corridor.facing)
                {
                    case (int)SideNumber.down:
                        x = corridor.x - (int)Math.Round((double)width / 2, MidpointRounding.AwayFromZero) + offset;
                        y = corridor.y + corridor.height;
                        takenSide = (int)SideNumber.top;
                        break;

                    case (int)SideNumber.top:
                        x = corridor.x - (int)Math.Round((double)width / 2, MidpointRounding.AwayFromZero) + offset;
                        y = corridor.y - height;
                        takenSide = (int)SideNumber.down;
                        break;

                    case (int)SideNumber.left:
                        x = corridor.x - width;
                        y = corridor.y - (int)Math.Round((double)height / 2, MidpointRounding.AwayFromZero) + offset;
                        takenSide = (int)SideNumber.right;
                        break;

                    case (int)SideNumber.right:
                        x = corridor.x + corridor.width;
                        y = corridor.y - (int)Math.Round((double)height / 2, MidpointRounding.AwayFromZero) + offset;
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

                if (x + width >= Dwidth || x <= 0 ||
                   y + height >= Dheight || y <= 0)
                {
                    skip = true;
                }

                foreach (Carver pendRoom in pendingRooms)
                {
                    if (newRoom.Collided(pendRoom))
                    {
                        skip = true;
                    }
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

        if(pendingCorridors.Count != 0)
        {
            foreach(Carver pendCorridor in pendingCorridors)
            {
                corridors.Add(pendCorridor);
            }
        }

        if (pendingRooms.Count != 0)
        {
            foreach (Carver pendRoom in pendingRooms)
            {
                corridors.Add(pendRoom);
            }
        }

        foreach(Carver currRoom in rooms)
        {
            currRoom.Construct(dungeon);
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

        foreach (Carver corridor in corridors)
        {
            corridor.Construct(dungeon);
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
