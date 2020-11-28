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
        this.setupXR();
        //visually add an origin to the general scene to see orientation for each axis (from three.js documentation):
        this.axesHelper = new THREE.AxesHelper(15);
        this.scene.add(this.axesHelper);

        
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
        this.geometryUniverse = new THREE.SphereBufferGeometry(1000, 100);
        this.materialUniverse = new THREE.MeshBasicMaterial({ map: this.textureSky, side: THREE.BackSide });
        this.universe = new THREE.Mesh(this.geometryUniverse, this.materialUniverse);
        this.scene.add(this.universe);
    }

    sun() {
        const sunCtr = [0, 0, 100];    // Static position for now
        this.sun = new THREE.Group();

        this.textureSun = new THREE.TextureLoader().load('./Assets/Images/sun.png');
        this.geometrySun = new THREE.SphereBufferGeometry(5, 100, 100);
        this.materialSun = new THREE.MeshBasicMaterial({ map: this.textureSun });
        this.sun = new THREE.Mesh(this.geometrySun, this.materialSun);
        this.sun.position.set(sunCtr[0], sunCtr[1], sunCtr[2]);
        this.sun.add(this.sun);

        this.sunPlight = new THREE.PointLight(0xFFFFFF, 0.5);
        this.sunPlight.position.set(sunCtr[0], sunCtr[1], sunCtr[2]);
        this.sun.add(this.sunPlight);

        this.sunDlight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
        this.sunDlight.position.set(sunCtr[0], sunCtr[1], sunCtr[2]);
        this.sun.add(this.sunDlight);

        this.scene.add(this.sun);
    }

    ground() {
        //---------------------create ground plane: ----------------------------
        /*
        ========================REFERENCES:===================================
        (using buffer geometry as its faster however harder to manipulate )
        1. how to manipulate buffer vertices: https://stackoverflow.com/questions/49956422/what-is-difference-between-boxbuffergeometry-vs-boxgeometry-in-three-js
        2. how to manipulate non buffer-plane vertices: https://grahamweldon.com/post/2012/01/3d-terrain-generation-with-three.js/

        */

        const groundDim = [50,50,5]; //w,h,depth
        const numbGroundSeg = [20,20,5];
        const groundLocation = [0, 0, 0]; //location of origin for object

        this.groundGeo = new THREE.BoxGeometry(groundDim[0], groundDim[1], groundDim[2], numbGroundSeg[0], numbGroundSeg[1], numbGroundSeg[2]); //(width,height,depth #widthSegments,#heightSegments,#depthSegments)
        
        //this.groundGeo.dynamic = true; //allows for geometry to change
        this.groundGeo.mergeVertices(); // checks for duplicate vertices then removes them

        //find out info. on cube vertices and faces by printing to console:
        /*
        console.log(this.groundGeo.faces);
        console.log(this.groundGeo.vertices);
        */
        
        const xRange = [0,33];
        const yRange = [0, 33];
        const zRange = [0, 3];
        var numbVertices = this.groundGeo.vertices.length;
        //generate random vertices and each time site is rendered: (ie-new terrain each time)
        for (var i = 0; i < numbVertices; i++) {
            //this.groundGeo.vertices[i].x = xRange[0] + Math.random() * (xRange[1] - xRange[0]); // use struture of xmin + Math.random() * (xmax-xmin) equation since Math.random() returns a numb from 0-1.
            //this.groundGeo.vertices[i].y = yRange[0] + Math.random() * (yRange[1] - yRange[0]);
            this.groundGeo.vertices[i].z = zRange[0] + Math.random() * (zRange[1] - zRange[0]);
            this.groundGeo.mergeVertices(); // checks for duplicate vertices then removes them

            this.groundGeo.verticesNeedUpdate = true;
            //this.groundGeo.dynamic = true; //allows for geometry to change

           // this.groundGeo._dirtyVertices = true;
            //groundGeo.computeCentroids(); // allows PlaneGeometry to not appear flat after vertice changes
        }

        // adding grid-lines/wireframe to geometry for better segment visualization: from==>https://discourse.threejs.org/t/about-showing-grid-lines/13616

        this.wireframe = new THREE.WireframeGeometry(this.groundGeo);//,this.wireframeMat);
        this.line = new THREE.Line(this.wireframe);
        this.line.material.depthTest = true;
        this.line.material.opacity =1;
        this.line.material.transparent = true;
        
        //applying textures to specific faces: from==> https://stackoverflow.com/questions/48385258/threejs-planegeometry-load-texture-to-specific-faces

        //Draw grid with static colors
        // materials
        this.groundMaterial = [];
        this.Grass = new THREE.TextureLoader().load('./Assets/Images/Grass.jpg');
        this.Cracked_mud = new THREE.TextureLoader().load('./Assets/Images/Cracked_mud.jpg');
        this.Gravel = new THREE.TextureLoader().load('./Assets/Images/Gravel.jpg');



        this.groundMaterial.push(new THREE.MeshBasicMaterial({map: this.Grass})); // .push command is like pythons .append command (appends values to end of array)
        this.groundMaterial.push(new THREE.MeshBasicMaterial({ map: this.Gravel }));
        this.groundMaterial.push(new THREE.MeshBasicMaterial({ map: this.Cracked_mud }));
        
        // Add materialIndex to face
        
        var numbFaces = this.groundGeo.faces.length;
        for (var i = 0; i < Math.ceil(numbFaces/3); i++) {
            this.groundGeo.faces[i].materialIndex = 0; //select Grass
            this.groundGeo.elementsNeedUpdate = true;

        }
        for (var i = Math.floor(numbFaces/3); i < Math.ceil(numbFaces*2 / 3); i++) {
            this.groundGeo.faces[i].materialIndex = 1; //select Gravel
            this.groundGeo.elementsNeedUpdate = true;

        }
        for (var i = Math.floor(numbFaces *2 / 3); i < numbFaces; i++) {
            this.groundGeo.faces[i].materialIndex = 2; //select Cracked mud
            this.groundGeo.elementsNeedUpdate = true;

        }

        
        this.Ground = new THREE.Mesh(this.groundGeo, this.groundMaterial);
        this.Ground.add(this.line);

        //place its location:
        this.Ground.position.set(groundLocation[0], groundLocation[1], groundLocation[2]);


        this.scene.add(this.Ground);

        


        

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

        //this.skybox += 0.01;
        //this.sunlight.rotateY += 0.005;

        this.renderer.render(this.scene, this.camera);
    }
}

export { App };