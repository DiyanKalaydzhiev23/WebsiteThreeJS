import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

let moveX = 0;
let moveZ = 0;
let moveAngle = 0;

// Joystick Initialization
const joystickOptions = {
    zone: document.getElementById('joystickContainer'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    size: 150,
    color: 'blue'
};

const manager = nipplejs.create(joystickOptions);
const MAX_FORCE = 3.10;
let dataForce = 0;


manager.on('move', function (evt, data) {
    dataForce = data.force;

    if (dataForce > MAX_FORCE) {
        dataForce = MAX_FORCE;
    }

    moveX = Math.cos(data.angle.radian) * dataForce * 0.02;
    moveZ = Math.sin(data.angle.radian) * dataForce * 0.02;

    moveAngle = data.angle.radian + Math.PI/2;
});

manager.on('end', function () {
    moveX = 0;
    moveZ = 0;
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
scene.add(plane);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

camera.position.y = 5;
camera.position.z = 10;
camera.lookAt(0, 0, 0);

// Load the GLB human model
let human;
let leftArm, rightArm, leftUpLeg, rightUpLeg, leftLeg, rightLeg;

const loader = new GLTFLoader();
loader.load('./humanModel.glb', function (gltf) {
    human = gltf.scene;
    human.position.y = 0.5;
    scene.add(human);

    // Assigning bones to respective variables
    leftArm = human.getObjectByName('LeftArm');
    rightArm = human.getObjectByName('RightArm');
    leftUpLeg = human.getObjectByName('LeftUpLeg');
    rightUpLeg = human.getObjectByName('RightUpLeg');
    leftLeg = human.getObjectByName('LeftLeg');
    rightLeg = human.getObjectByName('RightLeg');
});

let walkPhase = 0;

function animate() {
    plane.position.x -= moveX;
    plane.position.z += moveZ;

    if (human) {
        human.rotation.y = moveAngle;

        if (moveX || moveZ) {
            walkPhase += 0.2 * dataForce / 4;

            const armSwing = -Math.sin(walkPhase) * 0.2;
            const legSwing = Math.sin(walkPhase) * 0.2; // Adjusted as per your last snippet

            // Adjust the arms to swing forward and backward
            leftArm.rotation.z = armSwing; // Changed to y-axis
            rightArm.rotation.z = armSwing; // Changed to y-axis

            leftUpLeg.rotation.x = -legSwing + 0.1;
            rightUpLeg.rotation.x = legSwing + 0.1;

            leftLeg.rotation.x = legSwing;
            rightLeg.rotation.x = -legSwing;

        } else {
            // Reset rotations when not moving
            leftArm.rotation.y = 0; // Changed to y-axis
            rightArm.rotation.y = 0; // Changed to y-axis

            leftUpLeg.rotation.x = 0;
            rightUpLeg.rotation.x = 0;

            // Increase the backward swing for legs when at rest
            leftLeg.rotation.x = -0.2;
            rightLeg.rotation.x = -0.2;
        }
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();