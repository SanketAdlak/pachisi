<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        // Basic setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

// Create a board with SVG image on top of it
const boardGeometry = new THREE.PlaneGeometry(5, 5);
const loader = new THREE.TextureLoader();
loader.load('./pachisi/Parcheesi.svg', function (texture) {
    const boardMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    scene.add(board);
});


// Animation loop
function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

animate();
    </script>