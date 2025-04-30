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

// Define a type for the player data received from server
interface PlayerData {
    id: string;
    position: { x: number, y: number, z: number };
    color: number;
    isJumping: boolean;
    isGameOver: boolean; // Add the flag here
}

export function initNetwork() {
    console.log("--- initNetwork() function entered ---"); // LOG SUPERIOR

    // Explicitly connect to the server URL and port
    const SERVER_URL = "http://localhost:3000";
    console.log(`Attempting to connect to Socket.IO server at ${SERVER_URL}...`);
    // socket = io(); // Old implicit connection
    socket = io(SERVER_URL);

    socket.on("connect", () => {
        console.log(`Successfully connected to server at ${SERVER_URL} with ID:`, socket.id);
    });

    socket.on("connect_error", (err) => {
        console.error(`Connection Error: Failed to connect to server at ${SERVER_URL}`, err.message);
        // Optionally display an error to the user in the UI
    });

    socket.on("init", (data: { id: string; players: { [key: string]: PlayerData } }) => {
        console.log("--- EVENT RECEIVED: init ---", data);
        playerId = data.id;

        Object.keys(data.players).forEach((id) => {
            const p = data.players[id];
            // CHECK if the player is already game over before creating avatar
            if (id !== playerId && !p.isGameOver) {
                console.log(`[init] Creating existing player: ${id} (isGameOver: ${p.isGameOver})`);
                addRemotePlayer(id, p.position.x, p.position.y, p.position.z, p.color);
            } else if (id !== playerId && p.isGameOver) {
                console.log(`[init] Skipping avatar creation for player ${id} (isGameOver: ${p.isGameOver})`);
            }
        });
        updatePlayerCount(); // Update count based on *visible* players might be better
        console.log("[init] Finished processing.");
    });

    socket.on("playerJoined", (data: PlayerData) => {
        console.log("--- EVENT RECEIVED: playerJoined ---", data);
        // Check isGameOver status for newly joined player (should always be false, but good practice)
        if (data.id !== playerId && !remotePlayers[data.id] && !data.isGameOver) {
            console.log(`[playerJoined] Creating new player: ${data.id}`);
            addRemotePlayer(data.id, data.position.x, data.position.y, data.position.z, data.color);
            updatePlayerCount();
        }
    });

    socket.on("playerMove", (data: { id: string; position: any; isJumping: boolean }) => {
        // Optional: Add log here too if needed
        // console.log("--- EVENT RECEIVED: playerMove ---", data.id);
        if (data.id !== playerId && remotePlayers[data.id]) {
            remotePlayers[data.id].position.set(data.position.x, data.position.y, data.position.z);
        }
    });

    socket.on("playerLeft", (id: string) => {
        console.log("--- EVENT RECEIVED: playerLeft ---", id); // Log event received
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
        console.log(`--- EVENT RECEIVED: playerGameOver --- Player ID: ${id}`); // Log event
        if (remotePlayers[id]) {
            console.log(`[playerGameOver] Removing avatar for player ${id}`);
            // Remove the player's model from the scene
            scene.remove(remotePlayers[id]);
            // Remove the player from our tracking object
            delete remotePlayers[id];
            // Update the player count display
            updatePlayerCount();
        } else {
            console.log(`[playerGameOver] Received event for player ${id}, but they were not found in remotePlayers.`);
        }
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from server");
        // Handle disconnection if needed (e.g., show message)
    });

    console.log("Network initialization attempted");
}

function addRemotePlayer(id: string, x: number, y: number, z: number, color: number) {
    console.log(`[addRemotePlayer] Attempting to add player ${id}`); // Log entry
    const localPlayerModel = getPlayerModel();
    if (!localPlayerModel) {
        // This log might appear if network init happens before player init completes
        console.warn(`[addRemotePlayer] Local player model not ready for ${id}, retrying...`);
        setTimeout(() => addRemotePlayer(id, x, y, z, color), 500); // Retry slightly faster
        return;
    }

    console.log(`[addRemotePlayer] Cloning model for ${id}`);
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
    console.log(`[addRemotePlayer] Player ${id} added to scene`);
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