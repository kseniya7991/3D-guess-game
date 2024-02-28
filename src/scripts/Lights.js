import * as THREE from "three";

//Abmient Light
export const ambientLight = new THREE.AmbientLight(0xffffff, 1);

//Directional Light
export const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024 * 2, 1024 * 2);
directionalLight.shadow.camera.far = 28;
directionalLight.shadow.camera.near = 2;
directionalLight.shadow.camera.left = -12;
directionalLight.shadow.camera.right = 12;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.bottom = -8;

export const directionalLightHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
directionalLightHelper.visible = false;
