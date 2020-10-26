import * as THREE from './Library/THREE/three.module.js';
import { OrbitControls } from './Library/THREE/jsm/OrbitControls.js';
import { GLTFLoader } from './Library/THREE/jsm/GLTFLoader.js';
import { FBXLoader } from './Library/THREE/jsm/FBXLoader.js';
import { VRButton } from './Library/THREE/jsm/VRButton.js';
import { ARButton } from './Library/THREE/jsm/ARButton.js';
import { XRControllerModelFactory } from './Library/THREE/jsm/XRControllerModelFactory.js'
import { BoxLineGeometry } from './Library/THREE/jsm/BoxLineGeometry.js'
import { Stats } from './Library/stats.module.js'
import { LoadingBar } from './Library/LoadingBar.js';
import { vector3ToString } from './Library/DebugUtils.js'

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 4);

        this.scene = new THREE.Scene();
        //this.scene.background = new THREE.Color(0xffffff);

        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
        this.scene.add(ambient);

        const light = new THREE.DirectionalLight();
        light.position.set(0.2, 1, 1);
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);

        this.loadingBar = new LoadingBar();
        //this.loadGLTF();
        this.loadFBX();

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement);
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.raycaster = new THREE.Raycaster();
        this.workingMatrix = new THREE.Matrix4();
        this.workingVector = new THREE.Vector3();

        this.initScene();
        this.setupVR();

        window.addEventListener('resize', this.resize.bind(this));
    }

    loadGLTF() {
        const self = this;
        const loader = new GLTFLoader().setPath('./Assets/Models/');

        loader.load('BCh600/bbdc600.glb',
            function (gltf) {
                self.object = gltf.scene;
                const bbox = new THREE.Box3().setFromObject(gltf.scene);
                console.log('min:${vector3ToString(bbox.min, 2)} - max:${vector3ToString(bbox.max, 2)}');
                self.scene.add(gltf.scene);
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            function (xhr) {
                self.loadingBar.progress = xhr.loaded / xhr.total;
            },
            function (err) {
                console.log('Error notification');
            }
        )
    }

    loadFBX() {
        const self = this;
        const loader = new GLTFLoader().setPath('./Assets/Models/');

        loader.load('BCh600/bbdc600.fbx',
            function (gltf) {
                self.object = gltf.scene;
                const bbox = new THREE.Box3().setFromObject(gltf.scene);
                console.log('min:${vector3ToString(bbox.min, 2)} - max:${vector3ToString(bbox.max, 2)}');
                self.scene.add(gltf.scene);
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            function (xhr) {
                self.loadingBar.progress = xhr.loaded / xhr.total;
            },
            function (err) {
                console.log('Error notification');
            }
        )
    }

    initScene() {

    }

    setupVR() {
        this.renderer.xr.enabled = true;
        //document.body.appendChild(ARButton.createButton(this.renderer));
        document.body.appendChild(VRButton.createButton(this.renderer));

        this.controllers = this.buildControllers();
    }

    setupAR() {
        this.renderer.xr.enabled = true;
        document.body.appendChild(ARButton.createButton(this.renderer));
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    buildControllers() {
        const controllerModelFactory = new XRControllerModelFactory();

        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        const line = new THREE.Line(geometry);
        line.name = 'line';
        line.scale.z = 0;

        const controllers = [];

        for (let i = 0; i <= 1; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.add(line.clone());
            controller.userData.selectPressed = false;
            this.scene.add(controller);

            controllers.push(controller);

            const grip = this.renderer.xr.getControllerGrip(i);
            grip.add(controllerModelFactory.createControllerModel(grip));
        }

        return controllers;
    }

    handleController(controller) {

    }

    render() {
        this.stats.update();

        if (this.controllers) {
            const self = this;
            this.controllers.forEach((controller) => {
                self.handleController(controller)
            });
        }
        this.renderer.render(this.scene, this.camera);
    }
}
export { App };