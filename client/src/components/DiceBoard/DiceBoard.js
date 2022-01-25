import * as THREE from "three";
import CANNON from "cannon";
import { DiceManager, DiceD6 } from "./Dice";
import { useEffect } from "react";
import OrbitControls from "./OrbitControls";

// standard global variables
var container,
  scene,
  camera,
  renderer,
  controls,
  world,
  dice = [];

// FUNCTIONS
function init() {
  // SCENE
  scene = new THREE.Scene();
  // CAMERA
  var SCREEN_WIDTH = 720,
    SCREEN_HEIGHT = 720;
  var VIEW_ANGLE = 20,
    ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
    NEAR = 1,
    FAR = SCREEN_HEIGHT * 1.3;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0, 100, 0);
  // camera.position.z = SCREEN_HEIGHT
  // RENDERER
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container = document.querySelector(".canvas");
  const canvas = renderer.domElement;
  canvas.style.position = "absolute";
  canvas.classList.add("mx-auto");
  container.appendChild(canvas);
  // EVENTS
  // CONTROLS
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;

  let ambient = new THREE.AmbientLight("#ffffff", 0.3);
  scene.add(ambient);

  let directionalLight = new THREE.DirectionalLight("#ffffff", 0.5);
  directionalLight.position.x = -1000;
  directionalLight.position.y = 1000;
  directionalLight.position.z = 1000;
  scene.add(directionalLight);

  let light = new THREE.SpotLight(0xffffff, 0.5);
  light.position.y = 100;
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  light.shadow.camera.near = 50;
  light.shadow.camera.far = 110;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  scene.add(light);

  // FLOOR
  var floorMaterial = new THREE.MeshPhongMaterial({
    //color: "#00aa00",
    opacity: 0, // todo 0
    depthWrite: false,
    side: THREE.DoubleSide,
    transparent: true,
  });
  var floorGeometry = new THREE.PlaneGeometry(30, 30, 10, 10);
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);
  // SKYBOX/FOG
  /*var skyBoxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
  var skyBoxMaterial = new THREE.MeshPhongMaterial({
    color: 0x9999ff,
    side: THREE.BackSide,
  });
  var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
  scene.add(skyBox);
  scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);*/

  ////////////
  // CUSTOM //
  ////////////
  world = new CANNON.World();

  world.gravity.set(0, -9.82 * 20, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 16;

  DiceManager.setWorld(world);

  //Floor
  let floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: DiceManager.floorBodyMaterial,
  });
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.add(floorBody);

  //Walls

  for (var i = 0; i < 2; i++) {
    var die = new DiceD6({
      size: 2.3,
      backColor: "#000",
      fontColor: "orange",
    });
    scene.add(die.getObject());
    dice.push(die);
  }
  console.log("dice", dice);
  requestAnimationFrame(animate);
}

export function randomDiceThrow(value0, value1) {
  for (var i = 0; i < dice.length; i++) {
    let yRand = Math.random() * 20;
    dice[i].getObject().position.x = -15 - (i % 3) * 1.5;
    dice[i].getObject().position.y = 2 + Math.floor(i / 3) * 1.5;
    dice[i].getObject().position.z = -15 + (i % 3) * 1.5;
    dice[i].getObject().quaternion.x =
      ((Math.random() * 90 - 45) * Math.PI) / 180;
    dice[i].getObject().quaternion.z =
      ((Math.random() * 90 - 45) * Math.PI) / 180;
    dice[i].updateBodyFromMesh();
    let rand = Math.random() * 5;
    dice[i].getObject().body.velocity.set(25 + rand, 25 + yRand, 25 + rand);
    dice[i]
      .getObject()
      .body.angularVelocity.set(
        50 * Math.random() - 10,
        50 * Math.random() - 10,
        50 * Math.random() - 10
      );
  }

  DiceManager.prepareValues([
    { dice: dice[0], value: value0 },
    { dice: dice[1], value: value1 },
  ]);
}

function animate() {
  updatePhysics();
  render();
  update();

  requestAnimationFrame(animate);
}

function updatePhysics() {
  world.step(1.0 / 60.0);

  for (var i in dice) {
    dice[i].updateMeshFromBody();
  }
}

function update() {
  //controls.update();
}

function render() {
  renderer.render(scene, camera);
}

export default function DiceBoard() {
  useEffect(() => {
    const canvas = document.querySelector(".canvas");
    canvas.style.display = "none";
    init();
  }, []);
  return <div className="canvas"></div>;
}
