import * as THREE from 'three';
import { scene } from './scene';
import { createCactusModel } from './models';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, LANE_WIDTH } from './config';
import { isGameRunning, stopGameFlow, getCurrentObstacleSpeed } from './game';
import { getPlayerBoundingBox } from './player';
import { socket } from './network'; // For broadcasting spawns and receiving remote spawns
import { trySpawnCollectible } from './collectibles'; // Import the collectible spawn function
import { triggerSponsorSpawn } from './sponsors'; // Import the sponsor spawn trigger
import { trySpawnSponsorCollectible } from './sponsor_collectibles'; // Import new spawn function

export let obstacles: THREE.Object3D[] = [];
export let remoteObstacles: { [key: string]: THREE.Object3D } = {}; // Track obstacles spawned by others
let obstacleModelTemplate: THREE.Object3D | null = null;
export let obstacleSpawnInterval: ReturnType<typeof setInterval> | null = null;

export async function initObstacles() {
    obstacleModelTemplate = await createCactusModel();
    console.log("Cactus obstacle template created");
}

// Export setter for interval ID for game.ts to manage
export function setObstacleSpawnInterval(intervalId: ReturnType<typeof setInterval> | null) {
    obstacleSpawnInterval = intervalId;
}

export function spawnObstacle() {
    if (!isGameRunning || !obstacleModelTemplate) return;

    const obstacleCount = Math.random() < 0.5 ? (Math.random() < 0.3 ? 4 : (Math.random() < 0.5 ? 3 : 2)) : 1;
    let baseZ = SPAWN_DISTANCE; // Base Z for this spawn group

    for (let i = 0; i < obstacleCount; i++) {
        let xPos;
        if (obstacleCount > 1) {
            const segmentWidth = LANE_WIDTH / obstacleCount;
            const segmentStart = -LANE_WIDTH / 2 + i * segmentWidth;
            xPos = segmentStart + Math.random() * segmentWidth;
        } else {
            xPos = Math.random() * LANE_WIDTH - LANE_WIDTH / 2;
        }

        const obstacle = obstacleModelTemplate.clone();
        const zOffset = obstacleCount > 1 ? Math.random() * 3 - 1.5 : 0;
        const finalZ = SPAWN_DISTANCE + zOffset;
        obstacle.position.set(xPos, 0, finalZ);
        baseZ = Math.min(baseZ, finalZ); // Keep track of the nearest Z for collectible spawning

        scene.add(obstacle);
        obstacles.push(obstacle);

        // Generate a unique ID for broadcasting
        const obstacleId = THREE.MathUtils.generateUUID();
        obstacle.userData.id = obstacleId; // Store ID on the object

        // Broadcast obstacle spawn to other players
        if (socket && socket.connected) {
            socket.emit("obstacleSpawn", {
                id: obstacleId,
                position: { x: obstacle.position.x, y: obstacle.position.y, z: obstacle.position.z },
            });
        }
    }

    // After spawning obstacles, try spawning items
    trySpawnCollectible(baseZ);
    triggerSponsorSpawn(baseZ); // This is for the large visual banners
    trySpawnSponsorCollectible(baseZ); // Try to spawn the small sponsor collectible
}

// Called by network.ts when receiving a remote obstacle spawn event
export function spawnRemoteObstacle(id: string, position: { x: number, y: number, z: number }) {
    if (obstacleModelTemplate && !remoteObstacles[id] && !obstacles.find(o => o.userData.id === id)) {
        const obstacle = obstacleModelTemplate.clone();
        obstacle.position.set(position.x, position.y, position.z);
        obstacle.userData.id = id; // Store the received ID

        scene.add(obstacle);
        obstacles.push(obstacle); // Add to the main list for movement/collision
        remoteObstacles[id] = obstacle; // Track it as remote
        console.log(`Spawned remote obstacle ${id}`);
    }
}

// Called in the main animation loop
export function updateObstacles() {
    if (!isGameRunning) return;

    const playerBox = getPlayerBoundingBox();
    const currentSpeed = getCurrentObstacleSpeed(); // Get current speed

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.position.z += currentSpeed; // Use current speed

        // Check collision
        if (checkCollision(playerBox, obstacle)) {
            stopGameFlow(); // Call stop game function from game.ts
            break; // Stop checking further obstacles this frame
        }

        // Despawn
        if (obstacle.position.z > DESPAWN_DISTANCE) {
            removeObstacle(obstacle, i);
        }
    }
}

function checkCollision(playerBox: THREE.Box3, obstacle: THREE.Object3D): boolean {
    const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);
    obstacleBoundingBox.expandByScalar(-0.15); // Shrink obstacle box slightly
    return playerBox.intersectsBox(obstacleBoundingBox);
}

function removeObstacle(obstacle: THREE.Object3D, index: number) {
    const id = obstacle.userData.id;
    if (id && remoteObstacles[id]) {
        delete remoteObstacles[id];
    }
    scene.remove(obstacle);
    obstacles.splice(index, 1);
}

// Clear all obstacles (e.g., on game restart)
export function clearObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        scene.remove(obstacles[i]);
    }
    obstacles.length = 0;
    remoteObstacles = {}; // Clear remote tracking map
} 