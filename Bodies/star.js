import * as THREE from 'three';
import PhysicsBody from './Bodies/physicsBody'

class Star extends THREE.Object3D {
    constructor({physicsBody = new PhysicsBody(), //add point light parameters + ambient light}) {
        super();
        this.mesh = physicsBody.mesh;
    }
}