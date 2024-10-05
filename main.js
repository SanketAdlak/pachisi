import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Pachisi } from "./src/pachisi.js";

// Basic setup
const scene = new THREE.Scene();
const container = document.getElementById("game-container");
const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Create Pachisi game
const pachisi = new Pachisi(scene);
pachisi.initialize();

// Position the camera for a good view of the 3D board and pieces
camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Adds smooth damping effect
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2;

// Handle window resize
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Roll dice button functionality
document.getElementById("roll-dice").addEventListener("click", () => {
  if (!pachisi.diceRolled) {
    const result = pachisi.rollDice();
    if (result) {
      alert(`You rolled ${result[0]} and ${result[1]}!`);
      pachisi.updatePlayerInfo();
    }
  } else {
    alert("You have already rolled the dice. Please move your pieces.");
  }
});

// Raycaster for piece selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Add click event listener for piece selection
renderer.domElement.addEventListener("click", onPieceClick, false);

function onPieceClick(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    // Check if the clicked object is a player piece
    const clickedObject = intersects[0].object;
    const playerPiece = pachisi.findPieceByMesh(clickedObject);

    if (playerPiece && pachisi.canMovePiece(playerPiece)) {
      const currentPlayer = pachisi.currentPlayer;
      const pieceIndex =
        pachisi.players[currentPlayer].pieces.indexOf(playerPiece);

      // Ask the player which dice value to use
      const diceValueToUse = prompt(
        `Choose which dice value to use (${pachisi.diceValues.join(" or ")}):`,
        pachisi.diceValues[0]
      );

      if (pachisi.diceValues.includes(Number(diceValueToUse))) {
        pachisi.movePiece(currentPlayer, pieceIndex, Number(diceValueToUse));

        // Remove the used dice value
        const indexToRemove = pachisi.diceValues.indexOf(
          Number(diceValueToUse)
        );
        if (indexToRemove !== -1) {
          pachisi.diceValues.splice(indexToRemove, 1);
        }

        if (pachisi.movesRemaining === 0) {
          alert("Turn ended. Next player's turn.");
        } else {
          alert(
            `You have ${
              pachisi.movesRemaining
            } move(s) remaining with value(s): ${pachisi.diceValues.join(", ")}`
          );
        }
      } else {
        alert("Invalid dice value selected. Please try again.");
      }
    }
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
