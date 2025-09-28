import * as THREE from 'three';
import PhysicsBody, { AUModifer } from './Bodies/physicsBody.js'
import Star from './Bodies/star.js'
import { randFloat, randInt } from 'three/src/math/MathUtils.js';
import OctTree from './OctTree.js';

class SimulationScene {
  constructor () {
    //variables
    this.maxSpawnRange = 5;
    this.bounceEffect = .1;
    this.gravConstant = 1;
    this.bodyCount = 5;
    this.massMin = 1;
    this.massMax = 10;
    this.physBodySize = 10;

    //scene setup
    this.cameraScroll = 1250;
    this.pivot = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.focusPoint = null;
    this.physBodies = [];
    this.animationLoop = this.octTreeAnimateRedraw;
    this.frameRate = 0;
    this.frameCount = 0;
    this.clock = new THREE.Clock();

    //octTree setup
    this.maxDepth = 3;
    this.rootRange = 1.5 * this.maxSpawnRange * AUModifer;
    this.maxBodyCount = 3;
    this.treeVisibility = false;
    this.octTree = null;
    this.updateOctTreeEveryFrames = 5;
    
    //controls
    this.scrollModifier = .5;
    this.spinCamera = false;
    this.lastX = 0;
    this.lastY = 0;
    this.rotateModifier = .01;
    this.showTrails = false;
    this.trailLengths = 250;
    this.speedModifier = 1;

    this.init();
  }

  init(){
    this.cleanUp();
    this.scene = new THREE.Scene();
    this.scene.fog = null;
    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100000 );
    this.camera.position.z = this.cameraScroll;

    this.pivot = new THREE.Group();

    //always the first body spawned
    if (this.bodyCount != 0){
      this.focusPoint = new Star({ root: this.pivot, mass: randFloat(this.massMin, this.massMax), bounceEffect: this.bounceEffect, trailColor: "#f2df07", showTrail: this.showTrails, position : [0, 0, 0], geometry : new THREE.SphereGeometry(this.physBodySize, 32, 16), material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});
      this.physBodies.push(this.focusPoint);
    }
    for (let i = 0; i < this.bodyCount - 1; i++) { //- 1 to include sun AKA starting focusPoint
      let color = new THREE.Color( 0xffffff );
      color.setHex( Math.random() * 0xffffff );
      this.physBodies.push(new PhysicsBody({ root: this.pivot, mass: randFloat(this.massMin, this.massMax), bounceEffect: this.bounceEffect, trailColor: color, showTrail: this.showTrails, trailLength: this.trailLengths, position: [randFloat(-this.maxSpawnRange, this.maxSpawnRange), randFloat(-this.maxSpawnRange, this.maxSpawnRange), randFloat(-this.maxSpawnRange, this.maxSpawnRange)], geometry: new THREE.SphereGeometry(this.physBodySize, 32, 16), material: new THREE.MeshStandardMaterial({ color: color }) }));
    }

    for (let b of this.physBodies) {
      this.pivot.add(b);
    }
    this.scene.add(this.pivot);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    switch ( this.animationLoop ) {
      case this.octTreeAnimateRedraw:
        this.octTree = new OctTree({visibleTree: this.treeVisibility, physBodies: this.physBodies, maxBodyCount: this.maxBodyCount, maxDepth: this.maxDepth, rootRange: 1.5 * this.maxSpawnRange * AUModifer, scene: this.pivot});
    }
    this.renderer.setAnimationLoop( this.animationLoop.bind(this) );
    document.body.appendChild( this.renderer.domElement );
    this.resize();
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  cleanUp() {
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      this.renderer.dispose();

      const gl = this.renderer.getContext();
      gl?.getExtension("WEBGL_lose_context")?.loseContext?.();

      this.renderer.domElement.remove();
    }

