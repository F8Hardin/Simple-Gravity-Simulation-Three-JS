import * as THREE from 'three';
//using metric system

export default class PhysicsBody extends THREE.Mesh {
    constructor ({mass = 1, showTrail = false, trailLength = 10, position = [0, 0, 0], initialVelocity = [0, 0, 0], material = new THREE.MeshStandardMaterial({ color: 0xffffff }), geometry = new THREE.SphereGeometry(1, 32, 16)}) {
        super(geometry, material)
        this.mass = mass;
        this.radius = geometry.parameters.radius;
        this.density = mass / ((4/3*Math.PI*((this.radius/2)**3)));
        this.position.set(...position);
        this.velocity = initialVelocity;
        this.acceleration = [0, 0, 0];
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

            //update velocity - simplely reversing it
            this.velocity[0] *= -1;
            this.velocity[1] *= -1;
            this.velocity[2] *= -1;
            otherBody.velocity[0] *= -1;
            otherBody.velocity[1] *= -1;
            otherBody.velocity[2] *= -1;
        }
    }

    updatePhysics(timeSinceLastFrame){ //called in animate of main to update this physics body, updates position from velocity and updates other physics properties
        this.velocity[0] += this.acceleration[0] * timeSinceLastFrame;
        this.velocity[1] += this.acceleration[1] * timeSinceLastFrame;
        this.velocity[2] += this.acceleration[2] * timeSinceLastFrame;
        this.position.x += this.velocity[0] * timeSinceLastFrame;
        this.position.y += this.velocity[1] * timeSinceLastFrame;
        this.position.z += this.velocity[2] * timeSinceLastFrame;

        // if (this.showTrail){
        //     //add a trail with length trail length
        // }
    }
}