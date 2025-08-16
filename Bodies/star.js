import * as THREE from 'three';
import PhysicsBody from './physicsBody.js'

export default class Star extends PhysicsBody {
    constructor({mass = 1, position = [0, 0, 0], material = new THREE.MeshStandardMaterial({ color: 0xffffff }), geometry = new THREE.SphereGeometry(1, 32, 16), pointLight = new THREE.PointLight("#ffffff", 100, 0), ambientLight = null}){
        super({mass, position , material , geometry});

        this.pointLight = pointLight;
        this.add(this.pointLight);
        this.pointLight.position.set(0, 0, 0);
        
        if (ambientLight) {
            this.ambientLight = ambientLight;
            this.add(this.ambientLight);
        }
    }
}