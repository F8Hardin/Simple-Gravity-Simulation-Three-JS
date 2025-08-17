import * as THREE from 'three';
import PhysicsBody from './physicsBody.js'

export default class Star extends PhysicsBody {
    constructor({mass = 1, position = [0, 0, 0], material = new THREE.MeshStandardMaterial({ color: 0xffffff }), geometry = new THREE.SphereGeometry(1, 32, 16), pointLight = null, ambientLight = null}){
        super({mass, position , material , geometry});

        if (pointLight){
            this.pointLight = pointLight;
            this.add(this.pointLight);
            this.pointLight.position.set(0, 0, 0);
        }
        
        if (ambientLight) {
            this.ambientLight = ambientLight;
            this.add(this.ambientLight);
        }
    }
}