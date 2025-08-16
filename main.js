import * as THREE from 'three';
import PhysicsBody from './Bodies/physicsBody.js'
import Star from './Bodies/star'
import { randInt } from 'three/src/math/MathUtils.js';

let scene, camera, renderer, pivot, sun, physBodies = [];
let scrollModifier = .1;
let spinCamera = false; let lastX = 0; let lastY = 0; let rotateModifier = .01; let cameraMin = 200; let cameraMax = 10000;
let clock = new THREE.Clock();
let gravConstant = 100;
let softening = 1;
let bodyCount = 50;

export function init() {
  cleanUp();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  camera.position.z = 400;

  pivot = new THREE.Group();

  sun = new Star({mass: 100, position : [20, 0, 0], geometry : new THREE.SphereGeometry(2, 32, 16), pointLight : new THREE.PointLight("#f2df07", 1000, 0, 1),  material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});
  physBodies.push(sun);
  
  for (let i = 0; i < bodyCount; i++) {
    let color = new THREE.Color( 0xffffff );
    color.setHex( Math.random() * 0xffffff );
    physBodies.push(new PhysicsBody({ mass: 10, position: [randInt(-20, 20), randInt(-20, 20), randInt(-20, 20)], geometry: new THREE.SphereGeometry(1, 32, 16), material: new THREE.MeshStandardMaterial({ color: color }) }));
  }

  for (let b of physBodies) {
    pivot.add(b);
  }
  scene.add(pivot);

  resize();
}

function animate() {
  let timeSinceLastFrame = Math.min(clock.getDelta(), 1/30);

  for (let body of physBodies) { //reset acceleration
    body.acceleration[0] = 0;
    body.acceleration[1] = 0;
    body.acceleration[2] = 0;
  }

  for (let i = 0; i < physBodies.length; i++) {
    let body1 = physBodies[i]
    for (let j = i + 1; j < physBodies.length; j++) {
      let body2 = physBodies[j];

      let dx = body2.position.x - body1.position.x;
      let dy = body2.position.y - body1.position.y;
      let dz = body2.position.z - body1.position.z;

      let distance = Math.sqrt(dx * dx + dy * dy + dz * dz + softening);

      let body1AccelerationX = gravConstant * (dx / (distance ** 3)) * body2.mass;
      let body1AccelerationY = gravConstant * (dy / (distance ** 3)) * body2.mass;
      let body1AccelerationZ = gravConstant * (dz / (distance ** 3)) * body2.mass;

      body1.acceleration[0] += body1AccelerationX;
      body1.acceleration[1] += body1AccelerationY;
      body1.acceleration[2] += body1AccelerationZ;

      let body2AccelerationX = -gravConstant * (dx / (distance ** 3)) * body1.mass;
      let body2AccelerationY = -gravConstant * (dy / (distance ** 3)) * body1.mass;
      let body2AccelerationZ = -gravConstant * (dz / (distance ** 3)) * body1.mass;
      body2.acceleration[0] += body2AccelerationX;
      body2.acceleration[1] += body2AccelerationY;
      body2.acceleration[2] += body2AccelerationZ;
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

window.addEventListener('wheel', (e) => {
  let scrollY = e.deltaY * scrollModifier;
  camera.position.z += scrollY;
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
init();

function cleanUp() {
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.dispose();

    const gl = renderer.getContext();
    gl?.getExtension("WEBGL_lose_context")?.loseContext?.();

    renderer.domElement.remove();
  }

  if (scene) {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose?.();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose?.());
        } else {
          obj.material.dispose?.();
        }
      }
    });
  }

  renderer = null;
  scene = null;
  camera = null;
  pivot = null;
  sun = null;
  physBodies = [];
}