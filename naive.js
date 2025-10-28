import { SolutionBase } from "./SolutionBase";
import * as THREE from 'three';

export default class NaiveSolution extends SolutionBase{
    constructor(args){
        super(args);
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
}