import * as THREE from 'three';

export const AUModifer = 100;

export default class PhysicsBody extends THREE.Mesh {
    constructor ({maxSteps = 10, collisionType = "elasticKE", integrationType = "semi-implicit", root, bounceEffect = 0, mass = 1, trailColor = "white", showTrail = false, trailLength = 100, position = [0, 0, 0], initialVelocity = [0, 0, 0], material = new THREE.MeshStandardMaterial({ color: 0xffffff }), geometry = new THREE.SphereGeometry(1, 32, 16)}) {
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
        this.collisionType = collisionType;
        this.integrationType = integrationType;

        this.accumulator = 0;
        this.step = 0;
        this.maxSteps = maxSteps;

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
            otherBody.physPos[0] = otherBody.position.x / AUModifer;
            otherBody.physPos[1] = otherBody.position.y / AUModifer;
            otherBody.physPos[2] = otherBody.position.z / AUModifer;

            //momentum
            let thisVel = new THREE.Vector3(...this.velocity);
            let otherVel = new THREE.Vector3(...otherBody.velocity);
            let rel = thisVel.clone().sub(otherVel).dot(direction);

            // if not approaching along the normal, leave velocities as is
            let thisNewVel  = thisVel;
            let otherNewVel = otherVel;

            if (rel > 0){
                if (this.collisionType == "inelasticHack"){
                    //Totally inelastic on all axis, hacked bounce via impulse
                    thisNewVel = thisVel.clone().multiplyScalar(this.mass).add(otherVel.clone().multiplyScalar(otherBody.mass)).divideScalar(this.mass + otherBody.mass);
                    otherNewVel = thisNewVel.clone();
                    let invMassSum = (1 / this.mass) + (1 / otherBody.mass);
                    let j = - (this.bounceEffect) * rel / invMassSum; //need to include bounceEffect of other body
                    thisNewVel.addScaledVector(direction, j / this.mass);
                    otherNewVel.addScaledVector(direction,  -j / otherBody.mass);
                } else if (this.collisionType == "impulse") {
                    //linear velocity update
                    // j = -(1+e) * rel / (1/m1 + 1/m2)
                    let invMassSum = (1 / this.mass) + (1 / otherBody.mass);
                    let j = - (1 + this.bounceEffect) * rel / invMassSum;

                    // apply change in velocity based on impulse
                    thisNewVel  = thisVel.clone().add(direction.clone().multiplyScalar(j / this.mass));
                    otherNewVel = otherVel.clone().add(direction.clone().multiplyScalar(-j / otherBody.mass));
                } else if (this.collisionType == "elasticKE") {
                    //linear velocity update
                    let thisVelNormal = direction.clone().multiplyScalar(thisVel.dot(direction)); //velocities along collision normal
                    let otherVelNormal = direction.clone().multiplyScalar(otherVel.dot(direction));

                    let thisVelTangential = thisVel.clone().sub(thisVelNormal); // tangential components stay unchanged
                    let otherVelTangential = otherVel.clone().sub(otherVelNormal);

                    let newthisVelNormal = thisVelNormal.clone().multiplyScalar((this.mass - this.bounceEffect * otherBody.mass) / (this.mass + otherBody.mass))
                        .add(otherVelNormal.clone().multiplyScalar((1 + this.bounceEffect) * otherBody.mass / (this.mass + otherBody.mass)));

                    let newotherVelNormal = otherVelNormal.clone().multiplyScalar((otherBody.mass - this.bounceEffect * this.mass) / (this.mass + otherBody.mass))
                        .add(thisVelNormal.clone().multiplyScalar((1 + this.bounceEffect) * this.mass / (this.mass + otherBody.mass)));

                    thisNewVel = thisVelTangential.add(newthisVelNormal);
                    otherNewVel = otherVelTangential.add(newotherVelNormal);
                }
            }

            this.velocity[0] = thisNewVel.x; this.velocity[1] = thisNewVel.y; this.velocity[2] = thisNewVel.z;
            otherBody.velocity[0] = otherNewVel.x; otherBody.velocity[1] = otherNewVel.y; otherBody.velocity[2] = otherNewVel.z;
        }
    }

    updatePhysics(timeSinceLastFrame){ //called in animate of main to update this physics body, updates position from velocity and updates other physics properties

        if (this.integrationType == "semi-implicit"){
            this.semiImplicit(timeSinceLastFrame);
        } else if (this.integrationType == "explicit"){
            this.explicitIntegration(timeSinceLastFrame);
        }

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

    semiImplicit(timeSinceLastFrame){
        //semi-implicit Euler integration with variable timestep
        this.velocity[0] += this.acceleration[0] * timeSinceLastFrame;
        this.velocity[1] += this.acceleration[1] * timeSinceLastFrame;
        this.velocity[2] += this.acceleration[2] * timeSinceLastFrame;
        this.physPos[0] += this.velocity[0] * timeSinceLastFrame;
        this.physPos[1] += this.velocity[1] * timeSinceLastFrame;
        this.physPos[2] += this.velocity[2] * timeSinceLastFrame;
    }

    explicitIntegration(timeSinceLastFrame){
        //explicit or forward with variable timestep
        this.physPos[0] += this.velocity[0] * timeSinceLastFrame;
        this.physPos[1] += this.velocity[1] * timeSinceLastFrame;
        this.physPos[2] += this.velocity[2] * timeSinceLastFrame;
        this.velocity[0] += this.acceleration[0] * timeSinceLastFrame;
        this.velocity[1] += this.acceleration[1] * timeSinceLastFrame;
        this.velocity[2] += this.acceleration[2] * timeSinceLastFrame;
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

//Adjust scene logic: Default scene and other scenes obtained from json, currently default uses hardcoded variables in main
//adjust animation timing - currently delta time changes causing skips in calculations when performance is bad, things jump and possibly getting several impulses added on collision (or comparing the two twice)
//Add ability to swap between different collision types - naive v octtree, hacked inelastic on all axis v inelastic on collision normal 
//Add control to change bounce effect - weird not taking affect it seems, changing manually in code changes behavior but changing the slider at all things go flying even from 0 to .01
//Different control configurations based on different algorithms - higher body count for more efficient one, etc.
//fix camera controls - move camera backwards/left/right/up/down instead of changing x,y,z directly -> update scroll first to get started then controls for dragging


//Animation functions are inacurrate -> need something that is stable to measure time, performance affects the physics too much. This should be contained in the physics bodies updatePhysics()