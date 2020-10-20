import * as THREE from './Library/THREE/three.module.js';
import { OrbitControls } from './Library/THREE/jsm/OrbitControls.js';

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        window.addEventListener('resize', this.resize.bind(this));
    }

    resize() {

    }

    render() {

    }
}
export { App };