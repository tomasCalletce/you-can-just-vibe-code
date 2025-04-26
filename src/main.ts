import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { io, Socket } from "socket.io-client";

// Initialize Socket.IO client
const socket: Socket = io();

// Game state
let isGameRunning = true;
let score = 0;
let startTime = Date.now();
let playerId = "";

// Jump state
let isJumping = false;
let jumpStartTime = 0;
const JUMP_DURATION = 600; // Shortened from 700ms to 600ms for faster jumps
const JUMP_HEIGHT = 3; // Increased from 2 to 3 for higher jumps
const GROUND_LEVEL = 0.5; // Player's y position when on ground

// Remote players storage
const remotePlayers: { [key: string]: THREE.Object3D } = {};

// Create score display element
const scoreElement = document.createElement("div");
scoreElement.style.position = "absolute";
scoreElement.style.top = "60px"; // Increased from 20px to be below the banner
scoreElement.style.left = "20px";
scoreElement.style.color = "white";
scoreElement.style.fontSize = "24px";
scoreElement.style.fontFamily = "Arial, sans-serif";
scoreElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
scoreElement.style.zIndex = "1000";
scoreElement.textContent = "Score: 0"; // Initialize with text
document.body.appendChild(scoreElement);

// Create players count element
const playersCountElement = document.createElement("div");
playersCountElement.style.position = "absolute";
playersCountElement.style.top = "90px"; // Increased from 50px to be below the score
playersCountElement.style.left = "20px";
playersCountElement.style.color = "white";
playersCountElement.style.fontSize = "18px";
playersCountElement.style.fontFamily = "Arial, sans-serif";
playersCountElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
playersCountElement.style.zIndex = "1000";
playersCountElement.textContent = "Players: 1"; // Initialize with text
document.body.appendChild(playersCountElement);

// Create loading screen
const loadingScreen = document.createElement("div");
loadingScreen.style.position = "absolute";
loadingScreen.style.width = "100%";
loadingScreen.style.height = "100%";
loadingScreen.style.top = "0";
loadingScreen.style.left = "0";
loadingScreen.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
loadingScreen.style.display = "flex";
loadingScreen.style.flexDirection = "column";
loadingScreen.style.alignItems = "center";
loadingScreen.style.justifyContent = "center";
loadingScreen.style.color = "white";
loadingScreen.style.fontSize = "24px";
loadingScreen.style.fontFamily = "Arial, sans-serif";
loadingScreen.style.zIndex = "2000";
document.body.appendChild(loadingScreen);

const loadingText = document.createElement("div");
loadingText.textContent = "Esto lo construí con solo Cursor y sin programar";
loadingText.style.marginBottom = "20px";
loadingScreen.appendChild(loadingText);

const subText = document.createElement("div");
subText.textContent = "Cargando...";
subText.style.fontSize = "18px";
subText.style.opacity = "0.8";
loadingScreen.appendChild(subText);

// Create game over display
const gameOverElement = document.createElement("div");
gameOverElement.style.position = "absolute";
gameOverElement.style.top = "40%";
gameOverElement.style.left = "50%";
gameOverElement.style.transform = "translate(-50%, -50%)";
gameOverElement.style.color = "red";
gameOverElement.style.fontSize = "64px";
gameOverElement.style.fontFamily = "Arial, sans-serif";
gameOverElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
gameOverElement.style.display = "none";
gameOverElement.style.zIndex = "1000";
gameOverElement.textContent = "GAME OVER";
document.body.appendChild(gameOverElement);

// Create play again button
const playAgainButton = document.createElement("div");
playAgainButton.style.position = "absolute";
playAgainButton.style.top = "55%";
playAgainButton.style.left = "50%";
playAgainButton.style.transform = "translate(-50%, -50%)";
playAgainButton.style.color = "white";
playAgainButton.style.backgroundColor = "green";
playAgainButton.style.padding = "15px 30px";
playAgainButton.style.borderRadius = "10px";
playAgainButton.style.fontSize = "28px";
playAgainButton.style.fontFamily = "Arial, sans-serif";
playAgainButton.style.cursor = "pointer";
playAgainButton.style.display = "none";
playAgainButton.style.zIndex = "1000";
playAgainButton.style.textAlign = "center";
playAgainButton.textContent = "PLAY AGAIN";
playAgainButton.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
document.body.appendChild(playAgainButton);

