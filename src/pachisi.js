import * as THREE from "three";
class PlayerPiece {
  constructor(color, startPosition) {
    this.color = color;
    this.position = startPosition;
    this.mesh = this.createMesh();
    this.originalColor = color;
  }

  createMesh() {
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 32);
    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 32);
    const topGeometry = new THREE.SphereGeometry(0.15, 32, 16);

    const material = new THREE.MeshPhongMaterial({ color: this.color });

    const baseMesh = new THREE.Mesh(baseGeometry, material);
    const bodyMesh = new THREE.Mesh(bodyGeometry, material);
    const topMesh = new THREE.Mesh(topGeometry, material);

    bodyMesh.position.y = 0.25;
    topMesh.position.y = 0.55;

    const group = new THREE.Group();
    group.add(baseMesh);
    group.add(bodyMesh);
    group.add(topMesh);

    // Position the piece at the center of its starting position
    group.position.set(this.position.x, 0.25, this.position.y);
    return group;
  }

  moveTo(newPosition) {
    this.position = newPosition;
    this.mesh.position.set(newPosition.x, 0.25, newPosition.y);
  }

  highlight() {
    this.mesh.children.forEach((child) => {
      child.material.emissive.setHex(0x555555);
      child.material.emissiveIntensity = 0.5;
    });
  }

  removeHighlight() {
    this.mesh.children.forEach((child) => {
      child.material.emissive.setHex(0x000000);
      child.material.emissiveIntensity = 0;
    });
  }
}

class Pointer {
  constructor(color) {
    this.mesh = this.createMesh(color);
    this.mesh.visible = false;
  }

  createMesh(color) {
    const geometry = new THREE.ConeGeometry(0.1, 0.3, 32);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI;
    return mesh;
  }

  show(position) {
    this.mesh.position.set(position.x, 1, position.y);
    this.mesh.visible = true;
  }

  hide() {
    this.mesh.visible = false;
  }
}

export class Pachisi {
  constructor(scene) {
    this.scene = scene;
    this.board = null;
    this.svgOverlay = null;
    this.players = [
      { color: 0xff0000, colorName: "Red", pieces: [], pointers: [] },
      { color: 0x00ff00, colorName: "Green", pieces: [], pointers: [] },
      { color: 0x0000ff, colorName: "Blue", pieces: [], pointers: [] },
      { color: 0xffff00, colorName: "Yellow", pieces: [], pointers: [] },
    ];
    this.currentPlayer = 0;
    this.diceRolled = false;
    this.diceValues = [];
    this.movesRemaining = 0;
  }

  initializeBoard() {
    // Create the base board
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
    });
    this.board = new THREE.Mesh(geometry, material);
    this.board.rotation.x = -Math.PI / 2;
    this.scene.add(this.board);

    // Load SVG as a texture
    const loader = new THREE.TextureLoader();
    loader.load("./src/pachisi.svg", (texture) => {
      const svgMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const svgPlane = new THREE.PlaneGeometry(10, 10);
      this.svgOverlay = new THREE.Mesh(svgPlane, svgMaterial);
      this.svgOverlay.rotation.x = -Math.PI / 2;
      this.svgOverlay.position.y = 0.01; // Slightly above the board

      this.scene.add(this.svgOverlay);
    });

    // Add some basic lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  createPlayerPieces() {
    const startPositions = [
      { x: -3.5, y: -3.5 },
      { x: 3, y: -3.5 },
      { x: 3, y: 3 },
      { x: -3.5, y: 3 },
    ];

    this.players.forEach((player, index) => {
      for (let i = 0; i < 4; i++) {
        const offsetX = (i % 2) * 0.5;
        const offsetY = Math.floor(i / 2) * 0.5;
        const position = {
          x: startPositions[index].x + offsetX,
          y: startPositions[index].y + offsetY,
        };
        const piece = new PlayerPiece(player.color, position);
        piece.mesh.position.y = 0.1; // Raise pieces slightly above the SVG overlay
        player.pieces.push(piece);
        this.scene.add(piece.mesh);

        const pointer = new Pointer(player.color);
        player.pointers.push(pointer);
        this.scene.add(pointer.mesh);
      }
    });
  }

  initialize() {
    this.initializeBoard();
    this.createPlayerPieces();
    this.updatePlayerInfo(); // Initialize player info
  }

  nextPlayer() {
    this.removeHighlightFromCurrentPlayer();
    this.hidePointersForCurrentPlayer();
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    this.updatePlayerInfo();
    this.diceRolled = false;
  }

  rollDice() {
    if (this.diceRolled) {
      return null;
    }

    this.diceValues = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
    this.movesRemaining = 2;
    this.diceRolled = true;
    this.highlightCurrentPlayerPieces();
    this.showPointersForCurrentPlayer();
    return this.diceValues;
  }

  highlightCurrentPlayerPieces() {
    this.players[this.currentPlayer].pieces.forEach((piece) =>
      piece.highlight()
    );
  }

  removeHighlightFromCurrentPlayer() {
    this.players[this.currentPlayer].pieces.forEach((piece) =>
      piece.removeHighlight()
    );
  }

  showPointersForCurrentPlayer() {
    this.players[this.currentPlayer].pieces.forEach((piece, index) => {
      this.players[this.currentPlayer].pointers[index].show(piece.position);
    });
  }

  hidePointersForCurrentPlayer() {
    this.players[this.currentPlayer].pointers.forEach((pointer) =>
      pointer.hide()
    );
  }

  movePiece(playerIndex, pieceIndex, steps) {
    if (this.movesRemaining <= 0) return;

    const piece = this.players[playerIndex].pieces[pieceIndex];
    // This is still a placeholder for move logic since we need to map path on board
    const newPosition = {
      x: piece.position.x + steps * 0.5,
      y: piece.position.y + steps * 0.5,
    };
    piece.moveTo(newPosition);
    this.players[playerIndex].pointers[pieceIndex].show(newPosition);

    this.movesRemaining--;
    if (this.movesRemaining === 0) {
      this.diceRolled = false;
      this.nextPlayer();
    }
  }

  findPieceByMesh(mesh) {
    for (const player of this.players) {
      for (const piece of player.pieces) {
        if (piece.mesh === mesh || piece.mesh.children.includes(mesh)) {
          return piece;
        }
      }
    }
    return null;
  }

  canMovePiece(piece) {
    return (
      this.diceRolled &&
      this.movesRemaining > 0 &&
      this.players[this.currentPlayer].pieces.includes(piece)
    );
  }

  updatePlayerInfo() {
    const currentPlayerElement = document.getElementById("current-player");
    const playerColorElement = document.getElementById("player-color");
    currentPlayerElement.textContent = `Player ${this.currentPlayer + 1}`;
    playerColorElement.style.backgroundColor =
      this.players[this.currentPlayer].colorName;
  }
}
