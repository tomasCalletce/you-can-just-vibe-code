import { renderer } from './scene';
import { jump, moveLeft, moveRight } from './player'; // Import the jump action and move functions

export function initControls() {
    // Keyboard (spacebar)
    window.addEventListener("keydown", handleKeyDown);

    // Touch events for mobile
    if (renderer) {
        renderer.domElement.addEventListener("touchstart", handleTouchStart, { passive: false });
    }

    console.log("Controls initialized");
}

function handleKeyDown(event: KeyboardEvent) {
    switch (event.code) {
        case "Space":
            jump();
            event.preventDefault(); // Prevent page scroll on spacebar
            break;
        case "ArrowLeft":
        case "KeyA": // Optional: Add WASD support
            moveLeft();
            event.preventDefault();
            break;
        case "ArrowRight":
        case "KeyD": // Optional: Add WASD support
            moveRight();
            event.preventDefault();
            break;
    }
}

function handleTouchStart(event: TouchEvent) {
    jump();
    event.preventDefault(); // Prevent default touch behavior (like zooming or scrolling)
}

// Function to remove listeners if needed (e.g., on cleanup)
export function removeControls() {
     window.removeEventListener("keydown", handleKeyDown);
     if (renderer) {
        renderer.domElement.removeEventListener("touchstart", handleTouchStart);
    }
    console.log("Controls removed");
} 