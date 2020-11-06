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
import {
    Constants as MotionControllerConstants,
    fetchProfile,
    MotionController
} from './Library/THREE/jsm/motion-controllers.module.js';

//const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webze-input-profiles/assets@1.0/dist/profiles';
//const DEFAULT_PROFILE = "generic-trigger";

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.assetsPath = './Assets/';

        this.camera = new THREE.PerspectiveCamera(60,
            window.innerWidth / window.innerHeight, 0.1, 3000);
        this.camera.position.set(0, 1.6, 5);

        this.scene = new THREE.Scene();

        const ambient = new THREE.HemisphereLight(0x555555, 0x999999);
        this.scene.add(ambient);

        this.sun = new THREE.DirectionalLight(0xAAAAFF, 2.5);
        this.sun.castShadow = true;

        const lightSize = 5;
        this.sun.shadow.camera.near = 0.1;
        this.sun.shadow.camera.far = 17;
        this.sun.shadow.camera.left = this.sun.shadow.camera.bottom = -lightSize;
        this.sun.shadow.camera.right = this.sun.shadow.camera.top = lightSize;

        this.sun.shadow.mapSize.width = 1024;
        this.sun.shadow.mapSize.height = 1024;

        this.sun.position.set(0, 10, 10);
        this.scene.add(this.sun);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);
        this.setEnvironment();

        //this.controls = new OrbitControls(
        //    this.camera,
        //    this.renderer.domElement);
        //this.controls.target.set(0, 1.6, 0);
        //this.controls.update();

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.raycaster = new THREE.Raycaster();
        this.workingMatrix = new THREE.Matrix4();
        this.workingVector = new THREE.Vector3();
        this.origin = new THREE.Vector3();

        this.clock = new THREE.Clock();

        this.loadingBar = new LoadingBar();

        this.loadEnvironment();

        this.loading = true;

        window.addEventListener('resize', this.resize.bind(this));
    }

    setEnvironment() {
        const loader = new RGBELoader().setDataType(THREE.UnsignedByteType);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        const self = this;

        loader.load('./Assets/TrainingKits/hdr/venice_sunset_1k.hdr', (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();

            self.scene.environment = envMap;

        }, undefined, (err) => {
            console.error('An error occured setting the environment');
        });
    }

    loadEnvironment() {
        const loader = new GLTFLoader().setPath(this.assetsPath);
        const self = this;

        //Load a glTF resource
        loader.load('TrainingKits/dungeon.glb',
            function (gltf) {
                const scale = 0.5;

                self.scene.add(gltf.scene);

                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        if (child.name == "Navmesh") {
                            child.material.visible = false;
                            self.navmesh = child;
                            child.geometry.scale(scale, scale, scale);
                            child.scale.set(2, 2, 2);
                        } else {
                            child.castShadow = false;
                            child.receiveShadow = true;
                        }
                    }
                });

                gltf.scene.scale.set(scale, scale, scale);

                self.initGame();
            }, function (xhr) {
                self.loadingBar.progress = (xhr.loaded / xhr.total);
            }, function (error) {
                console.log('An error happened');
            }
        );
    }

    initGame() {
        this.player = this.createPlayer();

        const locations = [
            new THREE.Vector3(-0.409, 0.086, 4.038),
            new THREE.Vector3(-0.846, 0.112, 5.777),
            new THREE.Vector3(5.220, 0.176, 2.677),
            new THREE.Vector3(1.490, 2.305, -1.599),
            new THREE.Vector3(7.565, 2.694, 0.008),
            new THREE.Vector3(-8.417, 2.676, 0.192),
            new THREE.Vector3(-6.644, 2.600, -4.114)
        ];

        const self = this;

        this.setupXR();

        this.loading = false;

        this.renderer.setAnimationLoop(this.render.bind(this));

        this.loadingBar.visible = false;
    }

    createMarker(geometry, material) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        this.scene.add(mesh);
        return mesh;
    }

    buildControllers() {
        const controllerModelFactory = new XRControllerModelFactory();

        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);

        const line = new THREE.Line(geometry);
        line.name = 'ray';
        line.scale.z = 10;

        const controllers = [];

        for (let i = 0; i <= 1; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.userData.index = i;
            controller.userData.selectPressed = false;
            controller.add(line.clone());
            controller.userData.marker = this.createMarker(geometry2, material);
            controllers.push(controller);
            this.dolly.add(controller);

            const grip = this.renderer.xr.getControllerGrip(i);
            grip.add(controllerModelFactory.createControllerModel(grip));
            this.dolly.add(grip);
        }

        return controllers;
    }

    setupXR() {
        this.renderer.xr.enabled = true;

        const self = this;

        function onSelectStart() {
            this.userData.selectPressed = true;
            if (this.userData.marker.visible) {
                const pos = this.userData.marker.position;
                console.log(`${pos.x.toFixed(3)}, 
                    ${pos.y.toFixed(3)},
                    ${pos.z.toFixed(3)}`);
            }
        }

        function onSelectEnd() {
            this.userData.selectPressed = false;
        }

        function onSqueezeStart() {
            this.userData.squeezePressed = true;
        }

        function onSqueezeEnd() {
            this.userData.squeezePressed = false;
        }

        const btn = new VRButton(this.renderer);

        this.controllers = this.buildControllers();

        this.controllers.forEach(controller => {
            controller.addEventListener('selectstart', onSelectStart);
            controller.addEventListener('selectend', onSelectEnd);
            controller.addEventListener('squeezestart', onSqueezeStart);
            controller.addEventListener('squeezeend', onSqueezeEnd);
        });

        this.collisionObjects = [this.navmesh];
    }

    intersectObjects(controller) {
        const line = controller.getObjectByName('ray');
        this.workingMatrix.identity().extractRotation(controller.matrixWorld);

        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        this.raycaster.ray.direction, set(0, 0, -1).applyMatrix4(this.workingMatrix);

        const intersects = this.raycaster.intersectObjects(this.collisionObjects);
        const marker = controller.userData.marker;
        marker.visible = false;

        controller.userData.teleport = undefined;

        if (intersects.length > 0) {
            const intersect = intersects[0];
            line.scale.z = intersect.distance;

            if (intersect.object === this.navmesh) {
                marker.scale.set(1, 1, 1);
                marker.position.copy(intersect.point);
                marker.visible = true;
            }
        }
    }

    createPlayer() {
        const target = new THREE.Object3D();
        target.position.set(-3, 0.25, 2);

        const options = {
            object: target,
            speed: 5,
            app: this,
            name: 'player',
            npc: false
        };

        const player = new Player(options);

        this.dolly = THREE.Object3D();
        this.dolly.position.set(0, -0.25, 0);
        this.dolly.add(this.camera);

        this.dummyCam = THREE.Object3D();
        this.camera.add(this.dummyCam);

        target.add(this.dolly);

        this.dolly.rotation.y = Math.PI;

        return player;
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        const dt = this.clock.getDelta();
        const self = this;

        this.sun.position.copy(this.dummyCam.position);
        this.sun.position.y += 10;
        this.sun.position.z += 10;

        this.stats.update();

        if (this.renderer.xr.isPresenting) {
            this.controllers.forEach(controller => {
                self.intersectObjects(controller);
            })
            this.player.update(dt);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

export { App };