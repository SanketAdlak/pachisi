import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';

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

    group.position.set(this.position.x, 0.25, this.position.y); // Raise it slightly off the board
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
    this.mesh.position.set(position.x, 0.8, position.y);
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
  }

  initializeBoard() {
    // Create the base board
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
    });
    this.board = new THREE.Mesh(geometry, material);
    this.board.rotation.x = Math.PI / 2;
    this.scene.add(this.board);

    // Load SVG and create overlay
    const loader = new SVGLoader();
    loader.load("./pachisi/pachisi.svg", (data) => {
      const svgGroup = new THREE.Group();
      const paths = data.paths;

      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const material = new THREE.MeshBasicMaterial({
          color: path.color,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const shapes = path.toShapes(true);

        for (let j = 0; j < shapes.length; j++) {
          const shape = shapes[j];
          const geometry = new THREE.ShapeGeometry(shape);
          const mesh = new THREE.Mesh(geometry, material);
          svgGroup.add(mesh);
        }
      }

      svgGroup.scale.set(0.01, -0.01, 0.01); // Adjust scale as needed
      svgGroup.position.set(-5, 0.01, -5); // Adjust position to center and raise slightly above the board
      svgGroup.rotation.x = Math.PI / 2;

      this.svgOverlay = svgGroup;
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
      { x: -4, y: -4 },
      { x: 4, y: -4 },
      { x: 4, y: 4 },
      { x: -4, y: 4 },
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
    const result = Math.floor(Math.random() * 6) + 1;
    this.highlightCurrentPlayerPieces();
    this.showPointersForCurrentPlayer();
    this.diceRolled = true;
    return result;
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
    // This is a placeholder for move logic
    const piece = this.players[playerIndex].pieces[pieceIndex];
    const newPosition = {
      x: piece.position.x + (Math.random() - 0.5) * steps * 0.5,
      y: piece.position.y + (Math.random() - 0.5) * steps * 0.5,
    };
    piece.moveTo(newPosition);
    this.players[playerIndex].pointers[pieceIndex].show(newPosition);
    this.diceRolled = false;
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
      this.diceRolled && this.players[this.currentPlayer].pieces.includes(piece)
    );
  }

  update(deltaTime) {
    // Add any continuous updates here
    // For example, you could animate the pointers
    this.players.forEach((player) => {
      player.pointers.forEach((pointer) => {
        if (pointer.mesh.visible) {
          pointer.mesh.position.y = 0.8 + Math.sin(Date.now() * 0.005) * 0.1;
        }
      });
    });
  }

  updatePlayerInfo() {
    const player = this.players[this.currentPlayer];
    document.getElementById("current-player").textContent = `Player ${
      this.currentPlayer + 1
    } (${player.colorName})`;
    document.getElementById(
      "player-color"
    ).style.backgroundColor = `#${player.color.toString(16).padStart(6, "0")}`;
  }
}
