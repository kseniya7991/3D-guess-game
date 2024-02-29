import * as THREE from "three";
import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import Stats from "stats-gl";
import "../styles/index.scss";

//Import Sounds
import { playHitSound } from "./Sounds";

// import { throttle } from "./utils";

//Import Lights
import { directionalLight, ambientLight, directionalLightHelper } from "./Lights";

//Import Textures
import { boxTexture, sphereTexture } from "./Textures";

//Import Game
import { initGame } from "./Game";

const game = initGame();
game?.wrap.addEventListener("selectColor", () => {
    resetScene();

    createWallsFromBoxes();
    fillSpheres();
});

/**
 * Debug
 */
const gui = new GUI();
const debugObj = {};

const stats = new Stats();
// append the stats container to the body of the document
document.body.appendChild(stats.dom);

/**
 * Base
 */

const scene = new THREE.Scene();
const canvas = document.querySelector("canvas.webgl");

/**
 * Physics
 */
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

//World Optimization
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

/**
 * Debugger
 */
debugObj.debugger = false;
gui.add(debugObj, "debugger");

const debugOptions = {
    scale: 1,
    onUpdate: (body, mesh) => {
        mesh.visible = debugObj.debugger;
    },
};
const cannonDebugger = CannonDebugger(scene, world, debugOptions);

/**
 * Objects
 */

/**
 * Floor
 */

const floorSize = { width: 20, height: 20 };

//Mesh Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(floorSize.width, floorSize.height),
    new THREE.MeshStandardMaterial({
        color: "#edf5ff",
        metalness: 0.5,
        roughness: 0.5,
    })
);
floor.rotation.set(-Math.PI * 0.5, 0, 0);
floor.receiveShadow = true;
scene.add(floor);

//Physic Floor
const floorShape = new CANNON.Box(new CANNON.Vec3(floorSize.width / 2, 0.01, floorSize.height / 2));
const floorBody = new CANNON.Body({ mass: 0 });
floorBody.addShape(floorShape);
world.addBody(floorBody);

/**
 * Common Materials and Geometries
 */
//Default Materials and Geometries

const spheresColors = [
    {
        name: "green",
        value: new THREE.Color("#18f000"),
    },
    {
        name: "pink",
        value: new THREE.Color("#FFC0CB"),
    },

    {
        name: "blue",
        value: new THREE.Color("#007FFF"),
    },
];

//Materials
const defaultBoxMaterial = new THREE.MeshMatcapMaterial({ matcap: boxTexture });
const defaultSphereBallMaterial = new THREE.MeshMatcapMaterial({ matcap: sphereTexture });
const defaultSpheresMaterial = new THREE.MeshStandardMaterial({
    color: spheresColors[0].value,
    metalness: 0.5,
    roughness: 0.2,
});

//Geometries
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

//Physics Materials
const defaultMaterial = new CANNON.Material("default");
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.2,
    restitution: 0.5,
});

world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

/**
 * Create Scene
 */

let boxSize = { w: 0.5, h: 0.5, d: 0.5 };
let boxesData = [];
let updateObjectsBoxes = [];
let updateObjectsSpheres = [];

/**
 * Create wall
 * @param {*} rows rows
 * @param {*} cols columns
 * @param {*} wallPosition wall position
 */
const createWall = (rows, cols, wallPosition) => {
    let colsCenter = ((cols - 1) / 2) * -1;
    for (let i = 0; i < rows; i++) {
        for (let j = colsCenter; j < -colsCenter + 1; j++) {
            let x = j !== 0 ? boxSize.w * j : 0;
            let z = wallPosition.z;
            if (i % 2 === 0 && j % 2 === 0) {
                z = wallPosition.z + 0.05;
            } else if (i % 2 !== 0 && j % 2 !== 0) {
                z = wallPosition.z + 0.05;
            }
            let xShift = i % 2 === 0 ? -0.1 : 0;
            let position = { x: x + wallPosition.x + xShift, y: boxSize.h * 0.5 + boxSize.h * i, z };
            boxesData.push(position);
        }
    }
};

/**
 * Create a simple box
 * @returns
 */
