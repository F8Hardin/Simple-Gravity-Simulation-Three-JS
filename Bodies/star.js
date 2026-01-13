import * as THREE from 'three';
import PhysicsBody from './physicsBody.js'

export default class Star extends PhysicsBody {
    constructor({pointLight = null, ambientLight = null, ...args}){
        super(args);

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