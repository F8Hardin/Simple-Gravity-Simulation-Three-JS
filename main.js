import * as THREE from 'three';
import PhysicsBody from './Bodies/physicsBody.js'
import Star from './Bodies/star'
import { sqrt } from 'three/tsl';

let scene, camera, renderer, pivot, sun, physBodies = [];
let scrollModifier = .1;
let spinCamera = false; let lastX = 0; let lastY = 0; let rotateModifier = .01; let cameraMin = 200; let cameraMax = 10000;
let clock = new THREE.Clock();
let gravConstant = .1;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  camera.position.z = 400;

  pivot = new THREE.Group();

  sun = new Star({mass: 500, position : [0, 0, 0],  geometry : new THREE.SphereGeometry(20, 32, 16), pointLight : new THREE.PointLight("#f2df07", 1000, 0),  material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});
  physBodies.push(sun);
  
  let planet1 = new PhysicsBody({mass: 20, position : [100, 10, 5], initialVelocity: [10, 15, -10], geometry : new THREE.SphereGeometry(10, 32, 16),  material : new THREE.MeshStandardMaterial({color : "#2d7af7"})});
  physBodies.push(planet1);
  let planet2 = new PhysicsBody({mass: 10, position : [200, 0, 0], initialVelocity: [5, 5, 5], geometry : new THREE.SphereGeometry(5, 32, 16),  material : new THREE.MeshStandardMaterial({color : "red"})});
  physBodies.push(planet2);
  let planet3 = new PhysicsBody({ mass: 20, position : [-300, 50, 0],  initialVelocity: [0, -6, 2],  geometry : new THREE.SphereGeometry(7, 32, 16),  material : new THREE.MeshStandardMaterial({ color : "blue" }) });
  physBodies.push(planet3);
  let planet4 = new PhysicsBody({ mass: 5, position : [0, -400, 0],  initialVelocity: [6, 0, -3],  geometry : new THREE.SphereGeometry(4, 32, 16),  material : new THREE.MeshStandardMaterial({ color : "green" }) });
  physBodies.push(planet4);
  let planet5 = new PhysicsBody({ mass: 15, position : [100, 300, 0],  initialVelocity: [-4, 2, 1],  geometry : new THREE.SphereGeometry(6, 32, 16),  material : new THREE.MeshStandardMaterial({ color : "purple" }) });
  physBodies.push(planet5);
  let planet6 = new PhysicsBody({ mass: 8, position : [0, 0, 500],  initialVelocity: [-3, -4, 0],  geometry : new THREE.SphereGeometry(3, 32, 16),  material : new THREE.MeshStandardMaterial({ color : "orange" }) });
  physBodies.push(planet6);


  for (let b of physBodies) {
    pivot.add(b);
  }
  scene.add(pivot);

  resize();
}

function animate() {
  let timeSinceLastFrame = clock.getDelta();

  for (let b of physBodies) { //reset acceleration
    b.acceleration[0] = 0;
    b.acceleration[1] = 0;
    b.acceleration[2] = 0;
  }

  for (let key in physBodies){
    for (let otherBody in physBodies){
      if (physBodies[key] != physBodies[otherBody]){ //dont simulate with itself
        let m1 = physBodies[key];
        let m2 = physBodies[otherBody];

        let dx = m2.position.x - m1.position.x;
        let dy = m2.position.y - m1.position.y;
        let dz = m2.position.z - m1.position.z;

        let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        let accelerationX = gravConstant * (m2.mass / (distance ** 3)) * dx;
        let accelerationY = gravConstant * (m2.mass / (distance ** 3)) * dy;
        let accelerationZ = gravConstant * (m2.mass / (distance ** 3)) * dz;

        console.log("Acceleration. X: " + accelerationX + ". Y: " + accelerationY + ". Z: " + accelerationZ)
        physBodies[key].acceleration[0] += accelerationX;
        physBodies[key].acceleration[1] += accelerationY;
        physBodies[key].acceleration[2] += accelerationZ;

        physBodies[otherBody].acceleration[0] -= accelerationX;
        physBodies[otherBody].acceleration[1] -= accelerationY;
        physBodies[otherBody].acceleration[2] -= accelerationZ;
      }
    }
  }

  for (let b of physBodies){
    b.animate(timeSinceLastFrame);
  }

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
  camera.position.z = clamp(camera.position.z + scrollY, cameraMin, cameraMax);
});

window.addEventListener('mousedown', (e) => { spinCamera = true; lastX = e.clientX; lastY = e.clientY});
window.addEventListener('mouseup', (e) => { spinCamera = false;});

window.addEventListener('mousemove', (e) => {
  if (spinCamera) {
    let deltaX = lastX - e.clientX;
    let deltaY = lastY - e.clientY;

    lastX = e.clientX;
    lastY = e.clientY;

    pivot.rotation.y += (deltaX * rotateModifier);
    pivot.rotation.z += (deltaY * rotateModifier);
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'r'){
    pivot.rotation.set(0, 0, 0);
  }
});

window.addEventListener( 'resize', resize );
init()