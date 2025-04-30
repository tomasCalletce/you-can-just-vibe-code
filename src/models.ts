import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// Load the dinosaur model from GLB
export async function createDinosaurModel(): Promise<THREE.Object3D> {
    console.log("Loading dinosaur model...");
    try {
        const gltf = await loader.loadAsync('/models/dino.glb');
        console.log("Dino GLTF loaded: ", gltf);
        console.log("Dino GLTF animations: ", gltf.animations);
        const dinoModel = gltf.scene;
        console.log("Dino model scene node: ", dinoModel);
        console.log("Dinosaur model loaded successfully.");

        // Adjustments for the loaded model
        // dinoModel.scale.set(0.5, 0.5, 0.5); // Example: Scale down if too big
        dinoModel.position.y = 0; // Ensure base is at ground level
        dinoModel.rotation.y = Math.PI; // Rotate 180 degrees to face forward (+Z)

        // Enable shadows for all meshes within the model
        dinoModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = false; // Usually models don't receive shadows on themselves
            }
        });

        return dinoModel;
    } catch (error) {
        console.error("Error loading dinosaur model:", error);
        // Fallback to procedural model if loading fails?
        // return createProceduralDinosaurModel(); // Optional fallback
        throw error; // Or re-throw the error
    }
}

// Helper function to create an obstacle model
export async function createObstacleModel(): Promise<THREE.Object3D> {
    const obstacle = new THREE.Group();

    // Create a more interesting obstacle - a crystal/spike
    const crystalGeometry = new THREE.ConeGeometry(0.5, 1, 6);
    const crystalMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.9,
    });

    // Main crystal
    const mainCrystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    mainCrystal.castShadow = true;
    mainCrystal.rotation.x = Math.PI;
    obstacle.add(mainCrystal);

    // Add smaller crystals at angles
    const smallCrystalGeometry = new THREE.ConeGeometry(0.3, 0.7, 5);

    const smallCrystal1 = new THREE.Mesh(smallCrystalGeometry, crystalMaterial);
    smallCrystal1.position.set(0.2, 0, 0.2);
    smallCrystal1.rotation.x = Math.PI;
    smallCrystal1.rotation.z = Math.PI / 6;
    smallCrystal1.castShadow = true;
    obstacle.add(smallCrystal1);

    const smallCrystal2 = new THREE.Mesh(smallCrystalGeometry, crystalMaterial);
    smallCrystal2.position.set(-0.2, 0, -0.2);
    smallCrystal2.rotation.x = Math.PI;
    smallCrystal2.rotation.z = -Math.PI / 6;
    smallCrystal2.castShadow = true;
    obstacle.add(smallCrystal2);

    // Add a base
    const baseGeometry = new THREE.BoxGeometry(0.7, 0.2, 0.7);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b0000, // Dark red
        roughness: 0.8,
        metalness: 0.2,
    });

    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.5;
    base.castShadow = true;
    obstacle.add(base);

    return obstacle;
}

// Load the Cactus obstacle model from GLB
export async function createCactusModel(): Promise<THREE.Object3D> {
    console.log("Loading cactus model...");
    try {
        const gltf = await loader.loadAsync('/models/cactus_base_basic_shaded.glb');
        const cactusModel = gltf.scene;
        console.log("Cactus model loaded successfully.");

        // Adjustments for the loaded model
        cactusModel.scale.set(0.8, 0.8, 0.8); // Scale down slightly if needed
        cactusModel.position.y = 0; // Ensure base is at ground level

        // Enable shadows for all meshes within the model
        cactusModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true; // Cactus might receive shadow from player
            }
        });

        return cactusModel;
    } catch (error) {
        console.error("Error loading cactus model:", error);
        // Fallback?
        throw error;
    }
}

// Helper function to create a Data Point collectible model
export async function createDataPointModel(): Promise<THREE.Object3D> {
    const geometry = new THREE.IcosahedronGeometry(0.2, 0); // Simple geometric shape
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ffff, // Cyan color
        emissive: 0x00ffff, // Make it glow
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.5,
    });
    const dataPoint = new THREE.Mesh(geometry, material);
    // No shadow casting for small glowing objects usually needed
    // dataPoint.castShadow = true;

    // Add a slight rotation animation later if desired

    return dataPoint;
}

/* --- Optional: Keep procedural models as fallbacks --- */
/*
async function createProceduralDinosaurModel(): Promise<THREE.Object3D> {
    const dino = new THREE.Group();
    // ... (original procedural code) ...
    return dino;
}
async function createProceduralCactusModel(): Promise<THREE.Object3D> {
    const cactus = new THREE.Group();
    // ... (original procedural code) ...
    return cactus;
}
*/ 