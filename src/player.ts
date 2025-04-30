import * as THREE from 'three';
import { scene } from './scene';
import { GROUND_LEVEL, JUMP_HEIGHT, JUMP_DURATION, PLAYER_LATERAL_SPEED, PLAYER_MAX_LATERAL_POSITION } from './config';
import { createDinosaurModel } from './models';
import { sendPlayerUpdate } from './network'; // Assumes network.ts exports sendPlayerUpdate
import { isGameRunning } from './game'; // To check if game is running before jumping

export let playerModel: THREE.Object3D | null = null;
export let playerBoundingBox: THREE.Box3 = new THREE.Box3();

let isJumping = false;
let jumpStartTime = 0;
let targetHorizontalPosition = 0; // Player's target X position

export async function initPlayer() {
    console.log("[initPlayer] Starting...");
    try {
        playerModel = await createDinosaurModel();
        console.log("[initPlayer] Dinosaur model created/loaded: ", playerModel);
        if (!playerModel) throw new Error("createDinosaurModel returned null/undefined");

        resetPlayerState(); // Set initial position and state
        console.log("[initPlayer] Adding player model to scene...");
        scene.add(playerModel);
        console.log("[initPlayer] Player model added to scene.");
        playerBoundingBox = new THREE.Box3().setFromObject(playerModel);
        playerBoundingBox.expandByScalar(-0.15); // Shrink box
        console.log("Player initialized");
    } catch (error) {
        console.error("[initPlayer] Failed:", error);
    }
}

// Reset player position and state (e.g., on game start/restart)
export function resetPlayerState() {
    if (playerModel) {
        playerModel.position.set(0, GROUND_LEVEL, 0);
        targetHorizontalPosition = 0; // Reset target X position
    }
    isJumping = false;
}

// Called by controls.ts
export function jump() {
    if (isGameRunning && !isJumping && playerModel) {
        isJumping = true;
        jumpStartTime = Date.now();
        // Initial update on jump start
        sendPlayerUpdate();
    }
}

// Called by controls.ts to initiate move left
export function moveLeft() {
    if (!isGameRunning || !playerModel) return;
    // Set target position, clamping it within bounds
    targetHorizontalPosition = Math.max(playerModel.position.x - 1.0, -PLAYER_MAX_LATERAL_POSITION);
    // Note: Simple step for now, could also use lanes
    console.log(`Move Left triggered, targetX: ${targetHorizontalPosition}`);
}

// Called by controls.ts to initiate move right
export function moveRight() {
    if (!isGameRunning || !playerModel) return;
    // Set target position, clamping it within bounds
    targetHorizontalPosition = Math.min(playerModel.position.x + 1.0, PLAYER_MAX_LATERAL_POSITION);
    // Note: Simple step for now, could also use lanes
    console.log(`Move Right triggered, targetX: ${targetHorizontalPosition}`);
}

// Called in the main animation loop (game.ts or main.ts)
export function updatePlayerJump() {
    if (isJumping && playerModel) {
        const jumpTime = Date.now() - jumpStartTime;
        if (jumpTime < JUMP_DURATION) {
            const jumpProgress = jumpTime / JUMP_DURATION;
            const jumpSine = Math.sin(jumpProgress * Math.PI);
            playerModel.position.y = GROUND_LEVEL + jumpSine * JUMP_HEIGHT;
            // Send periodic updates during jump (consider throttling)
            if (jumpTime % 100 < 20) { sendPlayerUpdate(); }
        } else {
            // Jump finished
            playerModel.position.y = GROUND_LEVEL;
            isJumping = false;
            // Final update after jump
            sendPlayerUpdate();
        }
    }
}

// Called in the main animation loop to handle horizontal movement
export function updatePlayerHorizontalMovement() {
    if (!isGameRunning || !playerModel) return;

    const currentX = playerModel.position.x;
    const deltaX = targetHorizontalPosition - currentX;

    // If player is already close to the target, snap to it
    if (Math.abs(deltaX) < PLAYER_LATERAL_SPEED) {
        if (currentX !== targetHorizontalPosition) {
            playerModel.position.x = targetHorizontalPosition;
            sendPlayerUpdate(); // Send update when snapping
        }
    } else {
        // Move towards the target position
        const moveStep = Math.sign(deltaX) * PLAYER_LATERAL_SPEED;
        playerModel.position.x += moveStep;
        // Clamp position just in case
        playerModel.position.x = THREE.MathUtils.clamp(
            playerModel.position.x,
            -PLAYER_MAX_LATERAL_POSITION,
            PLAYER_MAX_LATERAL_POSITION
        );
        // Send update while moving
        // (Consider only sending update if position actually changed significantly)
        // if (Math.abs(moveStep) > 0.01) { 
            sendPlayerUpdate();
        // }
    }
}

// Update the player's bounding box (call this in the animation loop if needed)
export function updatePlayerBoundingBox() {
    if (playerModel) {
        // Calculate the box based on the model
        playerBoundingBox.setFromObject(playerModel);
        // Shrink the box slightly for more precise collision
        playerBoundingBox.expandByScalar(-0.15); // Adjust this value as needed
    }
}

// Getter for the player model if needed elsewhere
export function getPlayerModel(): THREE.Object3D | null {
    return playerModel;
}

// Getter for the player bounding box, e.g., for collision checks
export function getPlayerBoundingBox(): THREE.Box3 {
    return playerBoundingBox;
}

// Getter for jump state if needed
export function getIsJumping(): boolean {
    return isJumping;
} 