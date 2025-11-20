import * as THREE from 'three';
import PhysicsBody, { AUModifer } from './Bodies/physicsBody.js'
import Star from './Bodies/star.js'
import { randFloat } from 'three/src/math/MathUtils.js';
import OctTree from './OctTree.js';
import NaiveSolution from './naive.js';

class SimulationScene {
  constructor () {
    //variables
    this.maxSpawnRange = 5;
    this.bounceEffect = .2;
    this.gravConstant = .01;
    this.bodyCount = 200;
    this.massMin = 1;
    this.massMax = 100;
    this.physBodySize = 10;

    //scene setup
    this.cameraStart = 1250;
    this.pivot = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.focusPoint = null;
    this.physBodies = [];
    //this.animationLoop = null;
    //this.animationName = "bruteForce"; //need to organize names with frontend names somehow. perhaps using the json files that define the scene
    this.animationName = "octTree"
    this.frameRate = 0;
    this.frameCount = 0;

    //octTree setup
    this.maxDepth = 3;
    this.rootRange = 1.5 * this.maxSpawnRange * AUModifer;
    this.maxBodyCount = 8;
    this.treeVisibility = false;
    this.updateOctTreeEveryFrames = 1;
    this.forceMaxChildren = false;
    
    //controls
    this.scrollModifier = 50;
    this.strafeModifier = 100;
    this.mouseDown = false;
    this.cameraDirection = new THREE.Vector3(1, 0, 0);
    this.rotationSpeed = .01;
    this.lastX = 0;
    this.lastY = 0;
    this.showTrails = false;
    this.trailLengths = 250;
    this.speedModifier = 1;
    this.sandBoxMode = false;
    this.defaultScene = "Default Scene" //ensure scenes are all in a json and grabbed from there
    this.desiredScene = this.defaultScene;

    this.init();
  }

  init(){
    this.cleanUp();
    this.scene = new THREE.Scene();
    this.scene.fog = null;
    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100000 );
    this.camera.position.z = this.cameraStart;