// Add play again functionality
playAgainButton.addEventListener("click", () => {
  restartGame();
});

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Make canvas fill the viewport
renderer.domElement.style.display = "block";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";

// Add OrbitControls (disabled by default)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

// Setup lighting
// Enhanced lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// Main directional light (sun)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

// Add a secondary fill light for better model visibility
const fillLight = new THREE.DirectionalLight(0xffffee, 0.5);
fillLight.position.set(-5, 3, 0);
scene.add(fillLight);

// Create a ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b4513, // Saddle brown
  roughness: 0.8,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
ground.position.y = 0; // At y=0
ground.receiveShadow = true;
scene.add(ground);

// Position camera behind and slightly above the player
camera.position.set(0, 2, 5); // Behind and above

// Create loading manager for assets
const loadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager);

// Models
let playerModel: THREE.Object3D;
let obstacleModel: THREE.Object3D;
const obstacles: THREE.Object3D[] = [];
const remoteObstacles: { [key: string]: THREE.Object3D } = {};

// Loading manager event handlers
loadingManager.onProgress = (url, loaded, total) => {
  // We don't need to update a progress bar anymore
};

loadingManager.onLoad = () => {
  loadingScreen.style.display = "none";
  startGame();
};

loadingManager.onError = (url) => {
  console.error(`Error loading ${url}`);
  // Force start the game after a short delay even if there are errors
  setTimeout(() => {
    loadingScreen.style.display = "none";
    startGame();
  }, 2000);
};

// Always start the game after a short delay regardless of loading status
setTimeout(() => {
  if (loadingScreen.style.display !== "none") {
    console.warn("Loading timeout - forcing game start");
    loadingScreen.style.display = "none";

    // Ensure models exist even if loading failed
    if (!playerModel) {
      createDinosaurModel().then((model) => {
        playerModel = model;
        playerModel.position.set(0, GROUND_LEVEL, 0);
        scene.add(playerModel);
        playerBoundingBox = new THREE.Box3().setFromObject(playerModel);
      });
    }

    if (!obstacleModel) {
      createObstacleModel().then((model) => {
        obstacleModel = model;
      });
    }

    startGame();
  }
}, 3000); // 3 second timeout

// Load models
// Since we couldn't download proper models, we'll create simplified models in code
// and then convert them to "fake" GLTF objects for consistency

// Load or create a dinosaur model
createDinosaurModel().then((model) => {
  playerModel = model;

  // Position the player
  playerModel.position.set(0, GROUND_LEVEL, 0);
  scene.add(playerModel);

  // Create player's bounding box
  playerBoundingBox = new THREE.Box3().setFromObject(playerModel);
});

// Load or create an obstacle model
createObstacleModel().then((model) => {
  obstacleModel = model;
});

// Player's bounding box - will be updated in animation loop
let playerBoundingBox = new THREE.Box3();

// Obstacle management
const OBSTACLE_SPEED = 0.25; // Increased from 0.1 to 0.25 for faster gameplay
const SPAWN_DISTANCE = -30; // Distance ahead of player where obstacles spawn
const DESPAWN_DISTANCE = 10; // Distance behind camera where obstacles are removed
const LANE_WIDTH = 12; // Increased from 10 to 12 for more space to maneuver

