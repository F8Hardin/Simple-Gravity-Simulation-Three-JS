import * as THREE from 'three';
import PhysicsBody from './Bodies/physicsBody'

let scene, camera, renderer, sun, planet;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  let lightX = 50;
  let lightY = 10;
  let lightZ = 0;
  const lightMeshGeometry = new THREE.BoxGeometry( 1, 1, 1);
  const lightMeshMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  const lightMesh = new THREE.Mesh(lightMeshGeometry, lightMeshMaterial)
  const light = new THREE.PointLight( "#6e225f", 100000, 100 );
  light.position.set(lightX, lightY, lightZ);
  lightMesh.position.set(lightX, lightY, lightZ);
  scene.add(light);
  scene.add(lightMesh);

  const ambientLight = new THREE.AmbientLight(0xffffff, .01);
  scene.add(ambientLight);

  camera.position.z = 100;

  sun = new PhysicsBody({position : [0, 0, 0], size : [10, 32, 16]});
  scene.add(sun.mesh);

  planet = new PhysicsBody({position : [50, 50, 0], size : [3, 32, 16], material : new THREE.MeshBasicMaterial( { color: 0x00ff00 } )});
  scene.add(planet.mesh);
}

function animate() {

  //sun.setPosition([sun.mesh.position.x + .01, sun.mesh.position.y, sun.mesh.position.z]);
  sun.setXRotation(sun.mesh.rotation.x + .01);
  sun.setYRotation(sun.mesh.rotation.y + .001);

  renderer.render( scene, camera );
}

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

window.addEventListener( 'resize', resize );
init()