    if (this.scene) {
      this.scene.traverse(obj => {
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

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.pivot = null;
    this.focusPoint = null;
    this.physBodies = [];
  }

  resetAcceleration() {
    for (let body of this.physBodies) { //reset acceleration
      body.acceleration[0] = 0;
      body.acceleration[1] = 0;
      body.acceleration[2] = 0;
    }
  }

  animate() {
    let clockDelta = this.clock.getDelta();
    let timeSinceLastFrame = Math.min(clockDelta, 1/30);
    this.frameRate = 1 / clockDelta;

    this.resetAcceleration();

    for (let i = 0; i < this.physBodies.length; i++) {
      let body1 = this.physBodies[i]
      for (let j = i + 1; j < this.physBodies.length; j++) {
        let body2 = this.physBodies[j];
        this.checkCollisionAndGravity(body1, body2);
      }
    }

    for (let b of this.physBodies){
      b.updatePhysics(timeSinceLastFrame * this.speedModifier);
    }

    if (this.focusPoint) {
      this.camera.position.copy(this.focusPoint.position).add(new THREE.Vector3(0, 0, this.cameraScroll));
    }
    this.renderer.render( this.scene, this.camera );
  }

  octTreeAnimateRedraw() { //redraws tree every x frames
    let clockDelta = this.clock.getDelta();
    let timeSinceLastFrame = Math.min(clockDelta, 1/30);
    this.frameRate = 1 / clockDelta;
    this.frameCount += 1;

    this.resetAcceleration();
    if (this.updateOctTreeEveryFrames == this.frameCount){
      this.frameCount = 0;
      this.focusPoint ? this.octTree.buildTree(this.octTree.rootNode, [this.focusPoint.position.x, this.focusPoint.position.y, this.focusPoint.position.z]) : this.octTree.buildTree(this.octTree.rootNode, [0, 0, 0]);
    }
    this.traverseOctTree(this.octTree.rootNode);

    for (let b of this.physBodies){
      b.updatePhysics(timeSinceLastFrame * this.speedModifier);
    }

    if (this.focusPoint) {
      this.camera.position.copy(this.focusPoint.position).add(new THREE.Vector3(0, 0, this.cameraScroll));
    }
    this.renderer.render( this.scene, this.camera );
  }

  octTreeAnimateStatic(){ //static tree and updated bodies in nodes
    let clockDelta = this.clock.getDelta();
    let timeSinceLastFrame = Math.min(clockDelta, 1/30);
    this.frameRate = 1 / clockDelta;
    this.frameCount += 1;
    this.resetAcceleration();

    //new logic here

    this.camera.position.copy(this.focusPoint.position).add(new THREE.Vector3(0, 0, this.cameraScroll));
    this.renderer.render( this.scene, this.camera );
  }

  traverseOctTree(currentNode, nodeRemainingBodies = [], allNodesThisLevel = []){ //review for duplicates
    //compare current nodes bodies to its own bodies
    for (let j = 0; j < currentNode.physBodies.length; j++){
      let body1 = currentNode.physBodies[j];
      for (let k = j + 1; k < currentNode.physBodies.length; k++){
        let body2 = currentNode.physBodies[k];
        this.checkCollisionAndGravity(body1, body2);
      }
    }

    if (nodeRemainingBodies.length > 0){ //compare parents remaining with children
      for (let j = 0; j < nodeRemainingBodies.length; j++){
        let body1 = nodeRemainingBodies[j];
        for (let k = 0; k < currentNode.physBodies.length; k++){
          let body2 = currentNode.physBodies[k];
          this.checkCollisionAndGravity(body1, body2);
        }
      }
    }

    //traverse any children
    let newNodeRemainingBodies = nodeRemainingBodies.length ? nodeRemainingBodies.concat(currentNode.physBodies) : currentNode.physBodies.slice();
    for (let i = 0; i < currentNode.children.length; i++){
      this.traverseOctTree(currentNode.children[i], newNodeRemainingBodies, currentNode.children);
    }

    //compare to current nodes bodies neighboring nodes bodies
    if (allNodesThisLevel.length > 0){
      let currentNodeIndex = allNodesThisLevel.indexOf(currentNode);

      if (currentNodeIndex != -1){
        for (let i = currentNodeIndex + 1; i < allNodesThisLevel.length; i++){
          for (let j = 0; j < allNodesThisLevel[i].physBodies.length; j++){
            let body1 = allNodesThisLevel[i].physBodies[j];
            for (let k = 0; k < currentNode.physBodies.length; k++){
              let body2 = currentNode.physBodies[k];
              this.checkCollisionAndGravity(body1, body2);
            }
          }
        }
      }
    }
  }

  checkCollisionAndGravity(body1, body2) {
    let dx = body2.physPos[0] - body1.physPos[0];
    let dy = body2.physPos[1] - body1.physPos[1];
    let dz = body2.physPos[2] - body1.physPos[2];

    let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    distance = Math.max(distance, body1.radius + body2.radius);

    let body1AccelerationX = this.gravConstant * (dx / (distance ** 3)) * body2.mass;
    let body1AccelerationY = this.gravConstant * (dy / (distance ** 3)) * body2.mass;
    let body1AccelerationZ = this.gravConstant * (dz / (distance ** 3)) * body2.mass;

    body1.acceleration[0] += body1AccelerationX;
    body1.acceleration[1] += body1AccelerationY;
    body1.acceleration[2] += body1AccelerationZ;

    let body2AccelerationX = -this.gravConstant * (dx / (distance ** 3)) * body1.mass;
    let body2AccelerationY = -this.gravConstant * (dy / (distance ** 3)) * body1.mass;
    let body2AccelerationZ = -this.gravConstant * (dz / (distance ** 3)) * body1.mass;
    body2.acceleration[0] += body2AccelerationX;
    body2.acceleration[1] += body2AccelerationY;
    body2.acceleration[2] += body2AccelerationZ;

    body1.checkCollision(body2);
  }

  getFramerate(){
    return this.frameRate.toPrecision(3);
  }

  setBodyCount(newCount){
    this.bodyCount = newCount;
  }

  toggleDrawOctTree(){
    this.octTree.visibleTree = !this.octTree.visibleTree;
    this.treeVisibility = this.octTree.visibleTree;
    return this.octTree.visibleTree;
  }

  setTrailLength(newLength){
    for (let b of this.physBodies){
      b.trailLength = newLength;
    }
  }

  setSpeedModifier(newValue){
    this.speedModifier = newValue;
  }

  setMaxDepth(newValue){
    this.maxDepth = newValue;
    this.octTree.maxDepth = this.maxDepth;
  }

  setSpawnRange(rangeValue) {
    this.maxSpawnRange = rangeValue;
  }

  setShowTrail(showValue){
    this.showTrails = showValue;
    for (let b of this.physBodies){
      b.setShowTrail(showValue);
    }
  }

  setBounceEffect(bounceValue) {
    this.bounceEffect = bounceValue;
    for (let b of this.physBodies){
      b.setBounceEffect(bounceValue);
    }
  }

  swapAnimationLoop(selected){
    switch (selected) {
      case "octTreeRedraw":
        this.animationLoop = this.octTreeAnimateRedraw;
        break;
      case "bruteForce":
        this.animationLoop = this.animate;
        break;
      case "octTreeStatic":
        this.animationLoop = this.octTreeAnimateRedraw; //for now
        break;
    }
  }
}

export const gravSimScene = new SimulationScene();

window.addEventListener('wheel', (e) => {
  let scrollY = e.deltaY * gravSimScene.scrollModifier;
  gravSimScene.cameraScroll += scrollY;
  gravSimScene.camera.position.z = gravSimScene.cameraScroll;
});
window.addEventListener('mousedown', (e) => { 
  gravSimScene.spinCamera = true; 
  gravSimScene.lastX = e.clientX; 
  gravSimScene.lastY = e.clientY;
});
window.addEventListener('mouseup', (e) => { 
  gravSimScene.spinCamera = false;
});
window.addEventListener('mousemove', (e) => {
  if (gravSimScene.spinCamera) {
    let deltaX = gravSimScene.lastX - e.clientX;
    let deltaY = gravSimScene.lastY - e.clientY;

    gravSimScene.lastX = e.clientX;
    gravSimScene.lastY = e.clientY;

    gravSimScene.pivot.rotation.y += (deltaX * gravSimScene.rotateModifier);
    gravSimScene.pivot.rotation.z += (deltaY * gravSimScene.rotateModifier);

    // gravSimScene.camera.lookAt(gravSimScene.focusPoint);
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r'){
    gravSimScene.pivot.rotation.set(0, 0, 0);
  }
});
window.addEventListener('resize', () => {
  gravSimScene.resize();
});