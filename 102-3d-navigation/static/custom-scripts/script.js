// import './style.css'
// import * as THREE from 'three'
// import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
// // import * as dat from 'dat.gui'
// let vertex = document.getElementById("vertex").textContent;
// let fragment = document.getElementById("fragment").textContent;
// import testVertexShader from '../shaders/vertex.glsl'
// import testFragmentShader from '../shaders/fragment.glsl'

// import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118.3/build/three.module.js";
// import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.118.3/examples/jsm/controls/OrbitControls.js";

/**
 * Base
 */
// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
// const flagTexture = textureLoader.load('/textures/flag-french.jpg')
// const flagTexture = textureLoader.load('/textures/1.jpg')
const flagTexture = textureLoader.load('../static/textures/flag-french.jpg')

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneBufferGeometry(2, 1, 64, 64)
// const geometry = new THREE.BoxBufferGeometry(1,1,1)
// const geometry = new THREE.TorusGeometry(1,0.5,16,12)

// Customize
const count = geometry.attributes.position.count
const randoms = new Float32Array(count)
for (let i = 0; i < count; i++) {
    randoms[i] = Math.random()
    // randoms[i] = Math.sin(i) / 2 + 0.5
}
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

// Material
// const material = new THREE.RawShaderMaterial({
const material = new THREE.ShaderMaterial({
    vertexShader: testVertexShader,
    // vertexShader: vertex,
    fragmentShader: testFragmentShader,
    // fragmentShader: fragment,
    // wireframe: true,
    // transparent: true,
    uniforms: {
        uFrequency: {value: new THREE.Vector2(50, 50)},
        uTime: {value: 0},
        uColor: {value: new THREE.Color('orange')},
        uTexture: {value: flagTexture},
    },
})
// gui.add(material.uniforms.uFrequency.value, 'x').min(50).max(100).step(1.0).name('frequencyX')
// gui.add(material.uniforms.uFrequency.value, 'y').min(50).max(100).step(1.0).name('frequencyY')

// Mesh
const mesh = new THREE.Mesh(geometry, material)
// mesh.scale.y = 2 / 3
scene.add(mesh)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0.5, 0.5, 1)
scene.add(camera)

// Controls
// const controls = new THREE.OrbitControls(camera, canvas);
const controls = new OrbitControls(camera, canvas)

controls.enableDamping = true

let aabb = new THREE.Box3().setFromObject( mesh );
let center = aabb.getCenter( new THREE.Vector3() );
let size = aabb.getSize( new THREE.Vector3() );

gsap.to( camera.position, {
    duration: 3,
    x: center.x,
    y: center.y,
    z: center.z + size.z,
    yoyo: true,
    onUpdate: function() {
        camera.lookAt( center );
    }
} );

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update material
    material.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