// Function to create a remote player mesh
function createRemotePlayer(
  id: string,
  x: number,
  y: number,
  z: number,
  color: number
): THREE.Object3D {
  // Wait until player model is loaded before creating remote players
  if (!playerModel) {
    console.log(
      `Waiting for player model to load before creating remote player ${id}`
    );
    // Retry after a short delay
    setTimeout(() => {
      if (playerModel && !remotePlayers[id]) {
        remotePlayers[id] = createRemotePlayer(id, x, y, z, color);
        updatePlayerCount();
      }
    }, 1000);

    // Return a temporary placeholder
    const placeholder = new THREE.Group();
    placeholder.position.set(x, y, z);
    scene.add(placeholder);
    return placeholder;
  }

  console.log(`Creating remote player: ${id} at position (${x}, ${y}, ${z})`);

  // Clone the player model for remote players
  const remotePlayer = playerModel.clone();

  // Give it a different color
  remotePlayer.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (color) {
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.7,
          metalness: 0.1,
        });
      }
    }
  });

  remotePlayer.position.set(x, y, z);
  scene.add(remotePlayer);
  console.log(`Remote player ${id} added to scene`);
  return remotePlayer;
}

// Socket.IO event listeners for multiplayer
socket.on("init", (data) => {
  console.log("Initialized with ID:", data.id);
  console.log("Current players:", Object.keys(data.players).length);
  playerId = data.id;

  // Create remote players that are already in the game
  Object.keys(data.players).forEach((id) => {
    if (id !== playerId) {
      console.log(`Initializing remote player: ${id}`);
      const p = data.players[id];
      remotePlayers[id] = createRemotePlayer(
        id,
        p.position.x,
        p.position.y,
        p.position.z,
        p.color
      );
    }
  });

  // Update player count
  updatePlayerCount();
});

socket.on("playerJoined", (data) => {
  console.log("Player joined:", data.id);
  if (data.id !== playerId && !remotePlayers[data.id]) {
    remotePlayers[data.id] = createRemotePlayer(
      data.id,
      data.position.x,
      data.position.y,
      data.position.z,
      data.color
    );
    updatePlayerCount();
  }
});

socket.on("playerMove", (data) => {
  if (data.id !== playerId && remotePlayers[data.id]) {
    remotePlayers[data.id].position.x = data.position.x;
    remotePlayers[data.id].position.y = data.position.y;
    remotePlayers[data.id].position.z = data.position.z;
  }
});

socket.on("playerLeft", (id) => {
  console.log("Player left:", id);
  if (remotePlayers[id]) {
    scene.remove(remotePlayers[id]);
    delete remotePlayers[id];
    updatePlayerCount();
  }
});

socket.on("newObstacle", (obstacleData) => {
  // Check if this is a remote obstacle (not spawned by us)
  if (!remoteObstacles[obstacleData.id] && obstacleModel) {
    // Clone the obstacle model
    const obstacle = obstacleModel.clone();

    // Position the obstacle
    obstacle.position.set(
      obstacleData.position.x,
      obstacleData.position.y,
      obstacleData.position.z
    );

    // Add to scene and obstacles tracking
    scene.add(obstacle);
    obstacles.push(obstacle);
    remoteObstacles[obstacleData.id] = obstacle;
  }
});

socket.on("playerGameOver", (id) => {
  if (remotePlayers[id]) {
    // Visual indication of player game over (turn gray)
    remotePlayers[id].traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x666666,
          roughness: 0.7,
          metalness: 0.1,
        });
      }
    });
  }
});

// Function to update player count display
function updatePlayerCount() {
  const count = Object.keys(remotePlayers).length + 1; // +1 for local player
  playersCountElement.textContent = `Players: ${count}`;
}

// Function to make the player jump
function jump() {
  if (isGameRunning && !isJumping) {
    isJumping = true;
    jumpStartTime = Date.now();

    // Broadcast jump to other players
    sendPlayerUpdate();
  }
}

// Function to send player update to server
function sendPlayerUpdate() {
  if (playerModel) {
    socket.emit("playerUpdate", {
      position: {
        x: playerModel.position.x,
        y: playerModel.position.y,
        z: playerModel.position.z,
      },
      isJumping: isJumping,
    });
  }
}

