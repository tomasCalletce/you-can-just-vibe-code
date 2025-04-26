import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const app = express();
const server = createServer(app);
const io = new Server(server);

// Store connected players
const players = {};

// Store active obstacles
const obstacles = [];

// Serve static files from the dist directory (Vite build output)
app.use(express.static(path.join(rootDir, "dist")));

// Serve index.html for all routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "dist", "index.html"));
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Create a new player
  players[socket.id] = {
    id: socket.id,
    position: { x: 0, y: 0.5, z: 0 },
    color: getRandomColor(),
    isJumping: false,
  };

  // Log the current players for debugging
  console.log(
    `Current players (${Object.keys(players).length}):`,
    Object.keys(players)
  );

  // Send the current state to the new player
  socket.emit("init", {
    id: socket.id,
    players: players,
    obstacles: obstacles,
  });

  // Broadcast new player to all other players
  socket.broadcast.emit("playerJoined", players[socket.id]);
  console.log("Broadcasting new player to others:", socket.id);

  // Handle player position updates
  socket.on("playerUpdate", (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].isJumping = data.isJumping;

      // Broadcast player update to all other players
      socket.broadcast.emit("playerMove", {
        id: socket.id,
        position: data.position,
        isJumping: data.isJumping,
      });
    }
  });

  // Handle obstacle spawns
  socket.on("obstacleSpawn", (data) => {
    const obstacle = {
      id: Date.now().toString() + Math.random(),
      position: data.position,
      timeCreated: Date.now(),
    };

    obstacles.push(obstacle);

    // Broadcast new obstacle to all clients (including sender)
    io.emit("newObstacle", obstacle);

    // Remove old obstacles (after 10 seconds)
    setTimeout(() => {
      const index = obstacles.findIndex((o) => o.id === obstacle.id);
      if (index !== -1) {
        obstacles.splice(index, 1);
      }
    }, 10000);
  });

  // Handle player game over
  socket.on("gameOver", () => {
    if (players[socket.id]) {
      socket.broadcast.emit("playerGameOver", socket.id);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (players[socket.id]) {
      socket.broadcast.emit("playerLeft", socket.id);
      delete players[socket.id];
      console.log(`Players remaining: ${Object.keys(players).length}`);
    }
  });
});

// Generate a random color for new players
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "0x";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return parseInt(color, 16);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
