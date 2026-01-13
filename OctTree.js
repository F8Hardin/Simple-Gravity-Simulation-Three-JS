import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { SolutionBase } from './SolutionBase';


class treeNode {
    constructor({physBodies = [], children = [], depth = 0, position = [0, 0, 0], length}) {
        this.children = children;
        this.physBodies = physBodies;
        this.depth = depth;
        this.position = position;
        this.length = length;
        this.mass = 0;
        this.massMoment = new THREE.Vector3();
    }
}

export default class OctTree extends SolutionBase {
    constructor({variableTimeStep, constantTimeStep, maxBodies, updateOctTreeEveryFrames = null, physBodies, maxBodyCount, rootRange, visibleTree = false, frameRate = 0, frameCount = 0, scene, camera, renderer, speedModifier = 1, focusPoint, gravConstant = 1}) {
        super({variableTimeStep, constantTimeStep, maxBodies, physBodies, scene, camera, renderer, frameCount, frameRate, speedModifier, focusPoint, gravConstant});
        this.physBodies = physBodies;
        this.maxBodyCount = maxBodyCount;
        this.rootRange = rootRange * 2; //double to include negative
        this.visibleTree = visibleTree;
        this.scene = scene;

        this.maxCellDistanceTheta = .6;
        this.softeningSq = 0;

        this.debugBoxes = [];
        this.updateOctTreeEveryFrames = updateOctTreeEveryFrames ?? 30;
        this.rootNode = new treeNode({physBodies: this.physBodies, length: this.rootRange})
        this.naiveAnimate = false;

        this.frameCount = 0;
        this.buildTree(this.rootNode);
    }

    buildTree(someTreeNode, position) {
        if (someTreeNode == this.rootNode){
            this.clearBoxes();

            if (this.visibleTree){
                this.drawNodeBox(this.rootNode, "red", 10);
            }

            if (position){
                this.rootNode.position = position;
            }

            this.rootNode.children = [];
            this.rootNode.mass = 0;
            this.rootNode.massMoment.set(0, 0, 0);
            this.rootNode.physBodies = this.physBodies;
        }

        if (someTreeNode.physBodies.length > this.maxBodyCount){ //too many items
            //create 8 children
            someTreeNode.children.push(new treeNode({
                depth: someTreeNode.depth + 1,
                position: [someTreeNode.position[0] + someTreeNode.length / 4, someTreeNode.position[1] + someTreeNode.length / 4, someTreeNode.position[2] + someTreeNode.length / 4],
                length: someTreeNode.length / 2
            }));
            someTreeNode.children.push(new treeNode({
                depth: someTreeNode.depth + 1,
                position: [someTreeNode.position[0] - someTreeNode.length / 4, someTreeNode.position[1] + someTreeNode.length / 4, someTreeNode.position[2] + someTreeNode.length / 4],
                length: someTreeNode.length / 2
            }));
            someTreeNode.children.push(new treeNode({
                depth: someTreeNode.depth + 1,
                position: [someTreeNode.position[0] - someTreeNode.length / 4, someTreeNode.position[1] - someTreeNode.length / 4, someTreeNode.position[2] + someTreeNode.length / 4],
                length: someTreeNode.length / 2
            }));
            someTreeNode.children.push(new treeNode({
                depth: someTreeNode.depth + 1,
                position: [someTreeNode.position[0] - someTreeNode.length / 4, someTreeNode.position[1] - someTreeNode.length / 4, someTreeNode.position[2] - someTreeNode.length / 4],
                length: someTreeNode.length / 2
            }));
            someTreeNode.children.push(new treeNode({
                depth: someTreeNode.depth + 1,
                position: [someTreeNode.position[0] + someTreeNode.length / 4, someTreeNode.position[1] - someTreeNode.length / 4, someTreeNode.position[2] - someTreeNode.length / 4],
                length: someTreeNode.length / 2
            }));
            someTreeNode.children.push(new treeNode({
                depth: someTreeNode.depth + 1,
                position: [someTreeNode.position[0] + someTreeNode.length / 4, someTreeNode.position[1] + someTreeNode.length / 4, someTreeNode.position[2] - someTreeNode.length / 4],
                length: someTreeNode.length / 2
            }));
            someTreeNode.children.push(new treeNode({
                depth: someTreeNode.depth + 1,
                position: [someTreeNode.position[0] + someTreeNode.length / 4, someTreeNode.position[1] - someTreeNode.length / 4, someTreeNode.position[2] + someTreeNode.length / 4],
                length: someTreeNode.length / 2
            }));
            someTreeNode.children.push(new treeNode({
                depth: someTreeNode.depth + 1,
                position: [someTreeNode.position[0] - someTreeNode.length / 4, someTreeNode.position[1] + someTreeNode.length / 4, someTreeNode.position[2] - someTreeNode.length / 4],
                length: someTreeNode.length / 2
            }));

            //draw this box -> currently overlaps cuasing performance degregation
            if (this.visibleTree){
                for (const node of someTreeNode.children){
                    this.drawNodeBox(node, "white");
                }
            }

            let remaining = []; //in between nodes

            //currently allows for straddlers - watch for bouncing between sibling nodes, or add epsilon to make fit exactly one child
            for (let i = 0; i < someTreeNode.physBodies.length; i++){
                let placed = false;
                for (let j = 0; j < someTreeNode.children.length; j++){ //find where it fits - NOTE: phys body position is three.js position, children position is a list
                    let distanceX = Math.abs(someTreeNode.physBodies[i].position.x - someTreeNode.children[j].position[0]) + someTreeNode.physBodies[i].radius;
                    let distanceY = Math.abs(someTreeNode.physBodies[i].position.y - someTreeNode.children[j].position[1]) + someTreeNode.physBodies[i].radius;
                    let distanceZ = Math.abs(someTreeNode.physBodies[i].position.z - someTreeNode.children[j].position[2]) + someTreeNode.physBodies[i].radius;
                    
                    let half = someTreeNode.children[j].length / 2
                    if (distanceX <= half && distanceY <= half && distanceZ <= half){
                        someTreeNode.children[j].physBodies.push(someTreeNode.physBodies[i]);
                        placed = true; //mark as placed
                        break; //move on to next body
                    }
                }
                if (!placed){
                    remaining.push(someTreeNode.physBodies[i]);
                }
            }

            //build subtrees
            // if (someTreeNode.mass > 0){
            //     someTreeNode.mass = 0;
            // }
            for (let k = 0; k < someTreeNode.children.length; k++){
                if (someTreeNode.children[k].physBodies.length > 0){
                    var nodeData = this.buildTree(someTreeNode.children[k]);
                    someTreeNode.mass += nodeData[0];
                    someTreeNode.massMoment.add(nodeData[1]);
                }
            }

            //reset bodies for this node - remaining or empty bc contained in children
            someTreeNode.physBodies = remaining;
            for (let b of remaining){
                someTreeNode.mass += b.mass;
                someTreeNode.massMoment.add(b.position.clone().multiplyScalar(b.mass));
            }
            return [someTreeNode.mass, someTreeNode.massMoment];

        } else { //no child nodes
            let mass = 0;
            let moment = new THREE.Vector3();

            for (let b of someTreeNode.physBodies) {
                mass += b.mass;
                moment.add(b.position.clone().multiplyScalar(b.mass));
            }

            someTreeNode.mass = mass;
            someTreeNode.massMoment = moment;

            return [someTreeNode.mass, someTreeNode.massMoment];
        }
    }

