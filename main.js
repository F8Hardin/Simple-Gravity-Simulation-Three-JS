import * as THREE from 'three';
import PhysicsBody, { AUModifer } from './Bodies/physicsBody.js'
import Star from './Bodies/star.js'
import { randInt } from 'three/src/math/MathUtils.js';
import OctTree from './OctTree.js';
import { max } from 'three/src/nodes/TSL.js';

let scene, camera, renderer, pivot, sun, earth, physBodies = []; export let maxSpawnRange = 1; export let bounceEffect = 0;
let scrollModifier = .2; let gravConstant = 1; export let bodyCount = 10; export let showTrails = false; let trailLengths = 250;
let spinCamera = false; let lastX = 0; let lastY = 0; let rotateModifier = .01; let cameraDefault = maxSpawnRange * AUModifer * 10 * 1.5;
let massMin = 1;
let massMax = 100;
let animationLoop = octTreeAnimate; let maxDepth = 10; let rootRange = 500; let maxBodyCount = 5;
let frameRate = 0;
let clock = new THREE.Clock();

let octTree = null;

export function init() {
  cleanUp();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
  camera.position.z = cameraDefault;

  pivot = new THREE.Group();

  //sun = new Star({mass: 100, position : [20, 0, 0], showTrail: showTrails, geometry : new THREE.SphereGeometry(2, 32, 16), pointLight : new THREE.PointLight("#f2df07", 1000, 0, 1),  material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});
  sun = new Star({ root: pivot, mass: randInt(massMin, massMax), bounceEffect: bounceEffect, trailColor: "#f2df07", showTrail: showTrails, position : [0, 0, 0], geometry : new THREE.SphereGeometry(5, 32, 16), material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});
  physBodies.push(sun);

  // earth = new PhysicsBody({ root: pivot, mass: 3.003 * 1e-6, bounceEffect: bounceEffect, trailColor: "#4287f5", showTrail: showTrails, trailLength: trailLengths, position: [1, 0, 0], geometry: new THREE.SphereGeometry(1, 32, 16), material: new THREE.MeshStandardMaterial({ color: "#4287f5" }) })
  // physBodies.push(earth);
  
  for (let i = 0; i < bodyCount; i++) {
    let color = new THREE.Color( 0xffffff );
    color.setHex( Math.random() * 0xffffff );
    physBodies.push(new PhysicsBody({ root: pivot, mass: randInt(massMin, massMax), bounceEffect: bounceEffect, trailColor: color, showTrail: showTrails, trailLength: trailLengths, position: [randInt(-maxSpawnRange, maxSpawnRange), randInt(-maxSpawnRange, maxSpawnRange), randInt(-maxSpawnRange, maxSpawnRange)], geometry: new THREE.SphereGeometry(5, 32, 16), material: new THREE.MeshStandardMaterial({ color: color }) }));
  }

  for (let b of physBodies) {
    pivot.add(b);
  }
  scene.add(pivot);


  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  switch ( animationLoop ) {
    case octTreeAnimate:
      octTree = new OctTree({visibleTree: true, physBodies: physBodies, maxBodyCount: maxBodyCount, maxDepth: maxDepth, rootRange: maxSpawnRange * AUModifer * 10, scene: pivot});
  }
  renderer.setAnimationLoop( animationLoop );
  document.body.appendChild( renderer.domElement );
  resize();
}

function animate() {
  let clockDelta = clock.getDelta();
  let timeSinceLastFrame = Math.min(clockDelta, 1/30);
  frameRate = 1 / clockDelta;

  for (let body of physBodies) { //reset acceleration
    body.acceleration[0] = 0;
    body.acceleration[1] = 0;
    body.acceleration[2] = 0;
  }

  for (let i = 0; i < physBodies.length; i++) {
    let body1 = physBodies[i]
    for (let j = i + 1; j < physBodies.length; j++) {
      let body2 = physBodies[j];
      checkCollisionAndGravity(body1, body2);
    }
  }

  for (let b of physBodies){
    b.updatePhysics(timeSinceLastFrame);
    //console.log(b.position);
  }

  renderer.render( scene, camera );
}

function octTreeAnimate() {
  let clockDelta = clock.getDelta();
  let timeSinceLastFrame = Math.min(clockDelta, 1/30);
  frameRate = 1 / clockDelta;

  //octTree.buildTree(octTree.rootNode);
  traverseOctTree(octTree.rootNode);

  for (let b of physBodies){
    b.updatePhysics(timeSinceLastFrame);
    //console.log(b.position);
  }

  renderer.render( scene, camera );
}

function traverseOctTree(currentNode){
  console.log("Current node bodies: " + currentNode.physBodies.length);
  for (let j = 0; j < currentNode.physBodies.length; j++){
    let body1 = currentNode.physBodies[j];
    for (let k = j + 1; k < currentNode.physBodies.length; k++){
      let body2 = currentNode.physBodies[k];
      checkCollisionAndGravity(body1, body2);
    }
  }

  for (let i = 0; i < currentNode.children.length; i++){
    console.log("Traversing subtrees.")
    traverseOctTree(currentNode.children[i]);
  }
}

function checkCollisionAndGravity(body1, body2) {
  console.log("Checking collision");
  let dx = body2.physPos[0] - body1.physPos[0];
  let dy = body2.physPos[1] - body1.physPos[1];
  let dz = body2.physPos[2] - body1.physPos[2];

  let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  distance = Math.max(distance, body1.radius + body2.radius);

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

  body1.checkCollision(body2);
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

export function getFramerate(){
  return frameRate.toPrecision(3);
}

export function setBodyCount(newCount){
  bodyCount = newCount;
}

export function setShowTrail(showValue){
  showTrails = showValue;
  for (let b of physBodies){
    b.setShowTrail(showValue);
  }
}

export function setSpawnRange(rangeValue) {
  maxSpawnRange = rangeValue;
}

export function setBounceEffect(bounceValue) {
  bounceEffect = bounceValue;
  for (let b of physBodies){
    b.setBounceEffect(bounceValue);
  }
}

export function swapAnimationLoop(){
  if (animationLoop == octTreeAnimate){
    animationLoop = animate;
  } else {
    animationLoop = octTreeAnimate;
  }
}