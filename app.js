import * as THREE from './Library/THREE/three.module.js';
import { OrbitControls } from './Library/THREE/jsm/OrbitControls.js';
import { GLTFLoader } from './Library/THREE/jsm/GLTFLoader.js';
import { FBXLoader } from './Library/THREE/jsm/FBXLoader.js';
import { VRButton } from './Library/VRButton.js';
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
        // Creating a container for the application

        const container = document.createElement('div');
        document.body.appendChild(container);

        // Setting up a scene

        this.scene = new THREE.Scene();

        // Setting up a camera

        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect Ratio
            0.1, // Nearest plane
            1000 // Farthest plane
        )

        // Setting up a WebGL renderer

        this.renderer = new THREE.WebGL1Renderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        document.body.appendChild(this.renderer.domElement);

        // Setting up lighting

        // 1 - Directional Light: Emitted in a specific direction; emulates sunrays
        // Inputs - color, intensity

        this.directionalLight = new THREE.DirectionalLight(
            0xFFFFFF, 0.5);
        this.scene.add(this.directionalLight);
        this.directionalLight.position.set(0, 10, 0);

        // Other properties include .castShadow (expensive, boolean),
        // .shadow (calculate shadows for light)
        // .target (targeted object for the light effect)

        // 2 - Ambient Light: Illuminates all present objects in the scene equally

        this.ambient = new THREE.AmbientLight(0x404040);
        this.scene.add(this.ambient);

        // 3 - Hemisphere Light: Positioned directly above the scene, 
        // with color fading from the sky color to the ground color

        this.hemisphereLight = new THREE.HemisphereLight(
            0xFFFFBB, 0X080820);
        this.scene.add(this.hemisphereLight);
        this.hemisphereLight.position.set(0, 10, 0);

        // FPS count - Realtime

        this.fpvCounter = new Stats();
        document.body.appendChild(this.fpvCounter.domElement);

        // Setting up an Orbit Control point to allow the camera to orient
        // per the head movement

        this.orbitControl = new OrbitControls(
            this.camera, this.renderer.domElement);
        this.orbitControl.target.set(0, 3.5, 0);
        this.orbitControl.update();

        // Raycaster setting - Raycasting is used for input picking 
        // (working out what objects in the 3D space the input pointer 
        // is pointing towards).

        this.raycaster = new THREE.Raycaster();

        // Setting up a working matrix

        this.workingMatrix = new THREE.Matrix4();

        //Setting up a working vector

        this.workingVector = new THREE.Vector3();

        // Calling the objects and actors

        this.initScene();
        //this.setupXR();

        this.renderer.setAnimationLoop(this.render.bind(this));

        window.addEventListener('resize', this.resize.bind(this));
    }

    initScene() {
        this.skybox();      // Layer 1 - Sky shader
        this.sun();         // Layer 2 - Sun
        this.ground();      // Layer 3 - Floor/Ground
    }

    updateScene() {

    }

    setupXR() {
        this.renderer.xr.enabled = true;
        document.body.appendChild(VRButton.createButton(this.renderer));
    }

    skybox() {
        this.textureSky = new THREE.TextureLoader().load('./Assets/Images/Sky.jpg');
        this.geometryUniverse = new THREE.SphereBufferGeometry(1000);
        this.materialUniverse = new THREE.MeshBasicMaterial({ map: this.textureSky, side: THREE.BackSide });
        this.universe = new THREE.Mesh(this.geometryUniverse, this.materialUniverse);
        this.scene.add(this.universe);
    }

    sun() {
        const sunCtr = [10, 10, 10];    // Static position for now

        this.textureSun = new THREE.TextureLoader().load('./Assets/Images/sun.png');
        this.geometrySun = new THREE.SphereBufferGeometry(5, 100, 100);
        this.materialSun = new THREE.MeshBasicMaterial({ map: this.textureSun });
        this.sun = new THREE.Mesh(this.geometrySun, this.materialSun);
        this.sun.position.set(sunCtr[0], sunCtr[1], sunCtr[2]);
        this.scene.add(this.sun);

        this.sunlight = new THREE.PointLight(0xFFFFFF, 1);
        this.sunlight.position.set(sunCtr[0], sunCtr[1], sunCtr[2]);
        this.scene.add(this.sunlight);
    }

    ground() {

    }

    loadStaticModels() {

    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.fpvCounter.update();

        this.renderer.render(this.scene, this.camera);
    }
}

export { App };