class PhysicsRenderer {
    constructor(aVertexShader, aFragmentShader, vVertexShader, vFragmentShader) {
        this.length = 0;
        this.aScene = new THREE.Scene();
        this.vScene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
        this.option = {
            type: THREE.FloatType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter
        };
        this.acceleration = [
            new THREE.WebGLRenderTarget(length, length, this.option),
            new THREE.WebGLRenderTarget(length, length, this.option),
        ];
        this.velocity = [
            new THREE.WebGLRenderTarget(length, length, this.option),
            new THREE.WebGLRenderTarget(length, length, this.option),
        ];
        this.aUniforms = {
            resolution: {
                type: 'v2',
                value: new THREE.Vector2(window.innerWidth, window.innerHeight),
            },
            velocity: {
                type: 't',
                value: null,
            },
            acceleration: {
                type: 't',
                value: null,
            },
            time: {
                type: 'f',
                value: 0
            }
        };
        this.vUniforms = {
            resolution: {
                type: 'v2',
                value: new THREE.Vector2(window.innerWidth, window.innerHeight),
            },
            velocity: {
                type: 't',
                value: null,
            },
            acceleration: {
                type: 't',
                value: null,
            },
            time: {
                type: 'f',
                value: 0
            }
        };
        this.accelerationMesh = this.createMesh(
            this.aUniforms,
            aVertexShader,
            aFragmentShader
        );
        this.velocityMesh = this.createMesh(
            this.vUniforms,
            vVertexShader,
            vFragmentShader
        );
        this.uvs = [];
        this.targetIndex = 0;
    }
    init(renderer, velocityArrayBase) {
        this.length = Math.ceil(Math.sqrt(velocityArrayBase.length / 3));
        const velocityArray = [];
        for (var i = 0; i < Math.pow(this.length, 2) * 3; i += 3) {
            if(velocityArrayBase[i] != undefined) {
                velocityArray[i + 0] = velocityArrayBase[i + 0];
                velocityArray[i + 1] = velocityArrayBase[i + 1];
                velocityArray[i + 2] = velocityArrayBase[i + 2];
                this.uvs[i / 3 * 2 + 0] = (i / 3) % this.length / (this.length - 1);
                this.uvs[i / 3 * 2 + 1] = Math.floor((i / 3) / this.length) / (this.length - 1);
            } else {
                velocityArray[i + 0] = 0;
                velocityArray[i + 1] = 0;
                velocityArray[i + 2] = 0;
            }
        }
        const velocityInitTex = new THREE.DataTexture(new Float32Array(velocityArray), this.length, this.length, THREE.RGBFormat, THREE.FloatType);
        velocityInitTex.needsUpdate = true;
        const velocityInitMesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2, 2),
            new THREE.ShaderMaterial({
                uniforms: {
                    velocity: {
                        type: 't',
                        value: velocityInitTex,
                    },
                },
                vertexShader: document.getElementById('vs-physics-renderer').textContent,
                fragmentShader: document.getElementById('fs-physics-renderer-velocity-init').textContent,
            })
        );
        for (var i = 0; i < 2; i++) {
            this.acceleration[i].setSize(this.length, this.length);
            this.velocity[i].setSize(this.length, this.length);
        }
        this.vScene.add(this.camera);
        this.vScene.add(velocityInitMesh);
        renderer.render(this.vScene, this.camera, this.velocity[0]);
        renderer.render(this.vScene, this.camera, this.velocity[1]);
        this.vScene.remove(velocityInitMesh);
        this.vScene.add(this.velocityMesh);
        this.aScene.add(this.accelerationMesh);
    }
    createMesh(uniforms, vs, fs) {
        return new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2, 2),
            new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: vs,
                fragmentShader: fs,
            })
        );
    }
    render(renderer, time) {
        const prevIndex = Math.abs(this.targetIndex - 1);
        const nextIndex = this.targetIndex;
        this.aUniforms.acceleration.value = this.acceleration[prevIndex].texture;
        this.aUniforms.velocity.value = this.velocity[nextIndex].texture;
        renderer.render(this.aScene, this.camera, this.acceleration[nextIndex]);
        this.vUniforms.acceleration.value = this.acceleration[nextIndex].texture;
        this.vUniforms.velocity.value = this.velocity[nextIndex].texture;
        renderer.render(this.vScene, this.camera, this.velocity[prevIndex]);
        this.targetIndex = prevIndex;
        this.aUniforms.time.value += time;
        this.vUniforms.time.value += time;
    }
    getBufferAttributeUv() {
        return new THREE.BufferAttribute(new Float32Array(this.uvs), 2);
    }
    getCurrentVelocity() {
        return this.velocity[Math.abs(this.targetIndex - 1)].texture;
    }
    getCurrentAcceleration() {
        return this.acceleration[Math.abs(this.targetIndex - 1)].texture;
    }
    mergeAUniforms(obj) {
        this.aUniforms = Object.assign(this.aUniforms, obj);
    }
    mergeVUniforms(obj) {
        this.vUniforms = Object.assign(this.vUniforms, obj);
    }
    resize(length) {
        this.length = length;
        this.velocity[0].setSize(length, length);
        this.velocity[1].setSize(length, length);
        this.acceleration[0].setSize(length, length);
        this.acceleration[1].setSize(length, length);
    }
}

