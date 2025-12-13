import * as THREE from 'three';
import { AUModifer, METERS_PER_UNIT } from './Bodies/physicsBody';

export class SolutionBase {
    constructor({variableTimeStep = true, constantTimeStep = 1, maxBodies = 1000, physBodies = [], frameRate = 0, frameCount = 0, scene, camera, renderer, speedModifier = 1, focusPoint, gravConstant = 1}){
        this.physBodies = physBodies;
        this.clock = new THREE.Clock();
        this.physicsClock = new THREE.Clock();
        this.physicsClockDelta = 1;
        this.frameRate = frameRate;
        this.speedModifier = speedModifier;
        this.focusPoint = focusPoint;
        this.gravConstant = gravConstant;
        this.variableTimeStep = variableTimeStep;
        this.constantTimeStep = constantTimeStep;

        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.maxBodies = maxBodies;

        this.lastClockDelta = 1;
        this.accumulator = 0;
        this.cameraDisplacement = null;
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
        this.checkGravity(body1, body2);
        body1.checkCollision(body2);
    }

    checkGravity(body1, body2){
        let dx = body2.position.x - body1.position.x;
        let dy = body2.position.y - body1.position.y;
        let dz = body2.position.z - body1.position.z;

        let distance = Math.sqrt(dx * dx + dy * dy + dz * dz) * METERS_PER_UNIT;

        let body1AccelerationX = this.gravConstant * (dx / (distance ** 3)) * body2.mass;
        let body1AccelerationY = this.gravConstant * (dy / (distance ** 3)) * body2.mass;
        let body1AccelerationZ = this.gravConstant * (dz / (distance ** 3)) * body2.mass;

        body1.acceleration[0] += (body1AccelerationX / METERS_PER_UNIT);
        body1.acceleration[1] += (body1AccelerationY / METERS_PER_UNIT);
        body1.acceleration[2] += (body1AccelerationZ / METERS_PER_UNIT);

        let body2AccelerationX = -this.gravConstant * (dx / (distance ** 3)) * body1.mass;
        let body2AccelerationY = -this.gravConstant * (dy / (distance ** 3)) * body1.mass;
        let body2AccelerationZ = -this.gravConstant * (dz / (distance ** 3)) * body1.mass;
        body2.acceleration[0] += (body2AccelerationX / METERS_PER_UNIT);
        body2.acceleration[1] += (body2AccelerationY / METERS_PER_UNIT);
        body2.acceleration[2] += (body2AccelerationZ / METERS_PER_UNIT);
    }

    setSpeedModifier(newValue){
        this.speedModifier = newValue;
    }

    getAnimationState(){
        console.log("Get Animation state to be implemented in child classes. Otherwise value is null.");
        return null;
    }

    cameraTrackFocus(){
        if (this.focusPoint){
            let focusPosition = new THREE.Vector3();
            this.focusPoint.getWorldPosition(focusPosition);

            //store desired displacement from focus, apply that here as well
            if (this.cameraDisplacement){
                this.camera.position.copy(focusPosition).add(this.cameraDisplacement);
            }
            this.camera.lookAt(focusPosition);
            this.cameraDisplacement = this.camera.position.clone().sub(focusPosition);
        }
    }

    updatePhyicsClockDelta(){ //calls getDelta on physics clock and returns it
        this.physicsClockDelta = this.physicsClock.getDelta();
        return this.physicsClockDelta;
    }
}