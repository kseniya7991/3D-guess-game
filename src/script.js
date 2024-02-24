import * as THREE from "three";
import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import Stats from "stats-gl";

/**
 * Debug
 */
const gui = new GUI();

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

//Optimization
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

world.gravity.set(0, -9.82, 0);

const cannonDebugger = CannonDebugger(scene, world, {
    scale: 1,
});

/**
 * Textures
 */

/**
 * Objects
 */

//Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        metalness: 0.5,
        roughness: 0.5,
    })
);
floor.rotation.set(-Math.PI * 0.5, 0, 0);
floor.receiveShadow = true;
scene.add(floor);

//Physic Floor
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body();
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

//Sphere
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({
        color: "#88dafc",
        metalness: 0,
        roughness: 0,
    })
);

sphere.castShadow = true;
sphere.position.set(0, 0.5, 0);

// scene.add(sphere);

//Default Materials and Geometries
const defaultMeshMaterial = new THREE.MeshStandardMaterial({
    color: "#b0b0b0",
    metalness: 0.5,
    roughness: 0.2,
});
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

//Physics Materials
const defaultMaterial = new CANNON.Material("default");
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 1,
    restitution: 0.5,
});

world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

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
            let position = { x: x + wallPosition.x + xShift, y: boxSize.h * 0.5 + 0.2 + boxSize.h * i, z };
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
        const boxMesh = new THREE.Mesh(boxGeometry, defaultMeshMaterial);
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

const sphereSize = 1;

/**
 * Create a simple sphere
 * @returns
 */
const createSphere = (position) => {
    const sphereMesh = new THREE.Mesh(sphereGeometry, defaultMeshMaterial);
    sphereMesh.castShadow = true;
    sphereMesh.scale.set(sphereSize, sphereSize, sphereSize);
    sphereMesh.position.copy(position);
    scene.add(sphereMesh);

    //Physics
    const shape = new CANNON.Sphere(sphereSize);
    const body = new CANNON.Body({
        mass: 1000,
        position,
        shape,
    });
    world.addBody(body);

    let isSphereCollideWithBoxes = false;
    const collideHandler = (event) => {
        let isSphereCollideWithBoxes = updateObjectsBoxes.some((box) => {
            return box.body.id === event.contact.bj.id;
        });

        console.log("Шар столкнулся с боксами");

        if (isSphereCollideWithBoxes) {
            // Условие выполнено, удаляем слушатель
            body.removeEventListener("collide", collideHandler);
            removeSpringConstraints();
        }
    };

    body.addEventListener("collide", collideHandler);

    updateObjectsSpheres.push({
        mesh: sphereMesh,
        body,
    });
};

const createWallsFromBoxes = () => {
    let boxCount = 56;

    createWall(4, 5, { x: 0, y: 0.5, z: 0 });
    createWall(4, 5, { x: 0, y: 0.5, z: boxSize.d * -3 });
    createWall(4, 1, { x: boxSize.w * -2, y: 0.5, z: boxSize.d * -1 });
    createWall(4, 1, { x: boxSize.w * -2, y: 0.5, z: boxSize.d * -2 });
    createWall(4, 1, { x: boxSize.w * 2, y: 0.5, z: boxSize.d * -1 });
    createWall(4, 1, { x: boxSize.w * 2, y: 0.5, z: boxSize.d * -2 });
    createBoxes(boxCount);

    createSpringConstraints();
};

/**
 * Constraints
 */
const springConstraints = [];

// Create spring constraints
const createSpringConstraints = () => {
    const springConstant = 0.1; // Константа пружины
    const damping = 0.00000001; // Параметр демпфирования

    for (let i = 0; i < updateObjectsBoxes.length; i++) {
        for (let j = i + 1; j < updateObjectsBoxes.length; j++) {
            const bodyA = updateObjectsBoxes[i].body;
            const bodyB = updateObjectsBoxes[j].body;

            const constraint = new CANNON.Spring(bodyA, bodyB, {
                restLength: 0, // Длина пружины в покое
                stiffness: springConstant, // Жесткость пружины
                damping: damping, // Демпфирование
            });

            // Добавление ограничителя пружины в массив
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

const fillSpheres = () => {
    let count = 1;

    for (let i = 0; i < count; i++) {
        let position = { x: Math.random() * 0.5, y: 10, z: boxSize.d * -1.5 };
        createSphere(position);
    }
};

createWallsFromBoxes();
fillSpheres();

// Определите столкновение шара с землей
world.addEventListener("collide", (event) => {
    const contact = event.contact; // Получите информацию о контакте

    /*  if (contact.bi.id === ballBody.id || contact.bj.id === ballBody.id) {
      // Шар столкнулся с землей
      console.log('Шар столкнулся с землей');
    } */
});

/**
 * Lights
 */

//Abmient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

//Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.camera.left = -1;
directionalLight.shadow.camera.right = 3;
directionalLight.shadow.camera.top = 2;
directionalLight.shadow.camera.bottom = -2;

const directionalLightHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
directionalLightHelper.visible = false;
scene.add(directionalLight, directionalLightHelper);

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
camera.position.set(0, 3, 7);
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

stats.init(renderer);

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