    clearBoxes() {
        for (const m of this.debugBoxes) {
            this.scene.remove(m);
            if (m.geometry) m.geometry.dispose();
            if (m.material) {
                if (Array.isArray(m.material)) {
                    m.material.forEach(mat => mat.dispose && mat.dispose());
                } else {
                    m.material.dispose && m.material.dispose();
                }
            }
        }
        this.debugBoxes.length = 0;
    }

    drawNodeBox(node, color = 0x00ff88, lineMultiplier = 1) {
        let geom = new THREE.BoxGeometry(node.length, node.length, node.length);
        let edges = new THREE.EdgesGeometry(geom);
        let lineGeom = new LineSegmentsGeometry().fromEdgesGeometry(edges);
        let mat = new LineMaterial({ color, transparent: true, opacity: 0.35, linewidth: lineMultiplier });
        let lines = new LineSegments2(lineGeom, mat);
        lines.position.set(node.position[0], node.position[1], node.position[2]);
        this.scene.add(lines);
        this.debugBoxes.push(lines);
    }

    barnesHuttTraverse(){
        this.focusPoint ? this.buildTree(this.rootNode, [this.focusPoint.position.x, this.focusPoint.position.y, this.focusPoint.position.z]) : this.buildTree(this.rootNode, [0, 0, 0]);
        console.log("TOTAL SYSTEM MASS:", this.rootNode.mass);

        this.resetAcceleration();

        for(let i = 0; i < this.physBodies.length; i++){
            this.recursiveGravity(this.physBodies[i], this.rootNode);
        }
    }