    this.pivot = new THREE.Group();
    this.sceneInit();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );

    switch ( this.animationName ) {
      case "octTree":
        console.log("Building Oct Tree Solution");
        this.solution = new OctTree({maxBodies: 3000, updateOctTreeEveryFrames: this.updateOctTreeEveryFrames, focusPoint: this.focusPoint, forceMaxChildren: this.forceMaxChildren, renderer: this.renderer, camera: this.camera, gravConstant: this.gravConstant, frameRate : this.frameRate, frameCount : this.frameCount, speedModifier: this.speedModifier, cameraStart: this.cameraStart, focusPoint: this.focusPoint, visibleTree: this.treeVisibility, physBodies: this.physBodies, maxBodyCount: this.maxBodyCount, maxDepth: this.maxDepth, rootRange: 2 * this.maxSpawnRange * AUModifer, scene: this.pivot});
        break;
      default:
        console.log("Building Naive Solution...")
        this.solution = new NaiveSolution({speedModifier: this.speedModifier, cameraStart: this.cameraStart, focusPoint: this.focusPoint, physBodies : this.physBodies, frameRate : this.frameRate, frameCount : this.frameCount, scene: this.scene, camera: this.camera, renderer: this.renderer, gravConstant: this.gravConstant});
        break;
    }

    this.renderer.setAnimationLoop( this.solution.animate.bind(this.solution) );
    document.body.appendChild( this.renderer.domElement );
    this.resize();
  }

  toggleSandBoxMode(){
    this.sandBoxMode = !this.sandBoxMode;
    //when enabled, starts tracking mouse and scroll wheel to drop in families of bodies
  }

  sceneInit(){ //initializes the desired scene
    if (this.desiredScene == "Default Scene"){
      //get default scene json
      console.log("Preparing default scene");
      //always the first body spawned
      if (this.bodyCount != 0){
        this.focusPoint = new Star({ root: this.pivot, mass: 5000, bounceEffect: this.bounceEffect, trailColor: "#f2df07", showTrail: this.showTrails, position : [0, 0, 0], geometry : new THREE.SphereGeometry(30, 32, 16), material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});
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
    }
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

  getFramerate(){
    return this.solution.frameRate.toPrecision(3);
  }

  setBodyCount(newCount){
    this.bodyCount = newCount;
  }

  toggleDrawOctTree(){ //bug Here: if check box clicked while oct tree isn't the current solution checkbox is out of sync
    this.solution.visibleTree = !this.solution.visibleTree;
    this.treeVisibility = this.solution.visibleTree;
    return this.solution.visibleTree;
  }

  setTrailLength(newLength){
    for (let b of this.physBodies){
      b.trailLength = newLength;
    }
  }

  setSpeedModifier(newValue){
    this.speedModifier = newValue;
    this.solution.setSpeedModifier(newValue);
  }

  setMaxDepth(newValue){
    this.maxDepth = newValue;
    //this.octTree.maxDepth = this.maxDepth;
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
    this.bounceEffect = Number(bounceValue);
    for (let b of this.solution.physBodies){
      b.setBounceEffect(this.bounceEffect);
    }
  }

  swapAnimationLoop(selected){
    console.log(selected);
    switch (selected) {
      case "octTree":
        this.animationName = "octTree";
        break;
      case "bruteForce":
        this.animationName = "bruteForce";
        break;
    }

    this.init();
  }

  updateCameraScroll(scrollValue, modifier){
    let direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.normalize();
    this.solution.cameraDisplacement = this.solution.cameraDisplacement.add(direction.multiplyScalar(modifier * -scrollValue));
    //this.camera.position.add(direction.multiplyScalar(modifier * -scrollValue));
  }

  updateGravConstant(newValue){
    this.gravConstant = newValue;
    this.solution.gravConstant = newValue;
  }

  updateCameraStrafe(value){
    if (!this.focusPoint){
      let direction = new THREE.Vector3();
      let up = new THREE.Vector3(0, 1, 0);
      this.camera.getWorldDirection(direction);
      let right = new THREE.Vector3();
      right.crossVectors(direction, up);
      this.camera.position.add(right.multiplyScalar(this.strafeModifier * value));
    }
  }
}

export const gravSimScene = new SimulationScene();

window.addEventListener('wheel', (e) => {
  let scrollY = Math.sign(e.deltaY);
  gravSimScene.updateCameraScroll(scrollY, gravSimScene.scrollModifier);
});
window.addEventListener('mousedown', (e) => { 
  gravSimScene.mouseDown = true; 
  gravSimScene.lastX = e.clientX; 
  gravSimScene.lastY = e.clientY;
});
window.addEventListener('mouseup', (e) => { 
  gravSimScene.mouseDown = false;
});
window.addEventListener('mousemove', (e) => {
  if (gravSimScene.mouseDown) {
    let deltaX = gravSimScene.lastX - e.clientX;
    let deltaY = gravSimScene.lastY - e.clientY;

    gravSimScene.lastX = e.clientX;
    gravSimScene.lastY = e.clientY;

    let focus = new THREE.Vector3();
    let up = new THREE.Vector3(0, 1, 0);

    if (gravSimScene.focusPoint){
      gravSimScene.focusPoint.getWorldPosition(focus);

      //direction vector
      let direction = gravSimScene.camera.position.clone().sub(focus);

      let yaw = new THREE.Quaternion().setFromAxisAngle(up, deltaX * gravSimScene.rotationSpeed);
      direction.applyQuaternion(yaw);

      let right = new THREE.Vector3().crossVectors(direction, up).normalize(); //flicker occurs when direction is very close to up so cross product is close to (0, 0, 0)
      let pitch = new THREE.Quaternion().setFromAxisAngle(right, -deltaY * gravSimScene.rotationSpeed);
      direction.applyQuaternion(pitch);

      gravSimScene.solution.cameraDisplacement = direction;
      // gravSimScene.camera.position.copy(focus).add(direction);
      // gravSimScene.camera.lookAt(focus);
    }
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r'){
    gravSimScene.pivot.rotation.set(0, 0, 0);
  } else if (e.key.toLowerCase() === 'w') {
    gravSimScene.updateCameraScroll(gravSimScene.strafeModifier, -1);
  } else if (e.key.toLowerCase() === 'a') {
    gravSimScene.updateCameraStrafe(-1)
  } else if (e.key.toLowerCase() === 's') {
    gravSimScene.updateCameraScroll(gravSimScene.strafeModifier, 1)
  } else if (e.key.toLowerCase() === 'd') {
    gravSimScene.updateCameraStrafe(1)
  }
});
window.addEventListener('resize', () => {
  gravSimScene.resize();
});