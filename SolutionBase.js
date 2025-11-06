import * as THREE from 'three';
import { AUModifer } from './Bodies/physicsBody';

export class SolutionBase {
    constructor({physBodies = [], frameRate = 0, frameCount = 0, scene, camera, renderer, speedModifier = 1, focusPoint, gravConstant = 1, cameraScroll = 1250}){
        this.physBodies = physBodies;
        this.clock = new THREE.Clock();
        this.frameRate = frameRate;
        this.speedModifier = speedModifier;
        this.focusPoint = focusPoint;
        this.gravConstant = gravConstant;

        this.scene = scene;
        this.camera = camera;
        this.cameraScroll = cameraScroll;
        this.renderer = renderer;
    }

    animate() {
        console.log("Animate to be implemented in child classes.");
    }

    resetAcceleration() {
        for (let body of this.physBodies) { //reset acceleration
            body.acceleration[0] = 0;
            body.acceleration[1] = 0;
            body.acceleration[2] = 0;
        }
    }

    checkCollisionAndGravity(body1, body2) {
        let dx = body2.physPos[0] - body1.physPos[0];
        let dy = body2.physPos[1] - body1.physPos[1];
        let dz = body2.physPos[2] - body1.physPos[2];

        let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        distance = Math.max(distance, (body1.radius + body2.radius) / AUModifer);

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

    setSpeedModifier(newValue){
        this.speedModifier = newValue;
    }

    updateCameraScroll(newValue){
        this.cameraScroll = newValue;
    }

    getAnimationState(){
        console.log("Get Animation state to be implemented in child classes. Otherwise value is null.");
        return null;
    }
}