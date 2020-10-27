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
import { vector3ToString } from './Library/DebugUtils.js';
import {
    Constants as MotionControllerConstants,
    fetchProfile,
    MotionController
} from './Library/THREE/jsm/motion-controllers.module.js';

const DEFAULT_PROFILES_PATH = 'https://cdn.jsdelivr.net/npm/@webze-input-profiles/assets@1.0/dist/profiles';
const DEFAULT_PROFILE = "generic-trigger";

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.clock = new THREE.Clock();

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.set(0, 1.6, 5);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x505050);

        const ambient = new THREE.HemisphereLight(0x606060, 0x404040);
        this.scene.add(ambient);

        const light = new THREE.DirectionalLight(0xFFFFFF);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        container.appendChild(this.renderer.domElement);

        this.loadingBar = new LoadingBar();
        this.loadGLTF();
        //this.loadFBX();

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement);
        this.controls.target.set(0, 1.6, 0);
        this.controls.update();

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.raycaster = new THREE.Raycaster();
        this.workingMatrix = new THREE.Matrix4();
        this.workingVector = new THREE.Vector3();
        this.origin = new THREE.Vector3();

        this.initScene();
        this.setupVR();

        window.addEventListener('resize', this.resize.bind(this));

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    initScene() {
        this.scene.background = new THREE.Color(0xa0a0a0);
        this.scene.fog = new THREE.Fog(0xa0a0a0, 50, 100);

        //ground
        const ground = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(200, 300),
            new THREE.MeshPhongMaterial({
                color: 0x999999,
                depthWrite: false
            }));
        ground.rotation.x = -MathPI / 2;
        this.scene.add(ground);

        var grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);

        const geometry = new THREE > BoxGeometry(5, 5, 5);
        const material = new THREE.MeshPhongMaterial({ color: 0xAAAA22 });
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2
        }));

        this.colliders = [];

        for (let x = -100; x < 100; x += 10) {
            for (let z = -100; z < 100; z += 10) {
                if (x == 0 && z == 0) continue;
                const box = new THREE.Mesh(geometry, material);
                box.position.set(x, 2.5, z);
                const edge = line.clone();
                edge.position.copy(box.position);
                this.scene.add(box);
                this.scene.add(edge);
                this.colliders.push(box);
            }
        }

        //this.radius = 0.08;

        //this.room = new THREE.LineSegments(
        //    new BoxLineGeometry(6, 6, 6, 10, 10, 10),
        //    new THREE.LineBasicMaterial({ color: 0x808080 })
        //);

        //this.room.geometry.translate(0, 3, 0);
        //this.scene.add(this.room);

        //const geometry = new THREE.IcosahedronBufferGeometry(this.radius, 2);

        //for (let i = 0; i < 200; i++) {
        //    const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xFFFFFF }));

        //    object.position.x = this.random(-2, 2);
        //    object.position.y = this.random(-2, 2);
        //    object.position.z = this.random(-2, 2);

        //    this.room.add(object);
        //}

        //this.highlight = new THREE.Mesh(geometry,
        //    new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        //this.highlight.scale.set(1.2, 1.2, 1.2);
        //this.scene.add(this.highlight);

        //this.dolly = new THREE.Object3D();
        //this.dolly.position.z = 5;
        //this.dolly.add(this.camera);

        //this.dummyCam = new THREE.Object3D;
        //this.scene.add(this.dummyCam);
    }

    setupVR() {
        this.renderer.xr.enabled = true;
        const button = new VRButton(this.renderer);
        const self = this;

        function onSelectStart() {
            this.userData.selectPressed = true;
        }

        function onSelectEnd() {
            this.userData.selectPressed = false;
        }

        this.controller = this.renderer.xr.getController(0);
        this.dolly.add(this.controller);
        this.controller.addEventListener('selectstart', onSelectStart);
        this.controller.addEventListener('selectend', onSelectEnd);
        this.controller.addEventListener('connected', function (event) {
            const mesh = self.buildControllers.call(self, event.data);
            mesh.scale.z = 0;
            this.add(mesh);
        });

        this.controller.addEventListener('disconnected', function () {
            this.remove(this.children[0]);
            self.controller = null;
            self.controllerGrip = null;
        });

        this.scene.add(this.controller);

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip = this.renderer.xr.getControllerGrip(0);
        this.controllerGrip.add(controllerModelFactory.createControllerModel(this.controllerGrip));
        this.scene.add(this.controllerGrip);

        //document.body.appendChild(ARButton.createButton(this.renderer));
        //document.body.appendChild(VRButton.createButton(this.renderer));

        //this.controllers = this.buildControllers();

        //function onSelectStart() {
        //    this.children[0].scale.z = 10;
        //    this.userData.selectPressed = true;
        //}

        //function onSelectEnd() {
        //    this.children[0].scale.z = 0;
        //    self.highlight.visible = false;
        //    this.userData.selectPressed = false;
        //}

        //this.controllers.forEach((controller) => {
        //    controller.addEventListener('selectstart', onSelectStart);
        //    controller.addEventListener('selectend', onSelectEnd);
        //});
    }

    buildControllers() {
        let geometry, material;

        switch (data.targetRayMode) {
            case 'tracked-pointer':
                geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));

                material = new THREE.LineBasicMaterial({
                    vertexColors: true,
                    blending: THREE.AdditiveBlending
                });

                return new THREE.Line(geometry, material);
            case 'gaze':
                geometry = new THREE.RingBufferGeometry(0.02, 0.04, 32).translate(0, 0, -1);
                material = new THREE.MeshBasicMaterial({
                    opacity: 0.5,
                    transparent: true
                });
                return new THREE.Mesh(geometry, material);
        }
        //const controllerModelFactory = new XRControllerModelFactory();

        //const geometry = new THREE.BufferGeometry().setFromPoints([
        //    new THREE.Vector3(0, 0, 0),
        //    new THREE.Vector3(0, 0, -1)
        //]);
        //const line = new THREE.Line(geometry);
        //line.name = 'line';
        //line.scale.z = 0;

        //const controllers = [];

        //for (let i = 0; i <= 1; i++) {
        //    const controller = this.renderer.xr.getController(i);
        //    controller.add(line.clone());
        //    controller.userData.selectPressed = false;
        //    this.scene.add(controller);

        //    controllers.push(controller);

        //    const grip = this.renderer.xr.getControllerGrip(i);
        //    grip.add(controllerModelFactory.createControllerModel(grip));
        //    this.scene.add(grip);
        //}

        //return controllers;
    }

    handleController(controller, dt) {
        if (controller.userData.selectPressed) {

            //controller.children[0].scale.z = 10;

            //this.workingMatrix.identity().extractRotation(controller.matrixWorld);

            //this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);

            //this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.workingMatrix);

            //const intersects = this.raycaster.intersectObjects(this.room.children);

            //if (intersects.length > 0) {
            //    intersects[0].object.add(this.highlight);
            //    this.highlight.visible = true;
            //    controller.children[0].scale.z = intersects[0].distance;
            //} else {
            //    this.highlight.visible = false;
            //}

            //const wallLimit = 1.3;
            //let pos = this.dolly.position.clone();
            //pos.y += 1;
            //const speed = 2;
            //const quaternion = this.dolly.quaternion.clone();
            //this.dolly.quaternion.copy(this.dummyCam.getWorldQuaternion());
            //this.dolly.getWorldDirection(this.workingVector);
            //this.workingVector.negate();

            //this.raycaster.set(pos, this.workingVector);
            //let blocked = false;
            //let intersect = this.raycast.intersectObjects(this.colliders);

            //if (intersect.length > 0) {
            //    if (intersect[0].distance < wallLimit) blocked = true;
            //}

            //if (!blocked) {
            //    this.dolly.translateZ(-dt * speed);
            //}

            //this.dolly.position.y = 0;
            //this.dolly.quaternion.copy(quaternion);
        }
    }

    setupAR() {
        this.renderer.xr.enabled = true;
        document.body.appendChild(ARButton.createButton(this.renderer));
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
                console.log('min:${vector3ToString(bbox.min, 2)}$ - max:${vector3ToString(bbox.max, 2)}$');
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

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        const dt = this.clock.getDelta();
        this.stats.update();

        if (this.controllers) {
            //const self = this;
            //this.controllers.forEach((controller) => {
            //    self.handleController(controller)
            //});
            this.handleController(this.controller, dt);
        }
        this.renderer.render(this.scene, this.camera);
    }
}
export { App };