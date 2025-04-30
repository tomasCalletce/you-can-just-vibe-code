import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import { scene } from './scene';
import { updatePlayerCountDisplay } from './ui';
import { getPlayerModel, getIsJumping } from './player'; // Get local player info
import { spawnRemoteObstacle } from './obstacles'; // To spawn obstacles received from server
import { removeCollectedCollectible } from './collectibles'; // Import function to remove collected items

export let socket: Socket;
let playerId: string = "";
const remotePlayers: { [key: string]: THREE.Object3D } = {};

export function initNetwork() {
    socket = io();

    socket.on("connect", () => {
        console.log("Connected to server with ID:", socket.id);
    });

    socket.on("init", (data: { id: string; players: { [key: string]: any } }) => {
        console.log("Initialized with ID:", data.id);
        console.log("Current players:", Object.keys(data.players).length);
        playerId = data.id;

        // Create remote players already in the game
        Object.keys(data.players).forEach((id) => {
            if (id !== playerId) {
                console.log(`Initializing remote player: ${id}`);
                const p = data.players[id];
                addRemotePlayer(id, p.position.x, p.position.y, p.position.z, p.color);
            }
        });
        updatePlayerCount();
    });

    socket.on("playerJoined", (data: { id: string; position: any; color: number }) => {
        console.log("Player joined:", data.id);
        if (data.id !== playerId && !remotePlayers[data.id]) {
            addRemotePlayer(data.id, data.position.x, data.position.y, data.position.z, data.color);
            updatePlayerCount();
        }
    });

    socket.on("playerMove", (data: { id: string; position: any; isJumping: boolean }) => {
        if (data.id !== playerId && remotePlayers[data.id]) {
            remotePlayers[data.id].position.set(data.position.x, data.position.y, data.position.z);
            // Optional: Add visual feedback for remote player jumping if needed
        }
    });

    socket.on("playerLeft", (id: string) => {
        console.log("Player left:", id);
        if (remotePlayers[id]) {
            scene.remove(remotePlayers[id]);
            delete remotePlayers[id];
            updatePlayerCount();
        }
    });

    socket.on("newObstacle", (data: { id: string; position: { x: number, y: number, z: number }}) => {
        // Pass obstacle data to the obstacle manager
        spawnRemoteObstacle(data.id, data.position);
    });

    // Listener for when another player collects an item
    socket.on("collectibleWasCollected", (collectibleId: string) => {
        console.log(`Collectible ${collectibleId} was collected by another player`);
        removeCollectedCollectible(collectibleId); // Remove it visually for this client
    });

    socket.on("playerGameOver", (id: string) => {
        if (remotePlayers[id]) {
            // Visual indication of player game over (turn gray)
            remotePlayers[id].traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    // Ensure material is MeshStandardMaterial before changing color
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.color.setHex(0x666666);
                    }
                }
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from server");
        // Handle disconnection if needed (e.g., show message)
    });

    console.log("Network initialized");
}

function addRemotePlayer(id: string, x: number, y: number, z: number, color: number) {
    const localPlayerModel = getPlayerModel(); // Need the template model
    if (!localPlayerModel) {
        console.warn("Local player model not ready, cannot create remote player yet.");
        // Retry or handle gracefully
        setTimeout(() => addRemotePlayer(id, x, y, z, color), 1000);
        return;
    }

    console.log(`Creating remote player: ${id} at position (${x}, ${y}, ${z})`);
    const remotePlayer = localPlayerModel.clone();
    remotePlayer.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            // Create a new material instance for the clone
            if (child.material instanceof THREE.MeshStandardMaterial) {
                const originalMaterial = child.material;
                child.material = new THREE.MeshStandardMaterial({
                    color: color || originalMaterial.color.getHex(), // Use received color or default
                    roughness: originalMaterial.roughness,
                    metalness: originalMaterial.metalness,
                    // Copy other relevant properties if necessary
                });
            } else {
                 // Handle other material types if necessary, or default material
                 child.material = new THREE.MeshStandardMaterial({ color: color || 0xaaaaaa });
            }
        }
    });
    remotePlayer.position.set(x, y, z);
    scene.add(remotePlayer);
    remotePlayers[id] = remotePlayer;
    console.log(`Remote player ${id} added to scene`);
}

// Function to send local player updates to the server
export function sendPlayerUpdate() {
    const playerModel = getPlayerModel();
    if (playerModel && socket && socket.connected) {
        socket.emit("playerUpdate", {
            position: { x: playerModel.position.x, y: playerModel.position.y, z: playerModel.position.z },
            isJumping: getIsJumping(), // Get jump state from player module
        });
    }
}

// Function to update the player count UI
function updatePlayerCount() {
    const count = Object.keys(remotePlayers).length + 1; // +1 for local player
    updatePlayerCountDisplay(count);
}

// Getter for player ID
export function getPlayerId(): string {
    return playerId;
}

// Getter for remote players map if needed elsewhere
export function getRemotePlayers(): { [key: string]: THREE.Object3D } {
    return remotePlayers;
} 