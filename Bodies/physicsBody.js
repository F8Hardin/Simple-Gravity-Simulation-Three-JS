import * as THREE from 'three';
//using metric system

export default class PhysicsBody extends THREE.Mesh {
    constructor ({mass = 1, position = [0, 0, 0], initialVelocity = [0, 0, 0], material = new THREE.MeshStandardMaterial({ color: 0xffffff }), geometry = new THREE.SphereGeometry(1, 32, 16)}) {
        super(geometry, material)
        this.mass = mass;
        this.radius = geometry.parameters.radius;
        this.density = mass / ((4/3*Math.PI*((this.radius/2)**3)));
        this.position.set(...position);
        this.velocity = initialVelocity;
        this.acceleration = [0, 0, 0];
    }

    animate(timeSinceLastFrame){ //called in animate of main to update this physics body
        this.position.x += (this.velocity[0] * timeSinceLastFrame);
        this.position.y += (this.velocity[1] * timeSinceLastFrame);
        this.position.z += (this.velocity[2] * timeSinceLastFrame);
        this.velocity[0] += this.acceleration[0];
        this.velocity[1] += this.acceleration[1];
        this.velocity[2] += this.acceleration[2];
    }
}