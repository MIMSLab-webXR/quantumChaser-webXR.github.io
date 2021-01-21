import * as THREE from './Library/THREE/three.module.js';
import { OrbitControls } from './Library/THREE/jsm/OrbitControls.js';
import { GLTFLoader } from './Library/THREE/jsm/GLTFLoader.js';
import { FBXLoader } from './Library/THREE/jsm/FBXLoader.js';
import { VRButton } from './Library/THREE/jsm/VRButton.js';
import { ARButton } from './Library/THREE/jsm/ARButton.js';
import { XRControllerModelFactory } from './Library/THREE/jsm/XRControllerModelFactory.js';
import { BoxLineGeometry } from './Library/THREE/jsm/BoxLineGeometry.js';
import { Stats } from './Library/stats.module.js';
import { LoadingBar } from './Library/LoadingBar.js';
import { vector3ToString } from './Library/DebugUtils.js';
import { CanvasUI } from './Library/CanvasUI.js';
import { CanvasKeyboard } from './Library/CanvasKeyboard.js';
import { XRWorldMeshes } from './Library/XRWorldMeshes.js';
import { TeleportMesh } from './Library/TeleportMesh.js';
import { Player } from './Library/Player.js';
import { RGBELoader } from './Library/THREE/jsm/RGBELoader.js';
import { Interactable } from './Library/Interactable.js';
import {
    Constants as MotionControllerConstants,
    fetchProfile,
    MotionController
} from './Library/THREE/jsm/motion-controllers.module.js';

class App {
    constructor() {
        this.init();
        this.animate();
    }

    init() {
        container = document.createElement('div');
        document.body.appendChild(container);

        var scene = new THREE.Scene();
        scene.background = new THREE.Color("#808080");

        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.6, 3);

        var controls = new OrbitControls(camera, container);
        controls.target.set(0, 1.6, 0);
        controls.update();

        var floor = {};
        floor.geometry = new THREE.PlaneBufferGeometry(4, 4);
        floor.material = new THREE.MeshStandardMaterial({
            color: "#eeeeee",
            roughness: 1,
            metalness: 0
        });
        floor.mesh = new THREE.Mesh(floor.geometry, floor.material);
        floor.mesh.rotation.x = -Math.PI / 2;
        floor.mesh.receiveShadow = true;
        scene.add(floor);

        var renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = new THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);
    }

    xrSetup() {

    }

    animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
}

export { App };