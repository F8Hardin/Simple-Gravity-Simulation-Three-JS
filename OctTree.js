import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { SolutionBase } from './SolutionBase';

let forceMaxChildren = false;


class treeNode {
    constructor({physBodies = [], children = [], depth = 0, position = [0, 0, 0], length}) {
        this.children = children;
        this.physBodies = physBodies;
        this.depth = depth;
        this.position = position;
        this.length = length;
    }
}

export default class OctTree extends SolutionBase {
    constructor({physBodies, maxDepth, maxBodyCount, rootRange, visibleTree = false, frameRate = 0, frameCount = 0, scene, camera, renderer, speedModifier = 1, focusPoint, gravConstant = 1, cameraScroll = 1250}) {
        super({physBodies, scene, cameraScroll, camera, renderer, frameCount, frameRate, speedModifier, focusPoint, gravConstant});
        this.physBodies = physBodies;
        this.maxDepth = maxDepth;
        this.maxBodyCount = maxBodyCount;
        this.rootRange = rootRange * 2; //double to include negative
        this.visibleTree = visibleTree;
        this.scene = scene;

        this.debugBoxes = [];
        this.rootNode = new treeNode({physBodies: this.physBodies, length: this.rootRange})
        this.naiveAnimate = true;

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
            this.rootNode.physBodies = this.physBodies;
        }

        if ((forceMaxChildren && someTreeNode.depth < this.maxDepth) || (someTreeNode.physBodies.length > this.maxBodyCount && someTreeNode.depth < this.maxDepth && someTreeNode.children.length === 0)){ //too many items and not at max subnodes
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

            if (this.visibleTree){
                for (const node of someTreeNode.children){
                    this.drawNodeBox(node, "white");
                }
            }

            let childBuckets = [[], [], [], [], [], [], [], []]; //8 for our new nodes
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
                        childBuckets[j].push(someTreeNode.physBodies[i]);
                        placed = true; //mark as placed
                        break; //move on to next body
                    }
                }
                if (!placed){
                    remaining.push(someTreeNode.physBodies[i]);
                }
            }

            //store bodies in proper node and build subtree, storing remaining back in current node
            someTreeNode.physBodies = remaining;
            for (let k = 0; k < someTreeNode.children.length; k++){
                someTreeNode.children[k].physBodies = childBuckets[k];
                if (someTreeNode.children[k].physBodies.length > 0 || forceMaxChildren){
                    this.buildTree(someTreeNode.children[k]);
                }
            }
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

    animate() {
        if (this.naiveAnimate)
            this.octTreeAnimateNaive();
        else
            this.octTreeAnimateBarnesHut();
    }

    octTreeAnimateBarnesHut(){
        console.log("Barnes hut not yet implemented.");
    }

    octTreeAnimateNaive() { //redraws tree every x frames
      let clockDelta = this.clock.getDelta();
      let timeSinceLastFrame = Math.min(clockDelta, 1/30);
      this.frameRate = 1 / clockDelta;
      this.frameCount += 1;

      this.resetAcceleration();
      if (this.updateOctTreeEveryFrames == this.frameCount){
        this.frameCount = 0;
        this.focusPoint ? this.buildTree(this.rootNode, [this.focusPoint.position.x, this.focusPoint.position.y, this.focusPoint.position.z]) : this.buildTree(this.rootNode, [0, 0, 0]);
      }

      if (this.speedModifier > 0){
        this.traverseOctTree(this.rootNode);
        for (let b of this.physBodies){
          b.updatePhysics(timeSinceLastFrame * this.speedModifier);
        }
      }

      if (this.focusPoint) {
        this.camera.position.copy(this.focusPoint.position).add(new THREE.Vector3(0, 0, this.cameraScroll));
      }
      this.renderer.render( this.scene, this.camera );
    }

    octTreeAnimateStatic(){ //static tree and updated bodies in nodes
      let clockDelta = this.clock.getDelta();
      let timeSinceLastFrame = Math.min(clockDelta, 1/30);
      this.frameRate = 1 / clockDelta;
      this.frameCount += 1;
      this.resetAcceleration();

      //new logic here

      this.camera.position.copy(this.focusPoint.position).add(new THREE.Vector3(0, 0, this.cameraScroll));
      this.renderer.render( this.scene, this.camera );
    }

    traverseOctTree(currentNode, nodeRemainingBodies = [], allNodesThisLevel = []){ //review for duplicates
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
        this.traverseOctTree(currentNode.children[i], newNodeRemainingBodies, currentNode.children);
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