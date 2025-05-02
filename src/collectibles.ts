import * as THREE from 'three';
import { scene } from './scene';
import { createDataPointModel } from './models';
import { LANE_WIDTH, DESPAWN_DISTANCE, OBSTACLE_SPEED, DATA_POINT_SPAWN_CHANCE, POINTS_PER_DATA_POINT } from './config';
import { isGameRunning, addScore } from './game';
import { getPlayerBoundingBox } from './player';
import { socket } from './network'; // To broadcast collection

let dataPointModelTemplate: THREE.Object3D | null = null;
const collectibles: THREE.Object3D[] = [];

export async function initCollectibles() {
    dataPointModelTemplate = await createDataPointModel();
    console.log("Data point collectible template created");
}

// Function to attempt spawning collectibles (call this alongside obstacle spawning)
export function trySpawnCollectible(baseZ: number) {
    if (!isGameRunning || !dataPointModelTemplate || Math.random() > DATA_POINT_SPAWN_CHANCE) {
        return;
    }

    const collectible = dataPointModelTemplate.clone();

    // Spawn at a random lane position, slightly above ground
    const xPos = Math.random() * LANE_WIDTH - LANE_WIDTH / 2;
    const yPos = 0.7; // Adjust height as needed
    const zPos = baseZ + Math.random() * 2 - 1; // Spawn near the obstacle Z

    collectible.position.set(xPos, yPos, zPos);
    collectible.userData.id = THREE.MathUtils.generateUUID(); // Unique ID for network events

    scene.add(collectible);
    collectibles.push(collectible);
}

// Called in the main animation loop
export function updateCollectibles() {
    if (!isGameRunning) return;

    const playerBox = getPlayerBoundingBox();

    for (let i = collectibles.length - 1; i >= 0; i--) {
        const collectible = collectibles[i];

        // Optional: Add animation (e.g., rotation)
        collectible.rotation.y += 0.02;
        collectible.rotation.x += 0.01;

        // Move towards player like obstacles (or make them stationary)
        collectible.position.z += OBSTACLE_SPEED; // Re-use obstacle speed for now

        // Check collision
        if (checkCollision(playerBox, collectible)) {
            collect(collectible, i);
            continue; // Skip despawn check if collected
        }

        // Despawn if missed
        if (collectible.position.z > DESPAWN_DISTANCE) {
            removeCollectible(collectible, i);
        }
    }
}

function checkCollision(playerBox: THREE.Box3, collectible: THREE.Object3D): boolean {
    const collectibleBoundingBox = new THREE.Box3().setFromObject(collectible);
    return playerBox.intersectsBox(collectibleBoundingBox);
}

function collect(collectible: THREE.Object3D, index: number) {
    console.log("Collected data point!");
    addScore(POINTS_PER_DATA_POINT);

    // Broadcast collection to server/other players
    if (socket && socket.connected && collectible.userData.id) {
        socket.emit("collectibleCollected", collectible.userData.id);
    }

    // Remove locally
    removeCollectible(collectible, index);

    // Optional: Add sound effect or particle effect here
}

// Called locally or by network event to remove a collected item
export function removeCollectedCollectible(id: string) {
     const index = collectibles.findIndex(c => c.userData.id === id);
     if (index !== -1) {
        console.log(`Removing collected collectible ${id} based on network event`);
        removeCollectible(collectibles[index], index);
     }
}

function removeCollectible(collectible: THREE.Object3D, index: number) {
    scene.remove(collectible);
    collectibles.splice(index, 1);
}

// Clear all collectibles (e.g., on game restart)
export function clearCollectibles() {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        scene.remove(collectibles[i]);
    }
    collectibles.length = 0;
} 