// Function to update the player's jump position
function updateJump() {
  if (isJumping && playerModel) {
    const jumpTime = Date.now() - jumpStartTime;

    if (jumpTime < JUMP_DURATION) {
      // Calculate jump height using a sine curve for a natural up and down movement
      // First half of the jump is going up, second half is coming down
      const jumpProgress = jumpTime / JUMP_DURATION;
      const jumpSine = Math.sin(jumpProgress * Math.PI);

      // Apply the jump height
      playerModel.position.y = GROUND_LEVEL + jumpSine * JUMP_HEIGHT;

      // Send position update to server periodically (reduce to limit network traffic)
      if (jumpTime % 100 < 20) {
        sendPlayerUpdate();
      }
    } else {
      // Jump is complete, return to ground level
      playerModel.position.y = GROUND_LEVEL;
      isJumping = false;

      // Final position update
      sendPlayerUpdate();
    }
  }
}

// Function to spawn a new obstacle
function spawnObstacle() {
  if (!isGameRunning || !obstacleModel) return;

  // Determine how many obstacles to spawn (1-4 obstacles with higher chance of multiples)
  const obstacleCount =
    Math.random() < 0.5
      ? Math.random() < 0.3
        ? 4
        : Math.random() < 0.5
        ? 3
        : 2
      : 1;

  for (let i = 0; i < obstacleCount; i++) {
    // Random x position within lane width, ensuring multiple obstacles are spread out
    let xPos;
    if (obstacleCount > 1) {
      // If multiple obstacles, distribute them across the lane
      const segmentWidth = LANE_WIDTH / obstacleCount;
      const segmentStart = -LANE_WIDTH / 2 + i * segmentWidth;
      xPos = segmentStart + Math.random() * segmentWidth;
    } else {
      // If single obstacle, place it randomly
      xPos = Math.random() * LANE_WIDTH - LANE_WIDTH / 2;
    }

    // Clone the obstacle model
    const obstacle = obstacleModel.clone();

    // Position the obstacle
    const zOffset = obstacleCount > 1 ? Math.random() * 3 - 1.5 : 0;
    obstacle.position.set(xPos, 0.35, SPAWN_DISTANCE + zOffset);

    // Add to scene and obstacles array
    scene.add(obstacle);
    obstacles.push(obstacle);

    // Broadcast obstacle spawn to all players
    socket.emit("obstacleSpawn", {
      position: {
        x: obstacle.position.x,
        y: obstacle.position.y,
        z: obstacle.position.z,
      },
    });
  }
}

// Function to check collision between player and an obstacle
function checkCollision(obstacle: THREE.Object3D): boolean {
  if (!playerModel) return false;

  // Update player's bounding box
  playerBoundingBox.setFromObject(playerModel);

  // Create obstacle's bounding box
  const obstacleBoundingBox = new THREE.Box3().setFromObject(obstacle);

  // Check for intersection
  return playerBoundingBox.intersectsBox(obstacleBoundingBox);
}

// Function to handle game over
function gameOver() {
  isGameRunning = false;
  gameOverElement.style.display = "block";
  playAgainButton.style.display = "block";

  // Stop spawning obstacles
  clearInterval(obstacleSpawnInterval);

  // Notify other players
  socket.emit("gameOver");
}

// Function to restart the game
function restartGame() {
  // Hide game over elements
  gameOverElement.style.display = "none";
  playAgainButton.style.display = "none";

  // Reset game state
  isGameRunning = true;
  score = 0;
  startTime = Date.now();

  // Clear existing obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    scene.remove(obstacles[i]);
  }
  obstacles.length = 0;

  // Reset player position
  if (playerModel) {
    playerModel.position.set(0, GROUND_LEVEL, 0);
  }
  isJumping = false;

  // Restart obstacle spawning
  if (obstacleSpawnInterval) {
    clearInterval(obstacleSpawnInterval);
  }
  obstacleSpawnInterval = setInterval(spawnObstacle, 500);

  // Notify server the player is active again
  sendPlayerUpdate();
}

// Update score display
function updateScore() {
  if (!isGameRunning) return;

  // Calculate score based on time (10 points per second)
  const currentTime = Date.now();
  score = Math.floor((currentTime - startTime) / 100);
  scoreElement.textContent = `Score: ${score}`;
}

// Set up obstacle spawning interval
let obstacleSpawnInterval: ReturnType<typeof setInterval>;

