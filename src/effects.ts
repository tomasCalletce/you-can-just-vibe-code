import * as THREE from 'three';
import { scene } from './scene';
import { getPlayerModel } from './player'; // To get player position
import { GROUND_LEVEL } from './config';

const MAX_PARTICLES = 150;
const PARTICLE_LIFETIME = 0.8; // seconds
const PARTICLE_SPAWN_RATE = 5; // particles per frame (adjust as needed)

let particleGeometry: THREE.BufferGeometry;
let particleMaterial: THREE.PointsMaterial;
let particleSystem: THREE.Points;

// Arrays to manage individual particle properties
const particlePositions = new Float32Array(MAX_PARTICLES * 3);
const particleVelocities = new Array(MAX_PARTICLES).fill(null).map(() => new THREE.Vector3());
const particleLifetimes = new Float32Array(MAX_PARTICLES);
const particleIsActive = new Array(MAX_PARTICLES).fill(false);

let lastSpawnTime = 0;

export function initDustEffect() {
    particleGeometry = new THREE.BufferGeometry();

    // Initialize positions far away so they are not visible initially
    for (let i = 0; i < MAX_PARTICLES; i++) {
        particlePositions[i * 3 + 0] = 0;
        particlePositions[i * 3 + 1] = -1000; // Off-screen Y
        particlePositions[i * 3 + 2] = 0;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    particleMaterial = new THREE.PointsMaterial({
        color: 0xd2b48c, // Light brown/tan color for dust
        size: 0.1,        // Adjust size
        transparent: true,
        opacity: 0.7,     // Slightly transparent
        sizeAttenuation: true // Particles smaller further away
    });

    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particleSystem.name = "DustTrail";
    scene.add(particleSystem);

    console.log("Dust effect initialized");
}

function spawnDustParticle(origin: THREE.Vector3) {
    // Find an inactive particle
    const index = particleIsActive.findIndex(active => !active);
    if (index === -1) return; // No inactive particles available

    // Set initial position near the origin (player feet)
    particlePositions[index * 3 + 0] = origin.x + (Math.random() - 0.5) * 0.4; // Spread slightly X
    particlePositions[index * 3 + 1] = origin.y + GROUND_LEVEL + (Math.random() * 0.1); // Slightly above ground
    particlePositions[index * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.3; // Spread slightly Z

    // Set initial velocity (mostly backwards and upwards)
    particleVelocities[index].set(
        (Math.random() - 0.5) * 0.5, // Small sideways velocity
        Math.random() * 1.0 + 0.5,  // Upward velocity
        Math.random() * 1.0 + 1.0   // Backward velocity (positive Z)
    );

    // Activate particle
    particleLifetimes[index] = PARTICLE_LIFETIME;
    particleIsActive[index] = true;

    // Mark geometry for update
    particleGeometry.attributes.position.needsUpdate = true;
}

// Called in the main animation loop
export function updateDustEffect(deltaTime: number) {
    const player = getPlayerModel();
    if (!player) return;

    // Spawn new particles based on rate
    for (let i = 0; i < PARTICLE_SPAWN_RATE; i++) {
         spawnDustParticle(player.position);
    }

    // Update active particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
        if (particleIsActive[i]) {
            particleLifetimes[i] -= deltaTime;

            if (particleLifetimes[i] <= 0) {
                // Deactivate particle - move it off screen
                particlePositions[i * 3 + 1] = -1000;
                particleIsActive[i] = false;
            } else {
                // Update position based on velocity
                particlePositions[i * 3 + 0] += particleVelocities[i].x * deltaTime;
                particlePositions[i * 3 + 1] += particleVelocities[i].y * deltaTime;
                particlePositions[i * 3 + 2] += particleVelocities[i].z * deltaTime;

                // Apply simple gravity/drag
                particleVelocities[i].y -= 2.0 * deltaTime; // Gravity pull down
                particleVelocities[i].multiplyScalar(1.0 - 0.5 * deltaTime); // Air drag
            }
        }
    }

    // Mark geometry for update
    particleGeometry.attributes.position.needsUpdate = true;

    // Update opacity based on average lifetime? (Optional)
    // Could also fade particles based on individual lifetime remaining
}

// Clear effect (e.g., on game restart)
export function clearDustEffect() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        if (particleIsActive[i]) {
             particlePositions[i * 3 + 1] = -1000;
             particleIsActive[i] = false;
             particleLifetimes[i] = 0;
        }
    }
    particleGeometry.attributes.position.needsUpdate = true;
    console.log("Dust effect cleared");
} 