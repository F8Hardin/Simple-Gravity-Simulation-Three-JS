import * as THREE from 'three';
import PhysicsBody from './Bodies/physicsBody'
import Star from './Bodies/star'

let scene, camera, renderer, sun, planet;
let mouseMult = .05;
let mousePositionX = 0;
let mousePositionY = 0;
let scrollDelta = 0;
let scrollOffset = .01;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  camera.position.z = 25;

  sun = new Star({position : [0, 0, 0],  geometry : new THREE.SphereGeometry(5, 32, 16), pointLight : new THREE.PointLight("#f2df07", 1000, 0),  material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});

  planet = new PhysicsBody({position : [0, 0, 0],  geometry : new THREE.SphereGeometry(1, 32, 16),  material : new THREE.MeshStandardMaterial({color : "#00ff00"})});
  scene.add(planet)
  scene.add(sun.group);

  resize();
}

function animate() {
  let directionX = mousePositionX - planet.position.x;
  let directionY = mousePositionY - planet.position.y;

  planet.position.set(planet.position.x + (directionX * mouseMult), planet.position.y + (directionY * mouseMult), planet.position.z + scrollDelta);
  scrollDelta = 0;
  renderer.render( scene, camera );
}

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

window.addEventListener('mousemove', (e) => {
  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(planeZ, intersection);

  mousePositionX = intersection.x;
  mousePositionY = intersection.y;
});

window.addEventListener('wheel', (e) => {
  scrollDelta += e.deltaY * scrollOffset;
  scrollDelta = clamp(scrollDelta, -10, 10);
  console.log(scrollDelta);
});

window.addEventListener( 'resize', resize );
init()