class Points {
    constructor() {
        this.uniforms = {
            time: {
                type: 'f',
                value: 0
            },
            velocity: {
                type: 't',
                value: null
            },
            acceleration: {
                type: 't',
                value: null
            }
        };
        this.physicsRenderer = null;
        this.vectorTouchMove = new THREE.Vector2(0, 0);
        this.vectorTouchMoveDiff = new THREE.Vector2(0, 0);
        this.obj = null;
    }
    init(renderer) {
        this.obj = this.createObj(renderer);
    }
    createObj(renderer) {
        const detail = (window.innerWidth > 768) ? 7 : 6;
        const geometry = new THREE.OctahedronBufferGeometry(400, detail);
        const verticesBase = geometry.attributes.position.array;
        const vertices = [];
        for (var i = 0; i < verticesBase.length; i+= 3) {
            vertices[i + 0] = verticesBase[i + 0] + (Math.random() * 2 - 1) * 400;
            vertices[i + 1] = verticesBase[i + 1] + (Math.random() * 2 - 1) * 400;
            vertices[i + 2] = verticesBase[i + 2] + (Math.random() * 2 - 1) * 400;
        }
        this.physicsRenderer = new PhysicsRenderer(
            document.getElementById('vs-physics-renderer').textContent,
            document.getElementById('fs-physics-renderer-acceleration').textContent,
            document.getElementById('vs-physics-renderer').textContent,
            document.getElementById('fs-physics-renderer-velocity').textContent,
        );
        this.physicsRenderer.init(renderer, vertices);
        this.physicsRenderer.mergeAUniforms({
            vTouchMove: {
                type: 'v2',
                value: this.vectorTouchMoveDiff
            }
        });
        this.uniforms.velocity.value = this.physicsRenderer.getCurrentVelocity();
        this.uniforms.acceleration.value = this.physicsRenderer.getCurrentAcceleration();
        geometry.addAttribute('uvVelocity', this.physicsRenderer.getBufferAttributeUv());
        return new THREE.Points(
            geometry,
            new THREE.RawShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: document.getElementById('vs-points').textContent,
                fragmentShader: document.getElementById('fs-points').textContent,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        )
    }
    render(renderer, time) {
        this.physicsRenderer.render(renderer, time);
        this.uniforms.time.value += time;
    }
    touchStart(v) {
        this.vectorTouchMove.copy(v);
    }
    touchMove(v) {
        this.vectorTouchMoveDiff.set(
            v.x - this.vectorTouchMove.x,
            v.y - this.vectorTouchMove.y
        );
        this.vectorTouchMove.copy(v);
    }
    touchEnd() {
        this.vectorTouchMove.set(0, 0);
        this.vectorTouchMoveDiff.set(0, 0);
    }
}