// Start the game after models are loaded
function startGame() {
  // Look at player
  camera.lookAt(playerModel.position);

  // Start spawning obstacles
  obstacleSpawnInterval = setInterval(spawnObstacle, 500);

  // Start animation loop
  animate();
}

// Event listeners for controls
// Keyboard (spacebar)
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    jump();
    event.preventDefault(); // Prevent page scroll on spacebar
  }
});

// Touch events for mobile
renderer.domElement.addEventListener("touchstart", (event) => {
  jump();
  event.preventDefault(); // Prevent default touch behavior
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (isGameRunning && playerModel) {
    // Update score
    updateScore();

    // Update jump animation
    updateJump();

    // Update controls in the animation loop
    controls.update();

    // Update obstacle positions and check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      // Move obstacle toward the camera
      obstacles[i].position.z += OBSTACLE_SPEED;

      // Check for collision with player
      if (checkCollision(obstacles[i])) {
        gameOver();
        break;
      }

      // If obstacle has passed behind the camera by the despawn distance, remove it
      if (obstacles[i].position.z > DESPAWN_DISTANCE) {
        // Remove from remoteObstacles if it exists there
        for (const id in remoteObstacles) {
          if (remoteObstacles[id] === obstacles[i]) {
            delete remoteObstacles[id];
            break;
          }
        }

        scene.remove(obstacles[i]);
        obstacles.splice(i, 1);
      }
    }

    // Send player position update periodically (every 200ms)
    if (Date.now() % 200 < 20) {
      sendPlayerUpdate();
    }
  }

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

// Helper function to create a dinosaur model
async function createDinosaurModel(): Promise<THREE.Object3D> {
  const dino = new THREE.Group();

  // Main body
  const bodyGeometry = new THREE.BoxGeometry(1, 1, 2);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22, // Forest green
    roughness: 0.7,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  dino.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x32cd32, // Lime green, slightly lighter
    roughness: 0.7,
    metalness: 0.1,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 0.5, -1.2);
  head.castShadow = true;
  dino.add(head);

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.3,
  });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(0.2, 0.6, -1.5);
  dino.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(-0.2, 0.6, -1.5);
  dino.add(rightEye);

  // Pupils
  const pupilGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.1,
    metalness: 0.1,
  });

  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(0.2, 0.6, -1.55);
  dino.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(-0.2, 0.6, -1.55);
  dino.add(rightPupil);

  // Tail
  const tailGeometry = new THREE.BoxGeometry(0.4, 0.4, 1.2);
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22, // Same green as body
    roughness: 0.7,
    metalness: 0.1,
  });
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  tail.position.set(0, 0.1, 1.3);
  tail.castShadow = true;
  dino.add(tail);

  // Back spikes
  const spikeGeometry = new THREE.ConeGeometry(0.2, 0.4, 4);
  const spikeMaterial = new THREE.MeshStandardMaterial({
    color: 0x006400, // Dark green
    roughness: 0.7,
    metalness: 0.1,
  });

  for (let i = 0; i < 5; i++) {
    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
    spike.rotation.x = Math.PI / 2;
    spike.position.set(0, 0.7, 0.5 - i * 0.4);
    spike.castShadow = true;
    dino.add(spike);
  }

  // Legs
  const legGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.3);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22, // Same green as body
    roughness: 0.7,
    metalness: 0.1,
  });

  const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
  frontLeftLeg.position.set(0.4, -0.4, -0.7);
  frontLeftLeg.castShadow = true;
  dino.add(frontLeftLeg);

  const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
  frontRightLeg.position.set(-0.4, -0.4, -0.7);
  frontRightLeg.castShadow = true;
  dino.add(frontRightLeg);

  const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
  backLeftLeg.position.set(0.4, -0.4, 0.7);
  backLeftLeg.castShadow = true;
  dino.add(backLeftLeg);

  const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
  backRightLeg.position.set(-0.4, -0.4, 0.7);
  backRightLeg.castShadow = true;
  dino.add(backRightLeg);

  return dino;
}

// Helper function to create an obstacle model
async function createObstacleModel(): Promise<THREE.Object3D> {
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
