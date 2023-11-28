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

    moveAngle = data.angle.radian + Math.PI / 2;
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
const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00, // Green color
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0 // Adjust the opacity as needed, 0.5 is 50% transparent
});
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

let cityModel;
let cityObjects = []; // Array to hold mesh objects for collision detection

loader.load('./low_poly_city.glb', function (gltf) {
    cityModel = gltf.scene;
    scene.add(cityModel);

    // Traverse the city model and collect mesh objects, excluding the floor
    cityModel.traverse(function (object) {
        console.log(object.name, object.geometry?.boundingBox.max.x);
        if (object.isMesh && object.name !== 'Pavimento_Colore_0') {
            // Add objects to cityObjects if they're not the floor
            cityObjects.push(object);
        }
    });

    // Now create bounding boxes
    cityBoundingBoxes = cityObjects.map(object => new THREE.Box3().setFromObject(object));

    // Other setup code...
}, undefined, function (error) {
    console.error('An error happened while loading the model:', error);
});



let walkPhase = 0;

// Assuming cityObjects is an array of meshes in your city model
let cityBoundingBoxes = cityObjects.map(object => new THREE.Box3().setFromObject(object));

function checkCollision(newPosition) {
    let humanBoundingBox = new THREE.Box3().setFromObject(human);
    humanBoundingBox.min.y += newPosition.y + 16; // Adjust the Y position of the bounding box
    humanBoundingBox.max.y += newPosition.y;

    for (let box of cityBoundingBoxes) {
        if (humanBoundingBox.intersectsBox(box)) {
            console.log(box);
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function animate() {
    // Calculate the new position but don't update it yet

    if (human) {
        let newPosition = {
            x: human.position.x - moveX,
            y: human.position.y, // Assuming Y is your height axis
            z: human.position.z + moveZ
        };

        if (!checkCollision(newPosition)) {
            if (cityModel) {
                cityModel.position.x -= moveX;
                cityModel.position.z += moveZ;
            }
        }
        
        human.rotation.y = moveAngle;

        if (moveX || moveZ) {
            walkPhase += 0.2 * dataForce / 4;

            const armSwing = -Math.sin(walkPhase) * 0.2;
            const legSwing = Math.sin(walkPhase) * 0.2;

            // Adjust the arms to swing forward and backward
            leftArm.rotation.z = armSwing;
            rightArm.rotation.z = armSwing;

            leftUpLeg.rotation.x = -legSwing + 0.1;
            rightUpLeg.rotation.x = legSwing + 0.1;

            leftLeg.rotation.x = legSwing;
            rightLeg.rotation.x = -legSwing;

        } else {
            // Reset rotations when not moving
            leftArm.rotation.y = 0;
            rightArm.rotation.y = 0;

            leftUpLeg.rotation.x = 0;
            rightUpLeg.rotation.x = 0;

            leftLeg.rotation.x = -0.2;
            rightLeg.rotation.x = -0.2;
        }
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
