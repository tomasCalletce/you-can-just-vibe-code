import * as THREE from 'three';
import { scene } from './scene';
import {
    LANE_WIDTH,
    DESPAWN_DISTANCE,
    OBSTACLE_SPEED,
    SPONSOR_COLLECTIBLE_SPAWN_CHANCE,
    POINTS_PER_SPONSOR_COLLECTIBLE
} from './config';
import { isGameRunning, addScore } from './game';
import { getPlayerBoundingBox } from './player';
import { socket } from './network';
import { displayCollectedSponsor } from './ui';

// Re-use or re-declare sponsor image paths
const sponsorImagePaths = [
    '/sponsors/dapta.png',
    '/sponsors/kebo.png',
    '/sponsors/lab10.png',
    '/sponsors/pelnti.jpg',
    '/sponsors/truora1.png',
    '/sponsors/wiwi.png',
    '/sponsors/yavendio-logo.png',
    '/sponsors/cronograma-banner.png'
];

const textureLoader = new THREE.TextureLoader();
const sponsorTextures: THREE.Texture[] = [];
const sponsorCollectibles: THREE.Mesh[] = []; // Store active sponsor collectibles

let collectibleGeometry: THREE.BoxGeometry | null = null;

export async function initSponsorCollectibles() {
    console.log("Initializing sponsor collectibles...");
    try {
        const loadPromises = sponsorImagePaths.map(path => {
            return new Promise<THREE.Texture>((resolve, reject) => {
                const texture = textureLoader.load(path, resolve, undefined, reject);
                texture.name = path;
            });
        });
        const loadedTextures = await Promise.all(loadPromises);
        sponsorTextures.push(...loadedTextures);
        console.log(`Loaded ${sponsorTextures.length} textures for sponsor collectibles.`);
        // Create a reusable geometry (e.g., a small cube)
        collectibleGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    } catch (error) {
        console.error("Error loading sponsor collectible textures:", error);
    }
}

// Function to attempt spawning sponsor collectibles
export function trySpawnSponsorCollectible(baseZ: number) {
    if (!isGameRunning || !collectibleGeometry || sponsorTextures.length === 0 || Math.random() > SPONSOR_COLLECTIBLE_SPAWN_CHANCE) {
        return;
    }

    // Choose a random sponsor texture
    const texture = sponsorTextures[Math.floor(Math.random() * sponsorTextures.length)];

    // Define problematic logos that need a background
    const logosNeedingBackground = [
        '/sponsors/dapta.png',
        '/sponsors/yavendio-logo.png',
        '/sponsors/truora1.png'
    ];

    let material;
    if (logosNeedingBackground.includes(texture.name)) {
        // Apply a white background color for specific logos
        material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff // White background
            // No transparency settings
        });
    } else {
        // Default material for other logos
        material = new THREE.MeshBasicMaterial({
            map: texture
            // No transparency settings
        });
    }

    const collectible = new THREE.Mesh(collectibleGeometry!, material);

    const xPos = Math.random() * LANE_WIDTH - LANE_WIDTH / 2;
    const yPos = 0.7; // Same height as data points for now
    const zPos = baseZ + Math.random() * 2 - 1;

    collectible.position.set(xPos, yPos, zPos);
    collectible.userData.id = THREE.MathUtils.generateUUID();
    collectible.userData.imagePath = texture.name;

    scene.add(collectible);
    sponsorCollectibles.push(collectible);
}

// Called in the main animation loop
export function updateSponsorCollectibles(deltaTime: number) {
    if (!isGameRunning) return;

    const playerBox = getPlayerBoundingBox();

    for (let i = sponsorCollectibles.length - 1; i >= 0; i--) {
        const collectible = sponsorCollectibles[i];

        // Make it spin
        collectible.rotation.y += 2.0 * deltaTime;
        collectible.rotation.x += 1.5 * deltaTime;

        collectible.position.z += OBSTACLE_SPEED; // Move towards player

        // Check collision
        if (checkSponsorCollision(playerBox, collectible)) {
            collectSponsorCollectible(collectible, i);
            continue;
        }

        // Despawn if missed
        if (collectible.position.z > DESPAWN_DISTANCE) {
            removeSponsorCollectible(collectible, i);
        }
    }
}

function checkSponsorCollision(playerBox: THREE.Box3, collectible: THREE.Object3D): boolean {
    const collectibleBoundingBox = new THREE.Box3().setFromObject(collectible);
    return playerBox.intersectsBox(collectibleBoundingBox);
}

function collectSponsorCollectible(collectible: THREE.Mesh, index: number) {
    console.log("Collected SPONSOR item!");
    addScore(POINTS_PER_SPONSOR_COLLECTIBLE);

    if (collectible.userData.imagePath) {
        displayCollectedSponsor(collectible.userData.imagePath);
    }

    if (socket && socket.connected && collectible.userData.id) {
        socket.emit("sponsorCollectibleCollected", collectible.userData.id);
    }

    removeSponsorCollectible(collectible, index);
    // Optional: Add different sound/particle effect
}

// Called locally or by network event
export function removeCollectedSponsorCollectible(id: string) {
    const index = sponsorCollectibles.findIndex(c => c.userData.id === id);
    if (index !== -1) {
        console.log(`Removing collected sponsor collectible ${id} based on network event`);
        removeSponsorCollectible(sponsorCollectibles[index], index);
    }
}

function removeSponsorCollectible(collectible: THREE.Mesh, index: number) {
    scene.remove(collectible);
    sponsorCollectibles.splice(index, 1);
    // Note: Geometry is reused, so we don't dispose it here.
    // We only dispose materials if they were unique per object, which they are not here.
}

// Clear all (e.g., on game restart)
export function clearSponsorCollectibles() {
    for (let i = sponsorCollectibles.length - 1; i >= 0; i--) {
        scene.remove(sponsorCollectibles[i]);
    }
    sponsorCollectibles.length = 0;
    // Keep geometry and textures loaded
} 