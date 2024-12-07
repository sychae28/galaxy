import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';

/**
 * Base Setup
 */
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Galaxy Generation Parameters
 */
const parameters = {
  count: 114400,
  size: 0.01,
  radius: 6.9,
  branches: 8,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: '#ff6030',
  outsideColor: '#1b3984',
};

let geometry = null;
let galaxyMaterial = null;
let points = null;

const generateGalaxy = () => {
  if (points !== null) {
    geometry.dispose();
    galaxyMaterial.dispose();
    scene.remove(points);
  }

  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);

  const colorInside = new THREE.Color(parameters.insideColor);
  const colorOutside = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;
    const radius = Math.random() * parameters.radius;
    const spinAngle = radius * parameters.spin;
    const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

    const randomX = (Math.random() - 0.5) * parameters.randomness * radius;
    const randomY = (Math.random() - 0.5) * parameters.randomness * radius;
    const randomZ = (Math.random() - 0.5) * parameters.randomness * radius;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / parameters.radius);
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  galaxyMaterial = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  points = new THREE.Points(geometry, galaxyMaterial);
  scene.add(points);

  points.rotation.x = Math.PI / 2;
};

generateGalaxy();

/**
 * GUI Controls for Galaxy
 */
const galaxyFolder = gui.addFolder('Galaxy');
galaxyFolder.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, 'radius').min(1).max(20).step(0.1).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy);
galaxyFolder.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy);
galaxyFolder.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy);

/**
 * Sizes and Renderer
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Camera and Camera Group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 6;
cameraGroup.add(camera);

// Cursor
const cursor = { x: 0, y: 0 };
window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = -(event.clientY / sizes.height - 0.5);
});

// Scroll Interaction
let scrollY = window.scrollY;
const objectsDistance = 4;

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * 3D Objects
 */
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load('textures/gradients/3.jpg');
gradientTexture.minFilter = THREE.NearestFilter;

const objectMaterial = new THREE.MeshToonMaterial({
  color: '#ffffff',
  gradientMap: gradientTexture,
});

// My Project Objects
const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), objectMaterial);
const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), objectMaterial);
const mesh3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), objectMaterial);
const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), objectMaterial); // Adjusted size

// Position objects
mesh1.position.set(2, 0, 0);
mesh2.position.set(-2, -objectsDistance * 1, 0);
mesh3.position.set(2, -objectsDistance * 2, 0);
sphere.position.set(0, -objectsDistance * 3, 0);

// Add objects to the scene
scene.add(mesh1, mesh2, mesh3, sphere);

// Add objects to animation array
const sectionMeshes = [mesh1, mesh2, mesh3, sphere];

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animation Loop
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Camera Parallax
  const parallaxX = cursor.x * 0.5;
  const parallaxY = cursor.y * 0.5;
  cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 0.1;
  cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 0.1;

  // Smooth scrolling
  const targetY = -scrollY / sizes.height * objectsDistance;
  cameraGroup.position.y += (targetY - cameraGroup.position.y) * 0.1;

  // Animate meshes
  sectionMeshes.forEach((mesh) => {
    mesh.rotation.x = elapsedTime * 1;
    mesh.rotation.y = elapsedTime * 0.12;
  });

  // Update controls
  controls.update();

  // Render the scene
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
