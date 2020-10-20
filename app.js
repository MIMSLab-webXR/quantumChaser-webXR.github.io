import * as THREE from './Library/THREE/three.module.js';
import { OrbitControls } from './Library/THREE/jsm/OrbitControls.js';
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
        container.appendChild(this.renderer.domElement);

        this.renderer.setAnimationLoop(this.render.bind(this));

        //const geometry = new THREE.SphereBufferGeometry(1, 50, 50, 50);
        const shape = new THREE.CircleBufferGeometry(1, 50);

        const extrudeSettings = {
            steps: 1,
            depth: 50,
            bevelEnabled: true
        }

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.y = 2;
        this.mesh.position.z = 2;
        this.mesh.scale.set(0.5, 0.5, 0.5);

        this.scene.add(this.mesh);

        const controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.initScene();
        this.setupXR();

        window.addEventListener('resize', this.resize.bind(this));
    }

    initScene() {

    }

    setupXR() {
        this.renderer.xr.enabled = true;
        //document.body.appendChild(ARButton.createButton(this.renderer));
        document.body.appendChild(VRButton.createButton(this.renderer));
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