const createBoxes = (count) => {
    for (let i = 0; i < count; i++) {
        //Mesh
        const boxMesh = new THREE.Mesh(boxGeometry, defaultBoxMaterial);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        boxMesh.scale.set(boxSize.w, boxSize.h, boxSize.d);

        if (!boxesData[i]) return;
        boxMesh.position.set(boxesData[i].x, boxesData[i].y, boxesData[i].z);
        scene.add(boxMesh);

        //Physics
        const shape = new CANNON.Box(new CANNON.Vec3(boxSize.w / 2, boxSize.h / 2, boxSize.d / 2));
        const body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(boxesData[i].x, boxesData[i].y, boxesData[i].z),
            shape,
        });
        world.addBody(body);

        updateObjectsBoxes.push({
            mesh: boxMesh,
            body,
        });
    }
};

/**
 * Create a simple sphere
 * @returns
 */
const createSphere = (position, size, i, mass = 0.1) => {
    const sphereMesh = new THREE.Mesh(sphereGeometry, defaultSpheresMaterial);

    sphereMesh.castShadow = true;
    sphereMesh.scale.set(size, size, size);
    sphereMesh.position.copy(position);
    scene.add(sphereMesh);

    //Physics
    const shape = new CANNON.Sphere(size);
    const body = new CANNON.Body({
        mass,
        position,
        shape,
    });

    if (i % 5 === 0) body.addEventListener("collide", throttlePlaySound);

    updateObjectsSpheres.push({
        mesh: sphereMesh,
        body,
    });
};

/**
 * Created a shot ball with force
 */
let sphereShotBall = null;
const createShotBall = (e) => {
    let targetEl = e.target;
    if (targetEl.closest(".lil-gui")) return;

    //X position
    let mouseX = e.clientX;
    const xPosition = (mouseX * floorSize.width) / canvasSize.width - floorSize.width / 2;
    const size = 0.7;

    let position = { x: xPosition, y: 0.9, z: 5 };

    //Mesh
    const sphereMesh = new THREE.Mesh(sphereGeometry, defaultSphereBallMaterial);
    sphereMesh.castShadow = true;
    sphereMesh.scale.set(size, size, size);
    sphereMesh.position.copy(position);

    sphereMesh.position.z = 5;
    scene.add(sphereMesh);

    //Body
    //Physics
    const shape = new CANNON.Sphere(size);
    const body = new CANNON.Body({
        mass: 50,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape,
    });
    sphereShotBall = body;
    body.applyLocalForce(new CANNON.Vec3(0, 0, -60000), new CANNON.Vec3(0, 0, 0));

    //Detect collide with boxes

    const collideHandler = (event) => {
        let isSphereCollideWithBoxes = updateObjectsBoxes.some((box) => {
            return box.body.id === event.contact.bj.id;
        });

        if (isSphereCollideWithBoxes) {
            body.removeEventListener("collide", collideHandler);
            removeSpringConstraints();
            addSpeheresToWorld();

            game?.checkAnswer(randomColor);
        }
    };

    body.addEventListener("collide", throttlePlayBallSound);
    body.addEventListener("collide", collideHandler);

    world.addBody(body);

    updateObjectsSpheres.push({
        mesh: sphereMesh,
        body,
    });
};

const addSpeheresToWorld = () => {
    for (const obj of updateObjectsSpheres) {
        world.addBody(obj.body);
    }
};

const createWallsFromBoxes = () => {
    let boxCount = 56;

    createWall(4, 5, { x: 0, y: 0, z: 0 });
    createWall(4, 5, { x: 0, y: 0, z: boxSize.d * -3 });
    createWall(4, 1, { x: boxSize.w * -2, y: 0, z: boxSize.d * -1 });
    createWall(4, 1, { x: boxSize.w * -2, y: 0, z: boxSize.d * -2 });
    createWall(4, 1, { x: boxSize.w * 2, y: 0, z: boxSize.d * -1 });
    createWall(4, 1, { x: boxSize.w * 2, y: 0, z: boxSize.d * -2 });
    createBoxes(boxCount);

    createSpringConstraints();
};

/**
 * Sounds
 */
const sounds = [
    new Audio("/sounds/hit.mp3"),
    new Audio("/sounds/hit3.wav"),
    new Audio("/sounds/hit4.mp3"),
    new Audio("/sounds/ball.wav"),
    new Audio("/sounds/golf-ball.wav"),
];

const throttle = (func, ms) => {
    let isThrottled = false,
        savedArgs,
        savedThis;

    function wrapper() {
        if (isThrottled) {
            savedArgs = arguments;
            savedThis = this;
            return;
        }

        func.apply(this, arguments);

        isThrottled = true;

        setTimeout(function () {
            isThrottled = false;
            if (savedArgs) {
                wrapper.apply(savedThis, savedArgs);
                savedArgs = savedThis = null;
            }
        }, ms);
    }

    return wrapper;
};

