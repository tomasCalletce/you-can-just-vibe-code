import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Configure Socket.IO Server with CORS options
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow connections from Vite dev server
    methods: ["GET", "POST"]
  }
});

// Serve static files from the dist directory (Vite build output)
app.use(express.static(path.join(__dirname, "dist")));

// Serve index.html for all routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// --- Game State --- 
const players = {}; // Store player data { socketId: { position: {x,y,z}, color, ... } }

// Helper to generate random colors
function getRandomColor() {
    return Math.random() * 0xffffff;
}

// Function to get a random starting X position
function getRandomStartX() {
    const range = 4; // Spread players over a width of 4 units (-2 to +2)
    return Math.random() * range - range / 2;
}

// --- Socket.IO Handlers --- 
io.on("connection", (socket) => {
  console.log(`[Server] User connected: ${socket.id}`);

  // Initialize player data with random start X
  const startX = getRandomStartX();
  players[socket.id] = {
    id: socket.id,
    position: { x: startX, y: 0.1, z: 0 }, // Use random X
    color: getRandomColor(),
    isJumping: false,
    isGameOver: false
  };
  console.log(`[Server] Player data created for ${socket.id} at x=${startX.toFixed(2)}. Current players:`, Object.keys(players));

  // Send initial state to the new player
  const initData = {
    id: socket.id,
    players: players
  };
  console.log(`[Server] Emitting 'init' to ${socket.id} with data:`, Object.keys(initData.players)); // Log before emit
  socket.emit("init", initData);
  console.log(`[Server] 'init' emitted to ${socket.id}`); // Log after emit

  // Notify other players about the new player
  const joinedPlayerData = players[socket.id];
  console.log(`[Server] Broadcasting 'playerJoined' for ${socket.id}`); // Log before broadcast
  socket.broadcast.emit("playerJoined", joinedPlayerData);
  console.log(`[Server] 'playerJoined' broadcasted for ${socket.id}`); // Log after broadcast

  // Handle player updates
  socket.on("playerUpdate", (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].isJumping = data.isJumping;
      // Broadcast movement to other players
      socket.broadcast.emit("playerMove", players[socket.id]);
    }
  });

  // Handle obstacle spawning (broadcast from client)
  socket.on("obstacleSpawn", (data) => {
     // Just broadcast it to other clients
     // console.log(`Broadcasting obstacle spawn: ${data.id}`);
     socket.broadcast.emit("newObstacle", data);
  });

  // Handle standard collectible collection
  socket.on("collectibleCollected", (collectibleId) => {
      // Notify other players that this item was collected
      // console.log(`Broadcasting collection of ${collectibleId}`);
      socket.broadcast.emit("collectibleWasCollected", collectibleId);
  });

  // Handle SPONSOR collectible collection
  socket.on("sponsorCollectibleCollected", (collectibleId) => {
      // Notify other players that this item was collected
      console.log(`[Server] Broadcasting collection of SPONSOR collectible ${collectibleId}`);
      socket.broadcast.emit("sponsorCollectibleWasCollected", collectibleId);
  });

  // Handle game over notification
  socket.on("gameOver", () => {
      if (players[socket.id]) {
          console.log(`Player ${socket.id} game over`);
          // Set the flag on the server state
          players[socket.id].isGameOver = true;
          // Notify others
          console.log(`[Server] Broadcasting 'playerGameOver' for ${socket.id}`);
          socket.broadcast.emit("playerGameOver", socket.id);
          console.log(`[Server] 'playerGameOver' broadcasted for ${socket.id}`);
      }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
      console.log(`[Server] User disconnected: ${socket.id}`);
      if (players[socket.id]) {
          // Notify other players
          console.log(`[Server] Broadcasting 'playerLeft' for ${socket.id}`); // Log before broadcast
          socket.broadcast.emit("playerLeft", socket.id);
          console.log(`[Server] 'playerLeft' broadcasted for ${socket.id}`); // Log after broadcast
          // Remove player from state
          delete players[socket.id];
          console.log("[Server] Remaining players:", Object.keys(players).length);
      }
  });
}); // End of io.on("connection", ...)

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Allowing CORS connections from: http://localhost:5173`);
});

// REMOVE any extra characters or lines after this point