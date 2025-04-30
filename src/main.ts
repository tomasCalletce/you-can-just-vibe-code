import "./style.css";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; // Now imported in scene.ts
import { initUI, showLoadingScreen } from "./ui";
import { isGameRunning, startGameFlow, updateScore, updateDifficulty, startTime as gameStartTime } from "./game";
import { initScene, camera, controls, renderScene } from "./scene";
import { initPlayer, updatePlayerJump, updatePlayerBoundingBox, updatePlayerHorizontalMovement } from './player';
import { initObstacles, updateObstacles } from './obstacles';
import { initCollectibles, updateCollectibles } from './collectibles';
import { initSponsors, updateSponsors } from './sponsors';
import { initNetwork, sendPlayerUpdate } from './network';
import { initControls } from './controls';
import { initDustEffect, updateDustEffect } from './effects'; // Import effect functions

console.log("--- main.ts executing ---"); // Log 1: Script start

// Initialize core modules
initUI();
initScene();
console.log("--- Calling initNetwork() ---"); // Log 2: Before network init
initNetwork(); // Initialize network connection and listeners
initControls(); // Initialize input listeners

// Clock for delta time
const clock = new THREE.Clock();

// We now initialize models within their respective modules
// Replace direct loadingManager use with async initialization
async function initializeGameAssets() {
    showLoadingScreen(true);
    try {
        // Initialize player, obstacles, collectibles, sponsors, and effects concurrently
        await Promise.all([
            initPlayer(),
            initObstacles(),
            initCollectibles(),
            initSponsors(),
            initDustEffect() // Initialize dust effect
        ]);
        console.log("Assets initialized successfully.");
        showLoadingScreen(false);
        startGameFlow(camera); // Start game flow after assets are ready
        animate(); // Start the animation loop
    } catch (error) {
        console.error("Error initializing game assets:", error);
        showLoadingScreen(false);
        // Handle initialization error (e.g., show error message)
    }
}

// Start asset initialization
initializeGameAssets();

// --- Loading manager callbacks are replaced by async/await ---
// loadingManager.onLoad = () => { ... };
// loadingManager.onError = () => { ... };
// Timeout logic replaced by async/await

// --- Helper ensureModelsCreated removed ---

// --- createRemotePlayer moved to network.ts ---

// --- Socket.IO event listeners moved to network.ts ---

// --- updatePlayerCount moved to network.ts ---

// --- jump function moved to player.ts ---

// --- sendPlayerUpdate moved to network.ts ---

// --- updateJump moved to player.ts ---

// --- spawnObstacle moved to obstacles.ts ---

// --- checkCollision moved to obstacles.ts ---

// --- Event listeners moved to controls.ts ---

// --- Animation loop --- Calls update functions from modules ---
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta(); // Get time since last frame

    if (isGameRunning) {
        const elapsedSeconds = (Date.now() - gameStartTime) / 1000;
        updateDifficulty(elapsedSeconds); // Update difficulty based on time

        updateScore();
        updatePlayerJump();
        updatePlayerHorizontalMovement(); // Add call to update horizontal movement
        updatePlayerBoundingBox(); // Update player bounding box for collisions
        updateObstacles(); // Update obstacle positions, check collisions, handle despawn
        updateCollectibles(); // Add update for collectibles
        updateSponsors(); // Add update for sponsors
        updateDustEffect(deltaTime); // Update dust effect, pass delta time
        controls.update(); // Update OrbitControls if enabled/used

        // Periodic player update to network
        // Consider making this part of player or network module update logic
    if (Date.now() % 200 < 20) {
      sendPlayerUpdate();
    }
  }

    renderScene(); // Render the scene
}

// --- Resize handler moved to scene.ts ---
