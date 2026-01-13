import { SolutionBase } from "./SolutionBase";
import * as THREE from 'three';

export default class NaiveSolution extends SolutionBase{
    constructor(args){
        super(args);
    }

    animate() {
        this.lastClockDelta = this.clock.getDelta();
        let timeSinceLastFrame = Math.min(this.lastClockDelta, 1/30);
        this.frameRate = 1 / this.lastClockDelta;

        if (this.variableTimeStep){
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
        } else {
            this.accumulator += this.lastClockDelta;

            if (this.accumulator >= this.constantTimeStep){
                this.resetAcceleration();

                for (let i = 0; i < this.physBodies.length; i++) {
                    let body1 = this.physBodies[i]
                    for (let j = i + 1; j < this.physBodies.length; j++) {
                        let body2 = this.physBodies[j];
                        this.checkCollisionAndGravity(body1, body2);
                    }
                }

                for (let b of this.physBodies){
                    b.updatePhysics(this.constantTimeStep * this.speedModifier);
                }

                this.accumulator -= this.constantTimeStep;
            }
        }

        this.cameraTrackFocus();
        this.renderer.render( this.scene, this.camera );
    }
}