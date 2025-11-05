import * as THREE from 'three';

export const AUModifer = 100;

export default class PhysicsBody extends THREE.Mesh {
    constructor ({root, bounceEffect = 0, mass = 1, trailColor = "white", showTrail = false, trailLength = 100, position = [0, 0, 0], initialVelocity = [0, 0, 0], material = new THREE.MeshStandardMaterial({ color: 0xffffff }), geometry = new THREE.SphereGeometry(1, 32, 16)}) {
        super(geometry, material)
        this.mass = mass;
        this.radius = geometry.parameters.radius;
        this.density = mass / ((4/3*Math.PI*((this.radius/2)**3)));
        this.position.x = position[0] * AUModifer;
        this.position.y = position[1] * AUModifer;
        this.position.z = position[2] * AUModifer;
        this.velocity = initialVelocity;
        this.acceleration = [0, 0, 0];
        this.positions = [];
        this.showTrail = showTrail;
        this.root = root;
        this.trailLength = trailLength;
        this.trailColor = trailColor;
        this.bounceEffect = bounceEffect;
        this.physPos = [position[0], position[1], position[2]];

        if (showTrail){
            this.lineCurve = new THREE.LineCurve(this.position, this.position);
        }
    }

    checkCollision(otherBody){
        let sumRadius = otherBody.radius + this.radius;
        let distance = Math.sqrt(((otherBody.position.x - this.position.x)**2) + ((otherBody.position.y - this.position.y)**2) + ((otherBody.position.z - this.position.z)**2));
        if (sumRadius > distance){ //on overlap
            //move so they aren't overlapping
            let overlap = (sumRadius - distance);
            let direction = new THREE.Vector3().subVectors(otherBody.position, this.position).normalize();

            //update position - Needs to be based on masses of objects
            this.position.addScaledVector(direction, -.5 * overlap);
            otherBody.position.addScaledVector(direction, .5 * overlap);
            this.physPos[0] = this.position.x / AUModifer;
            this.physPos[1] = this.position.y / AUModifer;
            this.physPos[2] = this.position.z / AUModifer;

            //momentum
            let thisVel = new THREE.Vector3(...this.velocity);
            let otherVel = new THREE.Vector3(...otherBody.velocity);
            let rel = thisVel.clone().sub(otherVel).dot(direction);

            // //Totally inelastic on all axis, hacked bounce via impulse
            // let thisNewVel = thisVel.clone().multiplyScalar(this.mass).add(otherVel.clone().multiplyScalar(otherBody.mass)).divideScalar(this.mass + otherBody.mass);
            // let otherNewVel = thisNewVel.clone();

            // //impulse to simulate bounce
            // //if not approaching along the normal, leave velocities as-is
            // if (rel > 0){
            //     let invThisMass = 1 / this.mass;
            //     let invOtherMass = 1 / otherBody.mass;
            //     let invSum = invOtherMass + invThisMass;
            //     let impulse =   -this.bounceEffect * rel / invSum;
            //     thisNewVel.addScaledVector(direction, impulse * invThisMass);
            //     otherNewVel.addScaledVector(direction,  -impulse * invOtherMass);
            // }

            // Inelastic along collision normal using real impulse
            //project relative velocity onto the collision normal - gets velocity in direction of collision
            // if not approaching along the normal, leave velocities as-is
            if (rel <= 0){
                // keep current velocities
                var thisNewVel  = thisVel;
                var otherNewVel = otherVel;
            } else {
                // coefficient of restitution (0 = inelastic / no bounce, 1 = elastic) is bouncEffect

                // impulse magnitude (point-mass, no rotation)
                // j = -(1+e) * rel / (1/m1 + 1/m2)
                let invMassSum = (1 / this.mass) + (1 / otherBody.mass);
                if (invMassSum <= 0){
                    console.log("TINY INV MASS SUM");
                    return;
                }
                let j = - (1 + this.bounceEffect) * rel / invMassSum;

                // apply change in velocity based on impulse
                var thisNewVel  = thisVel.clone().add(direction.clone().multiplyScalar(j / this.mass));
                var otherNewVel = otherVel.clone().add(direction.clone().multiplyScalar(-j / otherBody.mass));
            }

            this.velocity[0] = thisNewVel.x; this.velocity[1] = thisNewVel.y; this.velocity[2] = thisNewVel.z;
            otherBody.velocity[0] = otherNewVel.x; otherBody.velocity[1] = otherNewVel.y; otherBody.velocity[2] = otherNewVel.z;
        }
    }

    updatePhysics(timeSinceLastFrame){ //called in animate of main to update this physics body, updates position from velocity and updates other physics properties
        this.velocity[0] += this.acceleration[0] * timeSinceLastFrame;
        this.velocity[1] += this.acceleration[1] * timeSinceLastFrame;
        this.velocity[2] += this.acceleration[2] * timeSinceLastFrame;
        this.physPos[0] += this.velocity[0] * timeSinceLastFrame;
        this.physPos[1] += this.velocity[1] * timeSinceLastFrame;
        this.physPos[2] += this.velocity[2] * timeSinceLastFrame;

        this.position.x = this.physPos[0] * AUModifer;
        this.position.y = this.physPos[1] * AUModifer;
        this.position.z = this.physPos[2] * AUModifer;

        if (this.showTrail && this.root){
            let wp = new THREE.Vector3();
            this.getWorldPosition(wp);    
            this.positions.push(this.root.worldToLocal(wp.clone()));
            let overflow = this.positions.length - this.trailLength;
            if (overflow > 0) {
            this.positions.splice(0, overflow);
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
            if (this.trailLine) {
                this.trailLine.geometry.dispose();
                this.trailLine.material.dispose();
                this.root.remove(this.trailLine);
                this.trailLine = null;
            }
        }
    }

    setBounceEffect(bounceValue){
        this.bounceEffect = bounceValue;
    }
}


//Add ability to swap between different collision types
//Add ability to swap animate functions, demonstrating different algorithm efficiencies
//Add control to change bounce effect - weird not taking affect it seems, changing manually in code changes behavior but changing the slider at all things go flying even from 0 to .01
//Different control configurations based on different algorithms - higher body count for more efficient one, etc.