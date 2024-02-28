import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();

const boxTexture = textureLoader.load("/matcaps/box.png");
const sphereTexture = textureLoader.load("/matcaps/sphere.png");

boxTexture.colorSpace = THREE.SRGBColorSpace;
sphereTexture.colorSpace = THREE.SRGBColorSpace;

export { boxTexture, sphereTexture };
