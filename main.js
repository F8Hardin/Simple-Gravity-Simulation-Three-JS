import * as THREE from 'three';
import PhysicsBody from './Bodies/physicsBody'
import Star from './Bodies/star'

let scene, camera, renderer, sun, planet;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  camera.position.z = 25;

  sun = new Star({position : [0, 0, 0],  geometry : new THREE.SphereGeometry(10, 32, 16), pointLight : new THREE.PointLight("#f2df07", 1000, 0),  material : new THREE.MeshStandardMaterial({color : "#f2df07"}), ambientLight : new THREE.AmbientLight(0xffffff, 1)});

  planet = new PhysicsBody({position : [25, 0, 0],  geometry : new THREE.SphereGeometry(10, 32, 16), pointLight : new THREE.PointLight("#f2df07", 1000, 0),  material : new THREE.MeshStandardMaterial({color : "#f2df07"})});
  sun.group.add(planet);
  scene.add(sun.group);

  resize();
}

function animate() {

  //sun.setPosition([sun.mesh.position.x + .01, sun.mesh.position.y, sun.mesh.position.z]);
  // sun.rotation.x.set(sun.rotation.x + .01);
  // sun.rotation.y.set(sun.rotation.y + .001);

  renderer.render( scene, camera );
}

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

window.addEventListener( 'resize', resize );
init()