/**
 * Play Sounds Functions
 * @param {*} collision
 */
/* const playBallSound = (collision) => {
    playHitSound(collision, sphereShotBall, floorBody, true);
}; */
const playSound = (collision, isShotBall = false) => {
    playHitSound(collision, sphereShotBall, floorBody);
};

const throttlePlaySound = (event) => {
    throttle(playSound(event), 30);
};
const throttlePlayBallSound = (event) => {
    throttle(playSound(event, true), 30);
};

/**
 * Constraints
 */
const springConstraints = [];

// Create spring constraints
const createSpringConstraints = () => {
    const springConstant = 0.1;
    const damping = 0.01;

    for (let i = 0; i < updateObjectsBoxes.length; i++) {
        for (let j = i + 1; j < updateObjectsBoxes.length; j++) {
            const bodyA = updateObjectsBoxes[i].body;
            const bodyB = updateObjectsBoxes[j].body;

            const constraint = new CANNON.Spring(bodyA, bodyB, {
                restLength: 0,
                stiffness: springConstant,
                damping: damping,
            });

            springConstraints.push(constraint);
        }
    }
    world.addEventListener("postStep", applySpringForce);
};

//ApplyForce for Contstraints
const applySpringForce = () => {
    for (const constraint of springConstraints) {
        constraint.applyForce();
    }
};

// Remove all Scpring Constraints
const removeSpringConstraints = () => {
    for (const constraint of springConstraints) {
        world.removeEventListener("postStep", applySpringForce);
    }
    // Очистка массива ограничителей пружины
    springConstraints.length = 0;
};

/**
 * Fill spheres in the box
 */
let randomColor = 0;
const fillSpheres = () => {
    const countWidth = 5;
    const countHeight = 6;
    const countDepth = 3;
    const allCount = countWidth * countHeight * countDepth;
    const sphereSize = 0.15;

    // randomColor = Math.round(Math.random() * 2);
    randomColor = 0;
    defaultSpheresMaterial.color = spheresColors[randomColor].value;

    for (let i = 0; i < allCount; i++) {
        let shiftX = sphereSize * 2 - (countWidth / 2) * sphereSize * 2;
        let shiftZ = -0.9;
        let x = -sphereSize + (i % countWidth) * sphereSize * 2;
        let y = sphereSize + Math.floor((i % (countWidth * countHeight)) / countWidth) * sphereSize * 2;
        let z = -sphereSize + Math.floor(i / (countWidth * countHeight)) * sphereSize * 2;

        let position = { x: x + shiftX, y, z: z + shiftZ };
        createSphere(position, sphereSize, i);
    }
};

/**
 * Lights
 */
scene.add(ambientLight, directionalLight, directionalLightHelper);

/**
 * Sizes
 */

const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener("resize", () => {
    //Update Canvas Size
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    //Update Camera
    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    //Update Renderer
    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, canvasSize.width / canvasSize.height, 0.1, 100);
camera.position.set(0, 2, 10);

canvas.addEventListener("click", (e) => {
    createShotBall(e);
});

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
};
/**
 * Render
 */
// @ts-ignore
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setSize(canvasSize.width, canvasSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#edf5ff");

stats.init(renderer);

/**
 * Reset Scene
 */
const resetScene = () => {
    for (const object of updateObjectsBoxes) {
        //Remove body
        object.body.removeEventListener("collide", throttlePlaySound);
        object.body.removeEventListener("collide", throttlePlayBallSound);
        world.removeBody(object.body);

        //Remove mesh
        scene.remove(object.mesh);
    }
    for (const object of updateObjectsSpheres) {
        //Remove body
        object.body.removeEventListener("collide", throttlePlaySound);
        object.body.removeEventListener("collide", throttlePlayBallSound);
        world.removeBody(object.body);
        //Remove mesh
        scene.remove(object.mesh);
    }

    updateObjectsBoxes = [];
    updateObjectsSpheres = [];
};

/**
 * Animate
 */

const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    //Update Physics
    world.step(1 / 60, deltaTime, 3);

    for (const object of updateObjectsBoxes) {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
    }
    for (const object of updateObjectsSpheres) {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
    }

    //Update Debugger
    cannonDebugger.update();

    //Update Controls
    controls.update();

    //Renderer
    renderer.render(scene, camera);

    //Update Stats
    stats.update();

    window.requestAnimationFrame(tick);
};

tick();
