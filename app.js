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
		
		// Setting up the scene

		const scene = new THREE.Scene();

		// Setting up the camera

		const camera = new THREE.PerspectiveCamera(
			75,	// FOV
			window.innerWidth / window.innerHeight,	// Aspect Ratio
			0.1,	// Nearest plane
			1000	// Farthest plane
		);

		// Setting up the renderer

		const renderer = new THREE.WebGLRenderer;
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		// Setting up a test geometry
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshBasicMaterial( { color: 0x00FF00 } );
		const mesh = new THREE.Mesh( geometry, material );
		scene.add( mesh );

		cmaera.position.z = -1.6;

		function animate(){
			requestAnimationFrame( animate );

			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;

			renderer.render( scene, camera );
		}
		animate();
	}
}

export { App }