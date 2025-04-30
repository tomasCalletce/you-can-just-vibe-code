import * as THREE from 'three'; // Import THREE
import { restartGame } from "./game"; // Assuming game.ts will export restartGame
import { getCamera } from './scene'; // We'll get the camera from scene.ts later

export let scoreElement: HTMLDivElement;
export let playersCountElement: HTMLDivElement;
export let loadingScreen: HTMLDivElement;
export let gameOverElement: HTMLDivElement;
export let playAgainButton: HTMLDivElement;

export function initUI() {
  // Create score display element
  scoreElement = document.createElement("div");
  scoreElement.id = "score";
  scoreElement.style.position = "absolute";
  scoreElement.style.top = "60px";
  scoreElement.style.left = "20px";
  scoreElement.style.color = "white";
  scoreElement.style.fontSize = "24px";
  scoreElement.style.fontFamily = "Arial, sans-serif";
  scoreElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  scoreElement.style.zIndex = "1000";
  scoreElement.textContent = "Score: 0";
  document.body.appendChild(scoreElement);

  // Create players count element
  playersCountElement = document.createElement("div");
  playersCountElement.id = "players-count";
  playersCountElement.style.position = "absolute";
  playersCountElement.style.top = "90px";
  playersCountElement.style.left = "20px";
  playersCountElement.style.color = "white";
  playersCountElement.style.fontSize = "18px";
  playersCountElement.style.fontFamily = "Arial, sans-serif";
  playersCountElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.5)";
  playersCountElement.style.zIndex = "1000";
  playersCountElement.textContent = "Players: 1";
  document.body.appendChild(playersCountElement);

  // Create loading screen
  loadingScreen = document.createElement("div");
  loadingScreen.id = "loading-screen";
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
  loadingText.textContent = "Esto lo construí con solo Cursor y sin programar"; // Keep or change this text
  loadingText.style.marginBottom = "20px";
  loadingScreen.appendChild(loadingText);

  const subText = document.createElement("div");
  subText.textContent = "Cargando...";
  subText.style.fontSize = "18px";
  subText.style.opacity = "0.8";
  loadingScreen.appendChild(subText);

  // Create game over display
  gameOverElement = document.createElement("div");
  gameOverElement.id = "game-over";
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
  playAgainButton = document.createElement("div");
  playAgainButton.id = "play-again";
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
    // We need to import restartGame from game.ts eventually
    // restartGame(); // Old call
    const camera = getCamera(); // Get camera reference (will be implemented in scene.ts)
    if (camera) {
        restartGame(camera);
    } else {
        console.error("Camera not available for restart");
    }
  });
}

export function updateScoreDisplay(score: number) {
  if (scoreElement) {
    scoreElement.textContent = `Score: ${score}`;
  }
}

export function updatePlayerCountDisplay(count: number) {
  if (playersCountElement) {
    playersCountElement.textContent = `Players: ${count}`;
  }
}

export function showLoadingScreen(show: boolean) {
  if (loadingScreen) {
    loadingScreen.style.display = show ? "flex" : "none";
  }
}

export function showGameOverUI(show: boolean) {
  if (gameOverElement) {
    gameOverElement.style.display = show ? "block" : "none";
  }
  if (playAgainButton) {
    playAgainButton.style.display = show ? "block" : "none";
  }
} 