    recursiveGravity(body, node){
        if (node.mass === 0) return;
        
        //get distance from center of mass
        let centerOfNodeMass = node.massMoment.clone().divideScalar(node.mass);
        let dx = centerOfNodeMass.x - body.position.x;
        let dy = centerOfNodeMass.y - body.position.y;
        let dz = centerOfNodeMass.z - body.position.z;
        let distSq = dx * dx + dy * dy + dz * dz + this.softeningSq;

        let half = node.length / 2;
        let contained = Math.abs(body.position.x - node.position[0]) <= half && Math.abs(body.position.y - node.position[1]) <= half && Math.abs(body.position.z - node.position[2]) <= half;
    
        if ((node.length * node.length) < (this.maxCellDistanceTheta * this.maxCellDistanceTheta * distSq) && !contained){ //far away
            this.checkGravityWithNode(body, centerOfNodeMass, node.mass);
        } else { //nearby or contained
            for (let i = 0; i < node.physBodies.length; i++) {
                let other = node.physBodies[i];
                if (other !== body)
                    this.checkCollisionAndGravity(body, other);
            }
            if (node.children.length > 0){ //internal
                for (let j = 0; j < node.children.length; j++){
                    this.recursiveGravity(body, node.children[j]);
                }
            }
        }
    }

    animate() {
        this.lastClockDelta = this.clock.getDelta();
        this.frameRate = 1 / this.lastClockDelta;
        this.frameCount += 1;

        if (this.updateOctTreeEveryFrames >= this.frameCount && this.naiveAnimate){
            this.frameCount = 0;
            this.focusPoint ? this.buildTree(this.rootNode, [this.focusPoint.position.x, this.focusPoint.position.y, this.focusPoint.position.z]) : this.buildTree(this.rootNode, [0, 0, 0]);
        }

        if (this.variableTimeStep){
            this.resetAcceleration();

            if (this.speedModifier > 0){
                if (this.naiveAnimate)
                    this.naiveTraverseOctTree(this.rootNode);
                else
                    this.barnesHuttTraverse();
                for (let b of this.physBodies){
                    b.updatePhysics(this.lastClockDelta * this.speedModifier);
                }
            }
        } else {
            this.accumulator += this.lastClockDelta;

            if (this.accumulator >= this.constantTimeStep){ //try if instead of while, or only allow X updates before moving on -> or use both
                this.resetAcceleration();

                if (this.speedModifier > 0){
                    if (this.naiveAnimate)
                        this.naiveTraverseOctTree(this.rootNode);
                    else
                        this.barnesHuttTraverse();
                    for (let b of this.physBodies){
                        b.updatePhysics(this.constantTimeStep * this.speedModifier);
                    }
                }

                this.accumulator -= this.constantTimeStep;
                this.updatePhyicsClockDelta();
            }
        }

        this.cameraTrackFocus();
        this.renderer.render( this.scene, this.camera );
    }

    naiveTraverseOctTree(currentNode, nodeRemainingBodies = [], allNodesThisLevel = []){ //traverses and performs gravity and collision checks on bodies that share a node, bodies of neighboring nodes, or remaining bodies -> not accurate as far away bodies have 0 affect
      //compare current nodes bodies to its own bodies
      for (let j = 0; j < currentNode.physBodies.length; j++){
        let body1 = currentNode.physBodies[j];
        for (let k = j + 1; k < currentNode.physBodies.length; k++){
          let body2 = currentNode.physBodies[k];
          this.checkCollisionAndGravity(body1, body2);
        }
      }

      if (nodeRemainingBodies.length > 0){ //compare parents remaining with children
        for (let j = 0; j < nodeRemainingBodies.length; j++){
          let body1 = nodeRemainingBodies[j];
          for (let k = 0; k < currentNode.physBodies.length; k++){
            let body2 = currentNode.physBodies[k];
            this.checkCollisionAndGravity(body1, body2);
          }
        }
      }

      //traverse any children
      let newNodeRemainingBodies = nodeRemainingBodies.length ? nodeRemainingBodies.concat(currentNode.physBodies) : currentNode.physBodies.slice();
      for (let i = 0; i < currentNode.children.length; i++){
        this.naiveTraverseOctTree(currentNode.children[i], newNodeRemainingBodies, currentNode.children);
      }

      //compare to current nodes bodies neighboring nodes bodies
      if (allNodesThisLevel.length > 0){
        let currentNodeIndex = allNodesThisLevel.indexOf(currentNode);

        if (currentNodeIndex != -1){
          for (let i = currentNodeIndex + 1; i < allNodesThisLevel.length; i++){
            for (let j = 0; j < allNodesThisLevel[i].physBodies.length; j++){
              let body1 = allNodesThisLevel[i].physBodies[j];
              for (let k = 0; k < currentNode.physBodies.length; k++){
                let body2 = currentNode.physBodies[k];
                this.checkCollisionAndGravity(body1, body2);
              }
            }
          }
        }
      }
    }

    getAnimationState(){
        return this.naiveAnimate;
    }
}