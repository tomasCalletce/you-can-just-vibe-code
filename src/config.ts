export const JUMP_DURATION = 600; // ms
export const JUMP_HEIGHT = 4;
export const GROUND_LEVEL = 0.1; // Lowered Y position for GLB model

// Player Movement
export const PLAYER_LATERAL_SPEED = 0.1; // How fast the player moves left/right per frame/update
export const PLAYER_MAX_LATERAL_POSITION = 5; // Max distance from center (half of LANE_WIDTH minus buffer)

export const OBSTACLE_SPEED = 0.25;
export const SPAWN_DISTANCE = -30; // Distance ahead of player where obstacles spawn
export const DESPAWN_DISTANCE = 10; // Distance behind camera where obstacles are removed
export const LANE_WIDTH = 12; // Width for obstacle spawning and player movement space

// Sponsors Banners
export const SPONSOR_BANNER_WIDTH = 4;
export const SPONSOR_BANNER_HEIGHT = 2;
export const SPONSOR_BANNER_Y_POS = 2.5; // Height off the ground
export const SPONSOR_BANNER_SIDE_OFFSET = 8; // Distance from center line
export const SPONSOR_SPAWN_INTERVAL_Z = 25; // Spawn a banner every X units of Z distance 

// Difficulty Levels (time in seconds)
export const DIFFICULTY_LEVELS = [
    { timeThreshold: 0, speed: 0.25, spawnInterval: 500 },   // Nivel 0 (Inicial)
    { timeThreshold: 20, speed: 0.28, spawnInterval: 450 },  // Nivel 1
    { timeThreshold: 45, speed: 0.32, spawnInterval: 400 },  // Nivel 2
    { timeThreshold: 75, speed: 0.36, spawnInterval: 360 },  // Nivel 3
    { timeThreshold: 120, speed: 0.40, spawnInterval: 330 }  // Nivel 4 (Muy rápido)
]; 