import * as THREE from 'three';
import { showGameOverUI, updateScoreDisplay } from './ui';
import { clearObstacles, spawnObstacle, obstacleSpawnInterval, setObstacleSpawnInterval } from './obstacles'; // Assuming obstacles.ts
import { playerModel, resetPlayerState, hidePlayer } from './player'; // Assuming player.ts
import { socket, sendPlayerUpdate } from './network'; // Assuming network.ts
import { clearCollectibles } from './collectibles'; // Import clearCollectibles
import { clearSponsors } from './sponsors'; // Import clearSponsors
import { clearDustEffect } from './effects'; // Import effect clear function
import { DIFFICULTY_LEVELS } from './config';

// Game state
export let isGameRunning = false; // Start as false, set to true by startGame
export let score = 0;
export let startTime = Date.now();
let currentDifficultyLevel = -1; // Start at -1 to ensure level 0 is set initially
let currentObstacleSpeed = DIFFICULTY_LEVELS[0].speed;
let currentSpawnInterval = DIFFICULTY_LEVELS[0].spawnInterval;

// Getters for current difficulty parameters
export const getCurrentObstacleSpeed = () => currentObstacleSpeed;
export const getCurrentSpawnInterval = () => currentSpawnInterval;

export function startGameFlow(camera: THREE.PerspectiveCamera) {
    console.log("Starting game flow...");
    isGameRunning = true;
    score = 0;
    startTime = Date.now();
    currentDifficultyLevel = -1; // Reset difficulty level index
    updateDifficulty(0); // Set initial difficulty (level 0)

    resetPlayerState(); // Reset player position and jump state
    clearObstacles(); // Clear any existing obstacles
    clearCollectibles(); // Clear collectibles on start
    clearSponsors(); // Clear sponsors on start
    clearDustEffect(); // Clear dust particles on start

    // Look at player
    if (playerModel) {
        camera.lookAt(playerModel.position);
    }

    // Start spawning obstacles with the current interval
    if (obstacleSpawnInterval) clearInterval(obstacleSpawnInterval);
    setObstacleSpawnInterval(setInterval(spawnObstacle, currentSpawnInterval));
    console.log(`Obstacle spawn interval set to: ${currentSpawnInterval}ms`);

    // Initial player update
    sendPlayerUpdate();

    console.log("Game started");
}

export function stopGameFlow() {
    if (!isGameRunning) return; // Prevent multiple calls
    console.log("Stopping game flow...");
    isGameRunning = false;

    hidePlayer(); // Hide the local player model

    showGameOverUI(true);

    // Stop spawning obstacles
    if (obstacleSpawnInterval) {
        clearInterval(obstacleSpawnInterval);
        setObstacleSpawnInterval(null);
        console.log("Obstacle spawn interval cleared.");
    }

    // Notify other players
    if (socket && socket.connected) {
        socket.emit("gameOver");
    }
    console.log("Game over");
}

// Function to restart the game - called by UI button
export function restartGame(camera: THREE.PerspectiveCamera) {
    console.log("Restarting game...");
    showGameOverUI(false);
    startGameFlow(camera); // Re-run the start game sequence
}

// Function to update difficulty based on elapsed time
export function updateDifficulty(elapsedSeconds: number) {
    let newLevel = currentDifficultyLevel;
    // Find the highest level threshold passed
    for (let i = DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
        if (elapsedSeconds >= DIFFICULTY_LEVELS[i].timeThreshold) {
            newLevel = i;
            break;
        }
    }

    // Check if the level actually changed
    if (newLevel > currentDifficultyLevel) {
        console.log(`Increasing difficulty to Level ${newLevel} at ${elapsedSeconds.toFixed(1)}s`);
        currentDifficultyLevel = newLevel;
        const levelSettings = DIFFICULTY_LEVELS[currentDifficultyLevel];

        // Update speed
        currentObstacleSpeed = levelSettings.speed;
        console.log(`  New obstacle speed: ${currentObstacleSpeed}`);

        // Update spawn interval only if it changed
        if (currentSpawnInterval !== levelSettings.spawnInterval) {
            currentSpawnInterval = levelSettings.spawnInterval;
            console.log(`  New spawn interval: ${currentSpawnInterval}ms`);
            // Clear existing interval and set a new one
            if (isGameRunning) { // Only reschedule if game is running
                 if (obstacleSpawnInterval) clearInterval(obstacleSpawnInterval);
                 setObstacleSpawnInterval(setInterval(spawnObstacle, currentSpawnInterval));
            }
        }
    }
}

// Update score display only
export function updateScore() {
    if (!isGameRunning) return;
    updateScoreDisplay(score);
}

// Function to add points to the score (e.g., from collectibles)
export function addScore(points: number) {
    if (!isGameRunning) return;
    score += points;
    updateScoreDisplay(score); // Update display immediately
    console.log(`Score increased by ${points}. Total score: ${score}`);
} 