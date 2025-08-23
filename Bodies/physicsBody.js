import * as THREE from 'three';
//using metric system

let bounceEffect = .5;

export default class PhysicsBody extends THREE.Mesh {
    constructor ({root, mass = 1, trailColor = "white", showTrail = false, trailLength = 100, position = [0, 0, 0], initialVelocity = [0, 0, 0], material = new THREE.MeshStandardMaterial({ color: 0xffffff }), geometry = new THREE.SphereGeometry(1, 32, 16)}) {
        super(geometry, material)
        this.mass = mass;
        this.radius = geometry.parameters.radius;
        this.density = mass / ((4/3*Math.PI*((this.radius/2)**3)));
        this.position.set(...position);
        this.velocity = initialVelocity;
        this.acceleration = [0, 0, 0];
        this.positions = [];
        this.showTrail = showTrail;
        this.root = root;
        this.trailLength = trailLength;
        this.trailColor = trailColor;

        if (showTrail){
            this.lineCurve = new THREE.LineCurve(this.position, this.position);
        }
    }

    checkCollision(otherBody){
        let sumRadius = otherBody.radius + this.radius;
        let distance = Math.sqrt(((otherBody.position.x - this.position.x)**2) + ((otherBody.position.y - this.position.y)**2) + ((otherBody.position.z - this.position.z)**2));
        if (sumRadius > distance){ //on overlap
            //move so they aren't overlapping
            let overlap = sumRadius - distance;
            let direction = new THREE.Vector3().subVectors(otherBody.position, this.position).normalize();

            //update position
            this.position.addScaledVector(direction, -.5 * overlap);
            otherBody.position.addScaledVector(direction, .5 * overlap);

            //momentum - inelastic with impulse correction
            let thisVel = new THREE.Vector3(...this.velocity);
            let otherVel = new THREE.Vector3(...otherBody.velocity);
            let thisNewVel = thisVel.clone().multiplyScalar(this.mass).add(otherVel.clone().multiplyScalar(otherBody.mass)).divideScalar(this.mass + otherBody.mass);
            let otherNewVel = otherVel.clone().multiplyScalar(otherBody.mass).add(thisVel.clone().multiplyScalar(this.mass)).divideScalar(this.mass + otherBody.mass);
            let rel = thisVel.clone().sub(otherVel).dot(direction);
            if (rel > 0){
                let invSum = 1 / (this.mass + otherBody.mass);
                thisNewVel.addScaledVector(direction, -(1 + bounceEffect) * (otherBody.mass * invSum) * rel);
                otherNewVel.addScaledVector(direction,  +(1 + bounceEffect) * (this.mass * invSum) * rel);
            }

            this.velocity[0] = thisNewVel.x; this.velocity[1] = thisNewVel.y; this.velocity[2] = thisNewVel.z;
            otherBody.velocity[0] = otherNewVel.x; otherBody.velocity[1] = otherNewVel.y; otherBody.velocity[2] = otherNewVel.z;
        }
    }

    updatePhysics(timeSinceLastFrame){ //called in animate of main to update this physics body, updates position from velocity and updates other physics properties
        this.velocity[0] += this.acceleration[0] * timeSinceLastFrame;
        this.velocity[1] += this.acceleration[1] * timeSinceLastFrame;
        this.velocity[2] += this.acceleration[2] * timeSinceLastFrame;
        this.position.x += this.velocity[0] * timeSinceLastFrame;
        this.position.y += this.velocity[1] * timeSinceLastFrame;
        this.position.z += this.velocity[2] * timeSinceLastFrame;

        if (this.showTrail && this.root){
            let wp = new THREE.Vector3();
            this.getWorldPosition(wp);    
            this.positions.push(this.root.worldToLocal(wp.clone()));
            if (this.positions.length > this.trailLength) {
                this.positions.shift();
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(this.positions);
            if (!this.trailLine) {
                const material = new THREE.LineBasicMaterial({ color: this.trailColor });
                this.trailLine = new THREE.Line(geometry, material);
                this.root.add(this.trailLine);
            } else {
                this.trailLine.geometry.dispose();
                this.trailLine.geometry = geometry;
            }
        }
    }

    setShowTrail(showValue){
        this.showTrail = showValue;

        if (!showValue){
            this.positions = [];
            this.trailLine.geometry.dispose();
            this.trailLine.material.dispose();
            this.root.remove(this.trailLine);
            this.trailLine = null;
        }
    }
}


//Add ability to swap between inelastic collision and elastic
//Add ability to swap animate functions, demonstrating different algorithm efficiencies