class ConsoleSignature {
    constructor() {
        this.message = `created by yoichi kobayashi`;
        this.url = `http://www.tplh.net`;
        this.show();
    }
    show() {
        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
            const args = [
                `\n%c ${this.message} %c%c ${this.url} \n\n`,
                'color: #fff; background: #222; padding:3px 0;',
                'padding:3px 1px;',
                'color: #fff; background: #47c; padding:3px 0;',
            ];
            console.log.apply(console, args);
        } else if (window.console) {
            console.log(`${this.message} ${this.url}`);
        }
    }
}

const normalizeVector2 = function(vector) {
    vector.x = (vector.x / window.innerWidth) * 2 - 1;
    vector.y = - (vector.y / window.innerHeight) * 2 + 1;
};

const debounce = function(callback, duration) {
    var timer;
    return function(event) {
        clearTimeout(timer);
        timer = setTimeout(function(){
            callback(event);
        }, duration);
    };
}

const canvas = document.getElementById('canvas-webgl');
const renderer = new THREE.WebGLRenderer({
    antialias: false,
    canvas: canvas,
});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
const clock = new THREE.Clock();

const vectorTouchStart = new THREE.Vector2();
const vectorTouchMove = new THREE.Vector2();
const vectorTouchEnd = new THREE.Vector2();
let isDrag = false;

const consoleSignature = new ConsoleSignature();

//
// process for this sketch.
//

const points = new Points();
points.init(renderer);

//
// common process
//
const resizeWindow = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
const render = () => {
    const time = clock.getDelta();
    points.render(renderer, time);
    renderer.render(scene, camera);
}
const renderLoop = () => {
    render();
    requestAnimationFrame(renderLoop);
}
const touchStart = (isTouched) => {
    isDrag = true;
    points.touchStart(vectorTouchStart);
};
const touchMove = (isTouched) => {
    if (isDrag) points.touchMove(vectorTouchMove);
};
const touchEnd = (isTouched) => {
    isDrag = false;
    points.touchEnd();
};
const mouseOut = () => {
    isDrag = false;
    points.touchEnd();
};
const on = () => {
    window.addEventListener('resize', debounce(() => {
        resizeWindow();
    }), 1000);
    canvas.addEventListener('mousedown', function (event) {
        event.preventDefault();
        vectorTouchStart.set(event.clientX, event.clientY);
        normalizeVector2(vectorTouchStart);
        touchStart(false);
    });
    canvas.addEventListener('mousemove', function (event) {
        event.preventDefault();
        vectorTouchMove.set(event.clientX, event.clientY);
        normalizeVector2(vectorTouchMove);
        touchMove(false);
    });
    canvas.addEventListener('mouseup', function (event) {
        event.preventDefault();
        vectorTouchEnd.set(event.clientX, event.clientY);
        normalizeVector2(vectorTouchEnd);
        touchEnd(false);
    });
    canvas.addEventListener('touchstart', function (event) {
        event.preventDefault();
        vectorTouchStart.set(event.touches[0].clientX, event.touches[0].clientY);
        normalizeVector2(vectorTouchStart);
        touchStart(event.touches[0].clientX, event.touches[0].clientY, true);
    });
    canvas.addEventListener('touchmove', function (event) {
        event.preventDefault();
        vectorTouchMove.set(event.touches[0].clientX, event.touches[0].clientY);
        normalizeVector2(vectorTouchMove);
        touchMove(true);
    });
    canvas.addEventListener('touchend', function (event) {
        event.preventDefault();
        normalizeVector2(vectorTouchEnd);
        vectorTouchEnd.set(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        touchEnd(true);
    });
    window.addEventListener('mouseout', function () {
        event.preventDefault();
        vectorTouchEnd.set(0, 0);
        mouseOut();
    });
}

const init = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x111111, 1.0);
    camera.position.set(0, 0, 1000);
    camera.lookAt(new THREE.Vector3());

    scene.add(points.obj);

    on();
    resizeWindow();
    renderLoop();
}
init();
