import * as THREE from './Library/THREE/three.module.js';
import { OrbitControls } from './Library/THREE/jsm/OrbitControls.js';
import { GLTFLoader } from './Library/THREE/jsm/GLTFLoader.js';
import { FBXLoader } from './Library/THREE/jsm/FBXLoader.js';
import { VRButton } from './Library/THREE/jsm/VRButton.js';
import { ARButton } from './Library/THREE/jsm/ARButton.js';
import { XRControllerModelFactory } from './Library/THREE/jsm/XRControllerModelFactory.js'

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

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);

        this.loadingBar = new LoadingBar();
        this.loadGLTF();

        //this.renderer.setAnimationLoop(this.render.bind(this));

        //const shape = new THREE.Shape();
        //const outerRadius = 0.8;
        //const innerRadius = 0.4;
        //const PI2 = Math.PI * 2;
        //const inc = PI2 / 10;

        //shape.moveTo(outerRadius, 0);
        //let inner = true;

        //for (let theta = inc; theta < PI2; theta += inc) {
        //    const radius = (inner) ? innerRadius : outerRadius;
        //    shape.lineTo(Math.cos(theta) * radius, Math.sin(theta) * radius);
        //    inner = !inner;
        //}

        //const extrudeSettings = {
        //    steps: 1,
        //    depth: 1,
        //    bevelEnabled: false
        //}

        //const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        //const material = new THREE.MeshPhongMaterial({
        //    color: 0x00ff00,
        //    specular: 0x444444,
        //    shininess: 60
        //});

        //this.mesh = new THREE.Mesh(geometry, material);

        //this.mesh.position.y = 2;
        //this.mesh.position.z = 2;
        //this.mesh.scale.set(0.5, 0.5, 0.5);

        //this.scene.add(this.mesh);

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement);
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();

        this.initScene();
        this.setupXR();

        window.addEventListener('resize', this.resize.bind(this));
    }

    loadGLTF() {
        const self = this;
        const loader = new GLTFLoader().setPath('./Assets/Models/');

        loader.load('BCh600/bbdc600.glb',
            function (gltf) {
                self.object = gltf.scene;
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
    }

    initScene() {

    }

    setupXR() {
        this.renderer.xr.enabled = true;
        //document.body.appendChild(ARButton.createButton(this.renderer));
        document.body.appendChild(VRButton.createButton(this.renderer));
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

    render() {
        this.mesh.rotateY(0.01);
        this.renderer.render(this.scene, this.camera);
    }
}
export { App };