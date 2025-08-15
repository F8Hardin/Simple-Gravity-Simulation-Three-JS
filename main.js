import * as THREE from 'three';
import PhysicsBody from './Bodies/physicsBody.js'
import Star from './Bodies/star'

let scene, camera, renderer, sun, planet;
let scrollModifier = .01;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  camera.position.z = 25;

  sun = new Star({position : [0, 0, 0],  geometry : new THREE.SphereGeometry(5, 32, 16), pointLight : new THREE.PointLight("#f2df07", 1000, 0),  material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});

  planet = new PhysicsBody({position : [10, 0, 0],  geometry : new THREE.SphereGeometry(1, 32, 16),  material : new THREE.MeshStandardMaterial({color : "#2d7af7"})});
  scene.add(planet)
  scene.add(sun);

  resize();
}

function animate() {
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

window.addEventListener('wheel', (e) => {
  let scrollY = e.deltaY * scrollModifier;
  camera.position.z = clamp(camera.position.z + scrollY, 10, 50);
});

//window.addEventListener('click', (e) => {});

window.addEventListener( 'resize', resize );
init()