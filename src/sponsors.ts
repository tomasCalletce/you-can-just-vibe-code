import * as THREE from 'three';
import { scene } from './scene';
import {
    SPAWN_DISTANCE,
    DESPAWN_DISTANCE,
    OBSTACLE_SPEED,
    SPONSOR_BANNER_WIDTH,
    SPONSOR_BANNER_HEIGHT,
    SPONSOR_BANNER_Y_POS,
    SPONSOR_BANNER_SIDE_OFFSET,
    SPONSOR_SPAWN_INTERVAL_Z
} from './config';
import { isGameRunning } from './game';

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
const sponsorBanners: THREE.Mesh[] = []; // Store active banners
let nextSponsorSpawnZ = SPAWN_DISTANCE;

export async function initSponsors() {
    console.log("Initializing sponsors...");
    try {
        const loadPromises = sponsorImagePaths.map(path => {
            return new Promise<THREE.Texture>((resolve, reject) => {
                // Store the path in the texture name for later identification
                const texture = textureLoader.load(path, resolve, undefined, reject);
                texture.name = path; // Assign path to texture name
            });
        });
        const loadedTextures = await Promise.all(loadPromises);
        sponsorTextures.push(...loadedTextures);
        console.log(`Loaded ${sponsorTextures.length} sponsor textures.`);
        nextSponsorSpawnZ = SPAWN_DISTANCE - SPONSOR_SPAWN_INTERVAL_Z; // Initialize first spawn point
    } catch (error) {
        console.error("Error loading sponsor textures:", error);
    }
}

function spawnSponsorBanner(zPos: number) {
    if (sponsorTextures.length === 0) return; // No textures loaded

    // Choose a random texture
    const texture = sponsorTextures[Math.floor(Math.random() * sponsorTextures.length)];

    // Determine background color based on texture name (path)
    let bgColor = 0xffffff; // Default white background
    if (texture.name.includes('truora1.png')) {
        bgColor = 0xffffff; // Explicitly white for Truora
    } else if (texture.name.includes('dapta.png')) {
        bgColor = 0x000000; // Black for Dapta
    }

    const geometry = new THREE.PlaneGeometry(SPONSOR_BANNER_WIDTH, SPONSOR_BANNER_HEIGHT);
    // Use the determined background color in the material
    // Set transparent = true to allow PNG transparency to work correctly
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        color: bgColor,
        transparent: true // Ensure transparency is enabled
    });
    const banner = new THREE.Mesh(geometry, material);

    // Position left or right
    const xPos = (Math.random() < 0.5 ? -1 : 1) * SPONSOR_BANNER_SIDE_OFFSET;
    banner.position.set(xPos, SPONSOR_BANNER_Y_POS, zPos);

    // Make banner face the player (optional)
    // banner.lookAt(camera.position); // Needs camera reference
    banner.rotation.y = (xPos > 0) ? -Math.PI / 2.5 : Math.PI / 2.5; // Angle slightly towards center

    scene.add(banner);
    sponsorBanners.push(banner);
}

// Called in the main animation loop
export function updateSponsors() {
    if (!isGameRunning || sponsorTextures.length === 0) return;

    // --- Spawning Logic --- 
    // This approach spawns based on distance traveled, like milestones
    // We track a threshold `nextSponsorSpawnZ`. When player passes it, spawn, then update threshold.
    // Note: This assumes the game world moves towards positive Z. Adjust if needed.
    // Currently obstacles move towards positive Z, so player is effectively moving towards negative Z relative to world origin.
    // Let's adjust spawning based on the furthest obstacle/item Z.
    // Simpler approach: Spawn based on time interval or alongside obstacles.
    
    // Let's try spawning ~ every SPONSOR_SPAWN_INTERVAL_Z units *behind* the initial SPAWN_DISTANCE
    if (nextSponsorSpawnZ > SPAWN_DISTANCE - 100) { // Check if the next spawn point is within a reasonable range
       // Check if it's time to consider spawning based on Z interval
       // This check needs refinement based on how the world moves.
       // A simpler time-based spawn might be easier initially.
       // Let's spawn linked to obstacle spawn for now.
       // This function will only handle updates/despawns.
    }

    // --- Update and Despawn Logic ---
    for (let i = sponsorBanners.length - 1; i >= 0; i--) {
        const banner = sponsorBanners[i];
        banner.position.z += OBSTACLE_SPEED; // Move banner towards player

        // Despawn
        if (banner.position.z > DESPAWN_DISTANCE) {
            scene.remove(banner);
            // Clean up geometry and material to free memory
            banner.geometry.dispose();
            if (Array.isArray(banner.material)) {
                banner.material.forEach(m => m.dispose());
            } else {
                banner.material.dispose();
            }
            sponsorBanners.splice(i, 1);
        }
    }
}

// Spawn trigger to be called externally (e.g., from obstacles.ts)
export function triggerSponsorSpawn(currentZ: number) {
    // Check if enough distance has passed since last sponsor spawn attempt
    // TEMPORARY DEBUG: Always try to spawn, ignore Z condition for now
    // if (currentZ < nextSponsorSpawnZ) { 
        console.log(`Triggering sponsor spawn near Z: ${currentZ.toFixed(1)}. Next threshold was: ${nextSponsorSpawnZ.toFixed(1)}`);
        spawnSponsorBanner(currentZ); // Spawn near the current obstacle/item Z
        // Set next spawn Z further back
        nextSponsorSpawnZ = currentZ - SPONSOR_SPAWN_INTERVAL_Z * (0.8 + Math.random() * 0.4); // Add randomness
    // }
}

// Clear all banners (e.g., on game restart)
export function clearSponsors() {
    for (let i = sponsorBanners.length - 1; i >= 0; i--) {
        const banner = sponsorBanners[i];
        scene.remove(banner);
        banner.geometry.dispose();
        if (Array.isArray(banner.material)) {
            banner.material.forEach(m => m.dispose());
        } else {
            banner.material.dispose();
        }
    }
    sponsorBanners.length = 0;
    // Reset spawn trigger point
    nextSponsorSpawnZ = SPAWN_DISTANCE - SPONSOR_SPAWN_INTERVAL_Z;
} 