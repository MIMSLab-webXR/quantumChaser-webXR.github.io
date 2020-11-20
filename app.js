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
	constructor ( ) {

		// Setting up a container

		const container = document.createElement('div');
		document.body.appendChild(container);


		// Importing the asset path

		this.assetPath = "./Assets/";

		// Setting up the renderer

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		document.body.appendChild( this.renderer.domElement );
		
		// Setting up the scene

		this.scene = new THREE.Scene();

		// Setting up the camera

		this.camera = new THREE.PerspectiveCamera(
			75,	// FOV
			window.innerWidth / window.innerHeight,	// Aspect Ratio
			0.1,	// Nearest plane
			1000	// Farthest plane
		);

		// Setting up the light

		this.ambient = new THREE.HemisphereLight( 0x555555, 0x555555 );
		this.scene.add( this.ambient );

		this.light = new THREE.DirectionalLight( 0xAAAAFF, 2.5 );
		this.light.castShadow = true;
		this.light.position.set(0, 10, 10);
		this.scene.add( this.light );

		// Setting up a raycaster
		this.raycaster = new THREE.Raycaster();
		this.workingMatrix = new THREE.Matrix4();
		this.workingVector = new THREE.Vector3();
		this.origin = new THREE.Vector3();
		
		this.fpsShow( this );
		this.animate( this );

		window.addEventListener( 'resize', this.resize.bind( this ) );
	}

	fpsShow( ){
		this.stats = new Stats();
		document.body.appendChild( this.stats.dom );
	}

	resize(){
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	}

	animate( ) {
		requestAnimationFrame( animate );
		this.stats.update();
		this.renderer.render( this.scene, this.camera );
	}
}

export { App }