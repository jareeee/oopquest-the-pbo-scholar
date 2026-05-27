import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const mount = document.getElementById('battle3dScene');
const PLAYER_MODEL_PATH = 'assets/model/minecraft_player_wide_rigged_with_outer_layer/';
const PLAYER_MODEL_FILE = 'scene.gltf';
const MONSTER_MODEL_PATH = 'assets/model/gengar_pokemon/';
const MONSTER_MODEL_FILE = 'scene.gltf';

let renderer;
let scene;
let camera;
let player;
let monster;
let playerHpRing;
let monsterHpRing;
let playerMixer = null;
let monsterMixer = null;
let healParticles = [];
let hitParticles = [];
let fireProjectiles = [];
let blueFireTexture = null;
let redFireTexture = null;
let currentState = null;
let activeAction = null;
let activeActionData = null;
let actionStartedAt = 0;
let lastFrameTime = 0;
let frameCount = 0;
let lastError = null;
let resizeObserver = null;

if (mount) {
    exposeDiagnostics();
    try {
        initScene();
        window.addEventListener('resize', resizeScene);
        if ('ResizeObserver' in window) {
            resizeObserver = new ResizeObserver(resizeScene);
            resizeObserver.observe(mount);
        }
        window.addEventListener('battle-state-updated', handleBattleState);
        requestAnimationFrame(animate);
        setInterval(renderBackgroundFrame, 100);
    } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        mount.innerHTML = `<div class="scene-fallback">Arena 3D gagal dimuat: ${lastError}</div>`;
    }
}

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121821);

    camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 3.85, 9.3);
    camera.lookAt(0, 1.15, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    addLights();
    addArena();

    player = createPlayerModel();
    player.position.set(-2.15, 0, 0);
    scene.add(player);
    loadPlayerModel();

    monster = createGhostMonsterModel();
    monster.position.set(2.15, 0, 0);
    scene.add(monster);
    loadMonsterModel();

    playerHpRing = createHpRing(0x22c55e);
    playerHpRing.position.set(-2.15, 2.8, 0);
    scene.add(playerHpRing);

    monsterHpRing = createHpRing(0xef4444);
    monsterHpRing.position.set(2.15, 2.8, 0);
    scene.add(monsterHpRing);

    resizeScene();
    renderer.render(scene, camera);
    frameCount = 1;
    updateSceneDiagnostics();
}

function loadPlayerModel() {
    mount.dataset.playerModel = 'loading';

    const loader = new GLTFLoader();
    loader.setPath(PLAYER_MODEL_PATH);
    loader.load(
        PLAYER_MODEL_FILE,
        (gltf) => {
            const externalPlayer = createExternalCharacterModel(gltf, 2.1, 0, 0);
            externalPlayer.position.set(-2.15, 0, 0);

            scene.remove(player);
            player = externalPlayer;
            scene.add(player);

            playerMixer = null;

            mount.dataset.playerModel = 'gltf';
            mount.dataset.lastError = '';
            lastError = null;
            updateSceneDiagnostics();
        },
        undefined,
        (error) => {
            lastError = error instanceof Error ? error.message : String(error);
            mount.dataset.playerModel = 'fallback';
            mount.dataset.lastError = lastError;
        }
    );
}

function loadMonsterModel() {
    mount.dataset.monsterModel = 'loading';

    const loader = new GLTFLoader();
    loader.setPath(MONSTER_MODEL_PATH);
    loader.load(
        MONSTER_MODEL_FILE,
        (gltf) => {
            const externalMonster = createExternalCharacterModel(gltf, 2.45, 0, 0);
            externalMonster.position.set(2.15, 0, 0);

            scene.remove(monster);
            monster = externalMonster;
            scene.add(monster);

            if (gltf.animations && gltf.animations.length > 0) {
                monsterMixer = new THREE.AnimationMixer(monster.userData.model);
                gltf.animations.forEach((clip) => monsterMixer.clipAction(clip).play());
            }

            mount.dataset.monsterModel = 'gltf';
            mount.dataset.lastError = '';
            lastError = null;
            updateSceneDiagnostics();
        },
        undefined,
        (error) => {
            lastError = error instanceof Error ? error.message : String(error);
            mount.dataset.monsterModel = 'fallback';
            mount.dataset.lastError = lastError;
        }
    );
}

function createExternalCharacterModel(gltf, targetHeight, rotationY, rotationX) {
    const group = new THREE.Group();
    const model = gltf.scene;

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material && 'roughness' in child.material) {
                child.material.roughness = Math.min(0.85, child.material.roughness + 0.12);
            }
        }
    });

    model.rotation.set(rotationX, rotationY, 0);
    normalizeModel(model, targetHeight);
    group.add(model);

    group.userData.baseY = 0;
    group.userData.baseScale = 1;
    group.userData.isExternalModel = true;
    group.userData.model = model;
    return group;
}

function normalizeModel(model, targetHeight) {
    model.updateMatrixWorld(true);
    const initialBox = new THREE.Box3().setFromObject(model);
    const initialSize = new THREE.Vector3();
    initialBox.getSize(initialSize);

    const scale = targetHeight / Math.max(initialSize.y, 0.001);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    model.position.x -= scaledCenter.x;
    model.position.y -= scaledBox.min.y;
    model.position.z -= scaledCenter.z;
}

function addLights() {
    const ambient = new THREE.HemisphereLight(0xe0f2fe, 0x111827, 1.55);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.7);
    key.position.set(-3.8, 5.8, 4.8);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    scene.add(key);

    const blueRim = new THREE.PointLight(0x38bdf8, 18, 11);
    blueRim.position.set(-2.7, 2.4, 2.6);
    scene.add(blueRim);

    const redRim = new THREE.PointLight(0xef4444, 10, 9);
    redRim.position.set(2.8, 2.0, 2.3);
    scene.add(redRim);
}

function addArena() {
    const floorGeometry = new THREE.CylinderGeometry(4.45, 4.45, 0.28, 96);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x243142,
        roughness: 0.86,
        metalness: 0.08
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.18;
    floor.receiveShadow = true;
    scene.add(floor);

    const innerDisk = new THREE.Mesh(
        new THREE.CylinderGeometry(3.55, 3.55, 0.035, 96),
        new THREE.MeshStandardMaterial({
            color: 0x2f3f53,
            roughness: 0.82,
            metalness: 0.06
        })
    );
    innerDisk.position.y = 0.01;
    innerDisk.receiveShadow = true;
    scene.add(innerDisk);

    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5c451,
        emissive: 0x6b4f12,
        emissiveIntensity: 0.45
    });

    addArenaRing(4.12, 0.055, ringMaterial, 0.08);
    addArenaRing(3.18, 0.025, ringMaterial, 0.095);
    addArenaRing(1.0, 0.018, ringMaterial, 0.11);

    const dividerMaterial = createMaterial(0x38bdf8, 0.4, 0.18, 0x0ea5e9, 0.5);
    for (let i = 0; i < 4; i++) {
        const divider = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.025, 0.035), dividerMaterial);
        divider.position.set(Math.cos(i * Math.PI / 2) * 1.95, 0.13, Math.sin(i * Math.PI / 2) * 1.95);
        divider.rotation.y = -i * Math.PI / 2;
        scene.add(divider);
    }
}

function addArenaRing(radius, thickness, material, y) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 10, 128), material);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    scene.add(ring);
}

function createPlayerModel() {
    const group = new THREE.Group();
    const skin = createMaterial(0xf4c7a1, 0.52, 0.05);
    const robeBlue = createMaterial(0x1d4ed8, 0.62, 0.08);
    const robeDark = createMaterial(0x172554, 0.7, 0.05);
    const leather = createMaterial(0x4b2f1d, 0.72, 0.04);
    const gold = createMaterial(0xf5c451, 0.32, 0.25, 0x5f440a, 0.18);
    const hairMat = createMaterial(0x2a170d, 0.65, 0.04);
    const clothWhite = createMaterial(0xe0f2fe, 0.55, 0.04);

    const legs = new THREE.Group();
    const leftBoot = addMesh(legs, new THREE.CapsuleGeometry(0.13, 0.42, 8, 14), leather, [-0.18, 0.28, 0.02], [0, 0, 0]);
    leftBoot.scale.set(0.85, 1, 0.95);
    const rightBoot = leftBoot.clone();
    rightBoot.position.x = 0.18;
    legs.add(rightBoot);
    group.add(legs);

    const robe = addMesh(group, new THREE.CylinderGeometry(0.36, 0.55, 1.2, 18), robeBlue, [0, 0.93, 0], [0, 0, 0]);
    robe.castShadow = true;
    robe.scale.z = 0.82;

    const torso = addMesh(group, new THREE.CapsuleGeometry(0.38, 0.62, 10, 18), robeBlue, [0, 1.32, 0.02], [0, 0, 0]);
    torso.scale.set(0.88, 1.0, 0.72);

    const sash = addMesh(group, new THREE.BoxGeometry(0.82, 0.11, 0.08), gold, [0, 1.16, 0.32], [0, 0, 0]);
    sash.rotation.z = -0.08;

    const collar = addMesh(group, new THREE.CylinderGeometry(0.36, 0.42, 0.18, 18), clothWhite, [0, 1.72, 0.02], [0, 0, 0]);
    collar.scale.z = 0.72;

    const head = addMesh(group, new THREE.SphereGeometry(0.32, 32, 20), skin, [0, 2.08, 0.03], [0, 0, 0]);
    head.scale.set(0.92, 1.05, 0.88);

    const hair = addMesh(group, new THREE.SphereGeometry(0.335, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, [0, 2.2, 0.01], [0, 0, 0]);
    hair.scale.set(0.98, 0.64, 0.92);

    const eyeMat = createMaterial(0x111827, 0.35, 0.05);
    addMesh(group, new THREE.SphereGeometry(0.035, 10, 8), eyeMat, [-0.105, 2.1, 0.3], [0, 0, 0]);
    addMesh(group, new THREE.SphereGeometry(0.035, 10, 8), eyeMat, [0.105, 2.1, 0.3], [0, 0, 0]);
    addMesh(group, new THREE.BoxGeometry(0.12, 0.018, 0.025), createMaterial(0xb45309, 0.5, 0.02), [0, 2.0, 0.31], [0, 0, 0]);

    const hatBrim = addMesh(group, new THREE.CylinderGeometry(0.47, 0.5, 0.055, 32), robeDark, [0, 2.38, 0.0], [0.02, 0, 0]);
    hatBrim.scale.z = 0.78;
    const hatTop = addMesh(group, new THREE.ConeGeometry(0.34, 0.58, 32), gold, [0, 2.72, 0], [0, 0, 0]);
    hatTop.scale.z = 0.82;
    addMesh(group, new THREE.TorusGeometry(0.27, 0.018, 8, 40), robeDark, [0, 2.52, 0.0], [Math.PI / 2, 0, 0]);

    const leftArm = addMesh(group, new THREE.CapsuleGeometry(0.09, 0.58, 8, 12), robeBlue, [-0.5, 1.43, 0.05], [0, 0, 0.45]);
    const rightArm = addMesh(group, new THREE.CapsuleGeometry(0.09, 0.58, 8, 12), robeBlue, [0.5, 1.43, 0.05], [0, 0, -0.55]);
    const leftHand = addMesh(group, new THREE.SphereGeometry(0.09, 12, 8), skin, [-0.72, 1.18, 0.08], [0, 0, 0]);
    const rightHand = addMesh(group, new THREE.SphereGeometry(0.09, 12, 8), skin, [0.72, 1.16, 0.1], [0, 0, 0]);

    const book = addMesh(group, new THREE.BoxGeometry(0.34, 0.24, 0.08), createMaterial(0x7f1d1d, 0.72, 0.06), [-0.69, 1.22, 0.28], [0.2, -0.18, -0.08]);
    addMesh(group, new THREE.BoxGeometry(0.28, 0.18, 0.018), createMaterial(0xfef3c7, 0.65, 0.02), [-0.69, 1.225, 0.33], [0.2, -0.18, -0.08]);

    const wand = addMesh(group, new THREE.CylinderGeometry(0.025, 0.035, 1.05, 14), createMaterial(0xdbeafe, 0.28, 0.35), [0.88, 1.56, 0.12], [0.18, 0.08, -0.58]);
    const orb = addMesh(group, new THREE.SphereGeometry(0.12, 24, 14), createMaterial(0x38bdf8, 0.18, 0.2, 0x0ea5e9, 1.45), [1.12, 1.98, 0.16], [0, 0, 0]);

    const cape = addMesh(group, new THREE.BoxGeometry(0.76, 1.0, 0.035), createMaterial(0x0f172a, 0.82, 0.03), [0, 1.16, -0.34], [-0.12, 0, 0]);
    cape.castShadow = true;

    group.userData.baseY = 0;
    group.userData.baseScale = 1;
    group.userData.parts = { robe, head, orb, leftArm, rightArm, leftHand, rightHand, book, cape };
    return group;
}

function createMonsterModel() {
    const group = new THREE.Group();
    const bodyMat = createMaterial(0x5b21b6, 0.62, 0.12);
    const bellyMat = createMaterial(0x8b5cf6, 0.58, 0.08);
    const darkMat = createMaterial(0x2e1065, 0.7, 0.06);
    const hornMat = createMaterial(0xe5e7eb, 0.36, 0.18);
    const clawMat = createMaterial(0xfb7185, 0.45, 0.12, 0x7f1d1d, 0.2);
    const eyeMaterial = createMaterial(0xfef3c7, 0.18, 0.2, 0xf59e0b, 1.25);

    const body = addMesh(group, new THREE.SphereGeometry(0.72, 36, 22), bodyMat, [0, 0.94, 0], [0, 0, 0]);
    body.scale.set(1.05, 1.18, 0.86);

    const belly = addMesh(group, new THREE.SphereGeometry(0.46, 28, 18), bellyMat, [0, 0.78, 0.38], [0, 0, 0]);
    belly.scale.set(1.0, 1.05, 0.22);

    const head = addMesh(group, new THREE.SphereGeometry(0.48, 32, 20), bodyMat, [0, 1.78, 0.06], [0, 0, 0]);
    head.scale.set(1.05, 0.88, 0.92);

    const snout = addMesh(group, new THREE.SphereGeometry(0.22, 20, 12), darkMat, [0, 1.68, 0.44], [0, 0, 0]);
    snout.scale.set(1.45, 0.55, 0.55);

    const leftEye = addMesh(group, new THREE.SphereGeometry(0.085, 16, 10), eyeMaterial, [-0.18, 1.86, 0.43], [0, 0, 0]);
    const rightEye = addMesh(group, new THREE.SphereGeometry(0.085, 16, 10), eyeMaterial, [0.18, 1.86, 0.43], [0, 0, 0]);

    const leftBrow = addMesh(group, new THREE.BoxGeometry(0.22, 0.045, 0.04), darkMat, [-0.2, 1.98, 0.42], [0, 0, -0.22]);
    const rightBrow = addMesh(group, new THREE.BoxGeometry(0.22, 0.045, 0.04), darkMat, [0.2, 1.98, 0.42], [0, 0, 0.22]);

    const leftHorn = addMesh(group, new THREE.ConeGeometry(0.13, 0.54, 16), hornMat, [-0.35, 2.22, -0.02], [0.2, 0, 0.42]);
    const rightHorn = addMesh(group, new THREE.ConeGeometry(0.13, 0.54, 16), hornMat, [0.35, 2.22, -0.02], [0.2, 0, -0.42]);

    const leftArm = addMesh(group, new THREE.CapsuleGeometry(0.11, 0.74, 8, 14), bodyMat, [-0.78, 1.0, 0.05], [0.1, 0, 0.82]);
    const rightArm = addMesh(group, new THREE.CapsuleGeometry(0.11, 0.74, 8, 14), bodyMat, [0.78, 1.0, 0.05], [0.1, 0, -0.82]);
    const leftClaw = addMesh(group, new THREE.ConeGeometry(0.14, 0.38, 14), clawMat, [-1.15, 0.78, 0.22], [1.3, 0.15, 0.7]);
    const rightClaw = addMesh(group, new THREE.ConeGeometry(0.14, 0.38, 14), clawMat, [1.15, 0.78, 0.22], [1.3, -0.15, -0.7]);

    const leftFoot = addMesh(group, new THREE.SphereGeometry(0.24, 18, 12), darkMat, [-0.32, 0.1, 0.25], [0, 0, 0]);
    leftFoot.scale.set(1.35, 0.45, 0.8);
    const rightFoot = leftFoot.clone();
    rightFoot.position.x = 0.32;
    group.add(rightFoot);

    const leftTooth = addMesh(group, new THREE.ConeGeometry(0.055, 0.22, 10), hornMat, [-0.12, 1.52, 0.58], [Math.PI, 0, 0]);
    const rightTooth = addMesh(group, new THREE.ConeGeometry(0.055, 0.22, 10), hornMat, [0.12, 1.52, 0.58], [Math.PI, 0, 0]);

    for (let i = 0; i < 5; i++) {
        const spike = addMesh(
            group,
            new THREE.ConeGeometry(0.09, 0.28, 10),
            clawMat,
            [-0.42 + i * 0.21, 1.58 - i * 0.13, -0.58],
            [-0.9, 0, 0]
        );
        spike.scale.set(1, 1 - i * 0.06, 1);
    }

    const tail = addMesh(group, new THREE.CapsuleGeometry(0.08, 0.82, 8, 12), darkMat, [0.55, 0.58, -0.58], [0.65, -0.25, -0.68]);
    const tailTip = addMesh(group, new THREE.ConeGeometry(0.12, 0.32, 12), clawMat, [0.88, 0.38, -0.84], [0.8, -0.25, -0.72]);

    group.userData.baseY = 0;
    group.userData.baseScale = 1;
    group.userData.parts = { body, belly, head, snout, leftEye, rightEye, leftBrow, rightBrow, leftArm, rightArm, leftClaw, rightClaw, tail, tailTip };
    return group;
}

function createGhostMonsterModel() {
    const group = new THREE.Group();
    const bodyMat = createMaterial(0x6f46b7, 0.58, 0.08, 0x24104f, 0.16);
    const darkMat = createMaterial(0x32175f, 0.72, 0.05);
    const highlightMat = createMaterial(0x9d7ad8, 0.52, 0.04, 0x442277, 0.08);
    const spikeMat = createMaterial(0x523091, 0.62, 0.06);
    const eyeMat = createMaterial(0xff6b76, 0.22, 0.15, 0xff2038, 1.45);
    const mouthMat = createMaterial(0x070711, 0.7, 0.02);
    const toothMat = createMaterial(0xe8eef8, 0.38, 0.12);

    const body = addMesh(group, new THREE.SphereGeometry(0.88, 48, 28), bodyMat, [0, 1.0, 0], [0, 0, 0]);
    body.scale.set(1.22, 1.16, 0.92);

    const head = addMesh(group, new THREE.SphereGeometry(0.76, 48, 24), bodyMat, [0, 1.55, 0.05], [0, 0, 0]);
    head.scale.set(1.2, 0.92, 0.9);

    const bellyShadow = addMesh(group, new THREE.SphereGeometry(0.62, 34, 18), darkMat, [0.1, 0.61, 0.46], [0, 0, 0]);
    bellyShadow.scale.set(1.08, 0.5, 0.15);

    const cheekHighlight = addMesh(group, new THREE.SphereGeometry(0.24, 22, 12), highlightMat, [-0.48, 1.18, 0.58], [0, 0, 0]);
    cheekHighlight.scale.set(0.72, 1.25, 0.18);

    const leftEar = addMesh(group, new THREE.ConeGeometry(0.25, 0.95, 18), spikeMat, [-0.84, 1.93, -0.02], [0.32, 0.18, 0.82]);
    leftEar.scale.set(0.86, 1.22, 0.8);
    const rightEar = addMesh(group, new THREE.ConeGeometry(0.25, 0.95, 18), spikeMat, [0.84, 1.93, -0.02], [0.32, -0.18, -0.82]);
    rightEar.scale.set(0.86, 1.22, 0.8);

    const spikePositions = [
        [-0.7, 2.08, -0.1, 0.42, 0, 0.5],
        [-0.35, 2.22, -0.1, 0.24, 0, 0.22],
        [0, 2.28, -0.1, 0.12, 0, 0],
        [0.35, 2.22, -0.1, 0.24, 0, -0.22],
        [0.7, 2.08, -0.1, 0.42, 0, -0.5]
    ];
    spikePositions.forEach(([x, y, z, rx, ry, rz]) => {
        const spike = addMesh(group, new THREE.ConeGeometry(0.17, 0.68, 16), spikeMat, [x, y, z], [rx, ry, rz]);
        spike.scale.set(0.82, 1.08, 1);
    });

    const leftEye = addMesh(group, new THREE.SphereGeometry(0.13, 22, 12), eyeMat, [-0.31, 1.62, 0.69], [0, 0, -0.28]);
    leftEye.scale.set(1.95, 0.56, 0.22);
    const rightEye = addMesh(group, new THREE.SphereGeometry(0.13, 22, 12), eyeMat, [0.31, 1.62, 0.69], [0, 0, 0.28]);
    rightEye.scale.set(1.95, 0.56, 0.22);

    const leftBrow = addMesh(group, new THREE.BoxGeometry(0.46, 0.055, 0.055), darkMat, [-0.31, 1.78, 0.68], [0, 0, -0.35]);
    const rightBrow = addMesh(group, new THREE.BoxGeometry(0.46, 0.055, 0.055), darkMat, [0.31, 1.78, 0.68], [0, 0, 0.35]);

    const mouth = addMesh(group, new THREE.SphereGeometry(0.52, 40, 14), mouthMat, [0, 1.25, 0.73], [0, 0, 0]);
    mouth.scale.set(1.58, 0.36, 0.11);

    for (let i = 0; i < 8; i++) {
        const x = -0.48 + i * 0.137;
        const tooth = addMesh(group, new THREE.BoxGeometry(0.095, 0.22, 0.035), toothMat, [x, 1.27, 0.81], [0, 0, 0]);
        tooth.scale.y = i === 0 || i === 7 ? 0.72 : 1;
    }
    addMesh(group, new THREE.BoxGeometry(1.04, 0.032, 0.04), darkMat, [0, 1.39, 0.815], [0, 0, 0]);
    addMesh(group, new THREE.BoxGeometry(1.0, 0.032, 0.04), darkMat, [0, 1.16, 0.815], [0, 0, 0]);

    const leftArm = addMesh(group, new THREE.CapsuleGeometry(0.13, 0.78, 10, 16), bodyMat, [-0.9, 0.98, 0.05], [0.08, 0, 0.62]);
    const rightArm = addMesh(group, new THREE.CapsuleGeometry(0.13, 0.78, 10, 16), bodyMat, [0.9, 0.98, 0.05], [0.08, 0, -0.62]);
    const leftClaw = addMesh(group, new THREE.SphereGeometry(0.17, 16, 10), bodyMat, [-1.2, 0.62, 0.24], [0, 0, 0]);
    leftClaw.scale.set(1.05, 0.72, 0.74);
    const rightClaw = addMesh(group, new THREE.SphereGeometry(0.17, 16, 10), bodyMat, [1.2, 0.62, 0.24], [0, 0, 0]);
    rightClaw.scale.set(1.05, 0.72, 0.74);

    [-0.1, 0.04, 0.18].forEach((offset, index) => {
        addMesh(group, new THREE.ConeGeometry(0.035, 0.18, 8), toothMat, [-1.3 + offset, 0.52 - index * 0.02, 0.32], [1.15, 0, 0.28]);
        addMesh(group, new THREE.ConeGeometry(0.035, 0.18, 8), toothMat, [1.3 - offset, 0.52 - index * 0.02, 0.32], [1.15, 0, -0.28]);
    });

    const leftFoot = addMesh(group, new THREE.SphereGeometry(0.24, 20, 12), spikeMat, [-0.37, 0.06, 0.28], [0, 0, 0]);
    leftFoot.scale.set(1.35, 0.48, 0.88);
    const rightFoot = leftFoot.clone();
    rightFoot.position.x = 0.37;
    group.add(rightFoot);

    const tail = addMesh(group, new THREE.CapsuleGeometry(0.07, 0.55, 8, 12), darkMat, [0.5, 0.46, -0.68], [0.85, -0.2, -0.72]);
    const tailTip = addMesh(group, new THREE.ConeGeometry(0.1, 0.24, 12), spikeMat, [0.73, 0.28, -0.92], [0.9, -0.2, -0.72]);

    const groundShadow = addMesh(group, new THREE.CylinderGeometry(0.92, 0.92, 0.018, 36), createMaterial(0x120b24, 0.96, 0), [0, -0.03, 0], [0, 0, 0]);
    groundShadow.scale.z = 0.58;

    group.userData.baseY = 0;
    group.userData.baseScale = 1;
    group.userData.parts = { body, head, leftEye, rightEye, leftBrow, rightBrow, leftArm, rightArm, leftClaw, rightClaw, tail, tailTip };
    return group;
}

function createMaterial(color, roughness, metalness, emissive = 0x000000, emissiveIntensity = 0) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        emissive,
        emissiveIntensity
    });
}

function addMesh(group, geometry, material, position, rotation) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
}

function createHpRing(color) {
    const ring = new THREE.Group();
    const back = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.025, 6, 48),
        new THREE.MeshBasicMaterial({ color: 0x4b5563 })
    );
    const front = new THREE.Mesh(
        new THREE.TorusGeometry(0.405, 0.03, 6, 48),
        new THREE.MeshBasicMaterial({ color })
    );
    ring.add(back, front);
    ring.userData.front = front;
    return ring;
}

function handleBattleState(event) {
    const { state, previousState } = event.detail;
    currentState = state;
    updateHpRings(state);

    if (!previousState) {
        return;
    }

    const message = state.message ? state.message.toLowerCase() : '';
    const answeredCorrectly = message.includes('jawaban benar') || (message.includes('stage') && message.includes('reward'));

    if (answeredCorrectly || state.monsterHp < previousState.monsterHp) {
        triggerAction('playerAttack');
    } else if (state.stage !== previousState.stage) {
        triggerAction('stage');
    } else if (state.playerHp > previousState.playerHp) {
        triggerAction('heal');
    } else if (state.playerHp < previousState.playerHp) {
        triggerAction('monsterAttack');
    }
}

function updateHpRings(state) {
    setRingScale(playerHpRing, state.playerHp, state.playerMaxHp);
    setRingScale(monsterHpRing, state.monsterHp, state.monsterMaxHp);
}

function setRingScale(ring, hp, maxHp) {
    if (!ring || !ring.userData.front) {
        return;
    }
    const percent = maxHp <= 0 ? 0 : Math.max(0.06, Math.min(1, hp / maxHp));
    ring.userData.front.scale.set(percent, percent, percent);
}

function triggerAction(name) {
    activeAction = name;
    activeActionData = {
        fireSpawned: false,
        impactStartedAt: null,
        impactTriggered: false
    };
    actionStartedAt = performance.now();

    if (name === 'heal') {
        spawnHealParticles();
    }
}

function spawnHealParticles() {
    for (let i = 0; i < 16; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0x22c55e })
        );
        const angle = (i / 16) * Math.PI * 2;
        particle.position.set(-2.15 + Math.cos(angle) * 0.45, 1.0 + Math.random() * 0.5, Math.sin(angle) * 0.45);
        particle.userData.velocity = new THREE.Vector3(Math.cos(angle) * 0.01, 0.025 + Math.random() * 0.018, Math.sin(angle) * 0.01);
        particle.userData.life = 1;
        healParticles.push(particle);
        scene.add(particle);
    }
}

function spawnHitParticles(direction) {
    const x = direction > 0 ? 2.05 : -2.05;
    const color = direction > 0 ? 0x38bdf8 : 0xef4444;
    for (let i = 0; i < 12; i++) {
        const particle = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.08),
            new THREE.MeshBasicMaterial({ color })
        );
        particle.position.set(x, 1.25 + Math.random() * 0.6, 0.15 + Math.random() * 0.2);
        particle.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.04, (Math.random() - 0.2) * 0.045, (Math.random() - 0.5) * 0.04);
        particle.userData.life = 1;
        hitParticles.push(particle);
        scene.add(particle);
    }
}

function spawnBlueFireProjectile() {
    const group = new THREE.Group();

    const glow = new THREE.PointLight(0x38bdf8, 4.2, 2.6);
    glow.position.set(0, 0, 0);

    const flameSprites = [
        createBlueFireSprite(1.42, 0.68, 0.86, 0x38bdf8, [0.04, 0, 0]),
        createBlueFireSprite(1.02, 0.42, 0.9, 0xe0f7ff, [0.22, 0.02, 0.02]),
        createBlueFireSprite(0.92, 0.48, 0.62, 0x2563eb, [-0.38, 0.06, -0.04]),
        createBlueFireSprite(0.76, 0.36, 0.58, 0x22d3ee, [-0.62, -0.08, 0.05]),
        createBlueFireSprite(0.54, 0.26, 0.46, 0x7dd3fc, [-0.86, 0.04, -0.02])
    ];

    flameSprites.forEach((sprite) => group.add(sprite));
    group.add(glow);

    group.position.set(-1.45, 1.45, 0.24);
    group.userData.start = new THREE.Vector3(-1.45, 1.45, 0.24);
    group.userData.end = new THREE.Vector3(1.82, 1.42, 0.2);
    group.userData.life = 0;
    group.userData.duration = 0.72;
    group.userData.flameSprites = flameSprites;
    group.userData.glow = glow;
    group.userData.trailTimer = 0;
    group.userData.hasImpacted = false;
    fireProjectiles.push(group);
    scene.add(group);
}

function spawnRedFireProjectile() {
    const group = new THREE.Group();

    const glow = new THREE.PointLight(0xef4444, 4.8, 2.8);
    glow.position.set(0, 0, 0);

    const flameSprites = [
        createRedFireSprite(1.42, 0.68, 0.88, 0xef4444, [-0.04, 0, 0]),
        createRedFireSprite(1.02, 0.42, 0.92, 0xffedd5, [-0.22, 0.02, 0.02]),
        createRedFireSprite(0.92, 0.48, 0.66, 0xdc2626, [0.38, 0.06, -0.04]),
        createRedFireSprite(0.76, 0.36, 0.58, 0xfb7185, [0.62, -0.08, 0.05]),
        createRedFireSprite(0.54, 0.26, 0.46, 0xfca5a5, [0.86, 0.04, -0.02])
    ];

    flameSprites.forEach((sprite) => group.add(sprite));
    group.add(glow);

    group.position.set(1.45, 1.45, 0.24);
    group.userData.start = new THREE.Vector3(1.45, 1.45, 0.24);
    group.userData.end = new THREE.Vector3(-1.82, 1.42, 0.2);
    group.userData.life = 0;
    group.userData.duration = 0.72;
    group.userData.flameSprites = flameSprites;
    group.userData.glow = glow;
    group.userData.trailTimer = 0;
    group.userData.hasImpacted = false;
    group.userData.fireColor = 'red';
    group.userData.impactTarget = 'player';
    fireProjectiles.push(group);
    scene.add(group);
}

function spawnBlueFireTrail(position) {
    for (let i = 0; i < 3; i++) {
        const particle = createBlueFireSprite(
            0.48 + Math.random() * 0.36,
            0.18 + Math.random() * 0.2,
            0.42 + Math.random() * 0.24,
            i === 0 ? 0x67e8f9 : 0x2563eb,
            [0, 0, 0]
        );
        particle.position.copy(position);
        particle.position.x -= 0.22 + Math.random() * 0.45;
        particle.position.y += (Math.random() - 0.5) * 0.22;
        particle.position.z += (Math.random() - 0.5) * 0.22;
        particle.userData.velocity = new THREE.Vector3(-0.012 - Math.random() * 0.02, (Math.random() - 0.1) * 0.018, (Math.random() - 0.5) * 0.018);
        particle.userData.life = 0.55 + Math.random() * 0.18;
        particle.userData.decay = 2.4;
        particle.userData.fadeBase = particle.material.opacity;
        hitParticles.push(particle);
        scene.add(particle);
    }
}

function spawnRedFireTrail(position) {
    for (let i = 0; i < 3; i++) {
        const particle = createRedFireSprite(
            0.48 + Math.random() * 0.36,
            0.18 + Math.random() * 0.2,
            0.42 + Math.random() * 0.24,
            i === 0 ? 0xfca5a5 : 0xdc2626,
            [0, 0, 0]
        );
        particle.position.copy(position);
        particle.position.x += 0.22 + Math.random() * 0.45;
        particle.position.y += (Math.random() - 0.5) * 0.22;
        particle.position.z += (Math.random() - 0.5) * 0.22;
        particle.userData.velocity = new THREE.Vector3(0.012 + Math.random() * 0.02, (Math.random() - 0.1) * 0.018, (Math.random() - 0.5) * 0.018);
        particle.userData.life = 0.55 + Math.random() * 0.18;
        particle.userData.decay = 2.4;
        particle.userData.fadeBase = particle.material.opacity;
        hitParticles.push(particle);
        scene.add(particle);
    }
}

function createBlueFireSprite(scaleX, scaleY, opacity, color, position) {
    const material = new THREE.SpriteMaterial({
        map: getBlueFireTexture(),
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.position.set(position[0], position[1], position[2]);
    sprite.userData.basePosition = sprite.position.clone();
    sprite.userData.baseScale = new THREE.Vector3(scaleX, scaleY, 1);
    sprite.userData.baseOpacity = opacity;
    return sprite;
}

function createRedFireSprite(scaleX, scaleY, opacity, color, position) {
    const material = new THREE.SpriteMaterial({
        map: getRedFireTexture(),
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scaleX, scaleY, 1);
    sprite.position.set(position[0], position[1], position[2]);
    sprite.userData.basePosition = sprite.position.clone();
    sprite.userData.baseScale = new THREE.Vector3(scaleX, scaleY, 1);
    sprite.userData.baseOpacity = opacity;
    return sprite;
}

function getBlueFireTexture() {
    if (blueFireTexture) {
        return blueFireTexture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const glow = ctx.createRadialGradient(150, 64, 8, 120, 64, 118);
    glow.addColorStop(0, 'rgba(230, 250, 255, 0.82)');
    glow.addColorStop(0.28, 'rgba(56, 189, 248, 0.48)');
    glow.addColorStop(0.68, 'rgba(37, 99, 235, 0.16)');
    glow.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const outer = ctx.createLinearGradient(16, 0, 244, 0);
    outer.addColorStop(0, 'rgba(29, 78, 216, 0)');
    outer.addColorStop(0.22, 'rgba(37, 99, 235, 0.58)');
    outer.addColorStop(0.62, 'rgba(34, 211, 238, 0.88)');
    outer.addColorStop(1, 'rgba(224, 247, 255, 0)');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.moveTo(16, 64);
    ctx.bezierCurveTo(54, 28, 82, 24, 112, 40);
    ctx.bezierCurveTo(124, 18, 156, 8, 178, 33);
    ctx.bezierCurveTo(194, 17, 226, 28, 244, 64);
    ctx.bezierCurveTo(221, 100, 191, 108, 174, 90);
    ctx.bezierCurveTo(146, 116, 113, 102, 103, 84);
    ctx.bezierCurveTo(73, 102, 46, 91, 16, 64);
    ctx.fill();

    const inner = ctx.createLinearGradient(42, 0, 238, 0);
    inner.addColorStop(0, 'rgba(125, 211, 252, 0)');
    inner.addColorStop(0.35, 'rgba(103, 232, 249, 0.74)');
    inner.addColorStop(0.72, 'rgba(236, 254, 255, 0.96)');
    inner.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.moveTo(52, 66);
    ctx.bezierCurveTo(88, 42, 105, 50, 126, 56);
    ctx.bezierCurveTo(142, 36, 165, 35, 181, 55);
    ctx.bezierCurveTo(199, 48, 222, 54, 238, 66);
    ctx.bezierCurveTo(216, 78, 193, 83, 178, 74);
    ctx.bezierCurveTo(152, 92, 130, 84, 116, 72);
    ctx.bezierCurveTo(92, 84, 72, 80, 52, 66);
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.beginPath();
    ctx.moveTo(130, 64);
    ctx.bezierCurveTo(154, 49, 174, 50, 197, 63);
    ctx.bezierCurveTo(176, 74, 151, 78, 130, 64);
    ctx.fill();

    blueFireTexture = new THREE.CanvasTexture(canvas);
    blueFireTexture.colorSpace = THREE.SRGBColorSpace;
    blueFireTexture.needsUpdate = true;
    return blueFireTexture;
}

function getRedFireTexture() {
    if (redFireTexture) {
        return redFireTexture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const glow = ctx.createRadialGradient(106, 64, 8, 136, 64, 118);
    glow.addColorStop(0, 'rgba(255, 247, 237, 0.86)');
    glow.addColorStop(0.28, 'rgba(248, 113, 113, 0.5)');
    glow.addColorStop(0.68, 'rgba(185, 28, 28, 0.18)');
    glow.addColorStop(1, 'rgba(185, 28, 28, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const outer = ctx.createLinearGradient(244, 0, 16, 0);
    outer.addColorStop(0, 'rgba(127, 29, 29, 0)');
    outer.addColorStop(0.22, 'rgba(220, 38, 38, 0.62)');
    outer.addColorStop(0.62, 'rgba(248, 113, 113, 0.9)');
    outer.addColorStop(1, 'rgba(255, 237, 213, 0)');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.moveTo(244, 64);
    ctx.bezierCurveTo(206, 28, 174, 24, 144, 40);
    ctx.bezierCurveTo(132, 18, 100, 8, 78, 33);
    ctx.bezierCurveTo(62, 17, 30, 28, 12, 64);
    ctx.bezierCurveTo(35, 100, 65, 108, 82, 90);
    ctx.bezierCurveTo(110, 116, 143, 102, 153, 84);
    ctx.bezierCurveTo(183, 102, 214, 91, 244, 64);
    ctx.fill();

    const inner = ctx.createLinearGradient(214, 0, 18, 0);
    inner.addColorStop(0, 'rgba(254, 202, 202, 0)');
    inner.addColorStop(0.35, 'rgba(251, 146, 60, 0.74)');
    inner.addColorStop(0.72, 'rgba(255, 247, 237, 0.98)');
    inner.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.moveTo(204, 66);
    ctx.bezierCurveTo(168, 42, 151, 50, 130, 56);
    ctx.bezierCurveTo(114, 36, 91, 35, 75, 55);
    ctx.bezierCurveTo(57, 48, 34, 54, 18, 66);
    ctx.bezierCurveTo(40, 78, 63, 83, 78, 74);
    ctx.bezierCurveTo(104, 92, 126, 84, 140, 72);
    ctx.bezierCurveTo(164, 84, 184, 80, 204, 66);
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(126, 64);
    ctx.bezierCurveTo(102, 49, 82, 50, 59, 63);
    ctx.bezierCurveTo(80, 74, 105, 78, 126, 64);
    ctx.fill();

    redFireTexture = new THREE.CanvasTexture(canvas);
    redFireTexture.colorSpace = THREE.SRGBColorSpace;
    redFireTexture.needsUpdate = true;
    return redFireTexture;
}

function spawnBlueImpactParticles(position) {
    for (let i = 0; i < 22; i++) {
        const isShard = i % 3 === 0;
        const particle = new THREE.Mesh(
            isShard ? new THREE.BoxGeometry(0.08, 0.08, 0.08) : new THREE.SphereGeometry(0.055, 8, 6),
            new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x67e8f9 : 0x2563eb,
                transparent: true,
                opacity: 0.95
            })
        );
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.018 + Math.random() * 0.04;
        particle.position.copy(position);
        particle.position.y += (Math.random() - 0.5) * 0.35;
        particle.userData.velocity = new THREE.Vector3(Math.cos(angle) * speed, (Math.random() - 0.15) * 0.05, Math.sin(angle) * speed);
        particle.userData.life = 1;
        hitParticles.push(particle);
        scene.add(particle);
    }
}

function spawnRedImpactParticles(position) {
    for (let i = 0; i < 22; i++) {
        const isShard = i % 3 === 0;
        const particle = new THREE.Mesh(
            isShard ? new THREE.BoxGeometry(0.08, 0.08, 0.08) : new THREE.SphereGeometry(0.055, 8, 6),
            new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0xfca5a5 : 0xdc2626,
                transparent: true,
                opacity: 0.95
            })
        );
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.018 + Math.random() * 0.04;
        particle.position.copy(position);
        particle.position.y += (Math.random() - 0.5) * 0.35;
        particle.userData.velocity = new THREE.Vector3(Math.cos(angle) * speed, (Math.random() - 0.15) * 0.05, Math.sin(angle) * speed);
        particle.userData.life = 1;
        hitParticles.push(particle);
        scene.add(particle);
    }
}

function animate(time) {
    renderSceneFrame(time);
    requestAnimationFrame(animate);
}

function renderBackgroundFrame() {
    renderSceneFrame(performance.now());
}

function renderSceneFrame(time) {
    const delta = lastFrameTime ? (time - lastFrameTime) / 1000 : 0.016;
    lastFrameTime = time;

    animateIdle(time);
    animateAction(time);
    if (playerMixer) {
        playerMixer.update(delta);
    }
    if (monsterMixer) {
        monsterMixer.update(delta);
    }
    animateFireProjectiles(delta);
    animateParticles(delta);

    renderer.render(scene, camera);
    frameCount++;
    if (frameCount % 10 === 0) {
        updateSceneDiagnostics();
    }
}

function animateIdle(time) {
    const t = time * 0.001;
    const playerParts = player.userData.parts;
    const monsterParts = monster.userData.parts;

    player.position.y = player.userData.baseY + Math.sin(t * 2.2) * 0.04;
    player.rotation.y = -0.08 + Math.sin(t * 1.35) * 0.055;
    monster.position.y = monster.userData.baseY + Math.sin(t * 2.7 + 1.2) * 0.055;
    monster.rotation.y = 0.08 + Math.sin(t * 1.7 + 0.4) * 0.08;

    if (player.userData.isExternalModel) {
        const baseScale = player.userData.baseScale || 1;
        player.scale.setScalar(baseScale + Math.sin(t * 2.4) * 0.018);
    } else {
        playerParts.orb.scale.setScalar(1 + Math.sin(t * 6.2) * 0.22);
        playerParts.rightArm.rotation.z = -0.55 + Math.sin(t * 2.4) * 0.07;
        playerParts.leftArm.rotation.z = 0.45 + Math.sin(t * 2.1 + 0.4) * 0.045;
        playerParts.book.rotation.y = -0.18 + Math.sin(t * 1.8) * 0.04;
        playerParts.cape.rotation.x = -0.12 + Math.sin(t * 2.0) * 0.035;
    }

    if (monster.userData.isExternalModel) {
        const baseScale = monster.userData.baseScale || 1;
        monster.scale.setScalar(baseScale + Math.sin(t * 2.9 + 0.6) * 0.025);
        return;
    }

    monsterParts.leftEye.scale.setScalar(1 + Math.sin(t * 6.0) * 0.1);
    monsterParts.rightEye.scale.setScalar(1 + Math.sin(t * 6.0) * 0.1);
    monsterParts.leftArm.rotation.z = 0.82 + Math.sin(t * 2.6) * 0.08;
    monsterParts.rightArm.rotation.z = -0.82 - Math.sin(t * 2.6) * 0.08;
    monsterParts.leftClaw.rotation.z = 0.7 + Math.sin(t * 3.1) * 0.08;
    monsterParts.rightClaw.rotation.z = -0.7 - Math.sin(t * 3.1) * 0.08;
    monsterParts.tail.rotation.z = -0.68 + Math.sin(t * 2.8) * 0.12;
    monsterParts.tailTip.rotation.z = -0.72 + Math.sin(t * 2.8 + 0.2) * 0.12;
}

function animateAction(time) {
    if (!activeAction) {
        return;
    }

    const elapsed = time - actionStartedAt;

    if (activeAction === 'playerAttack') {
        animatePlayerAttackAction(time, elapsed);
    } else if (activeAction === 'monsterAttack') {
        animateMonsterAttackAction(time, elapsed);
    } else if (activeAction === 'heal') {
        const progress = Math.min(1, elapsed / 620);
        const strike = Math.sin(progress * Math.PI);
        player.scale.setScalar((player.userData.baseScale || 1) + strike * 0.08);
    } else if (activeAction === 'stage') {
        const progress = Math.min(1, elapsed / 620);
        const strike = Math.sin(progress * Math.PI);
        player.rotation.y += strike * 0.05;
        monster.scale.setScalar((monster.userData.baseScale || 1) + strike * 0.06);
    }

    const duration = activeAction === 'playerAttack' || activeAction === 'monsterAttack' ? 2400 : 620;
    if (elapsed >= duration) {
        player.position.x = -2.15;
        player.position.y = player.userData.baseY || 0;
        player.rotation.x = 0;
        player.rotation.z = 0;
        player.rotation.y = -0.08;
        player.scale.setScalar(player.userData.baseScale || 1);
        monster.position.x = 2.15;
        monster.position.y = monster.userData.baseY || 0;
        monster.rotation.x = 0;
        monster.rotation.z = 0;
        monster.rotation.y = 0.08;
        monster.scale.setScalar(monster.userData.baseScale || 1);
        activeAction = null;
        activeActionData = null;
    }
}

function animatePlayerAttackAction(time, elapsed) {
    const windupProgress = clamp01(elapsed / 420);
    const castProgress = clamp01((elapsed - 260) / 520);
    const recoveryProgress = clamp01((elapsed - 1750) / 600);
    const windup = easeOutCubic(windupProgress);
    const cast = Math.sin(castProgress * Math.PI);
    const recovery = easeInOutCubic(recoveryProgress);

    player.rotation.y = lerp(-0.08, 1.05, windup);
    player.rotation.x = -0.12 * cast;
    player.rotation.z = -0.08 * cast;
    player.position.x = -2.15 + 0.22 * cast - 0.08 * recovery;
    player.position.y = (player.userData.baseY || 0) + 0.03 * cast;

    monster.rotation.y = lerp(0.08, -0.95, windup);

    if (activeActionData && !activeActionData.fireSpawned && elapsed >= 360) {
        activeActionData.fireSpawned = true;
        spawnBlueFireProjectile();
    }

    if (activeActionData && activeActionData.impactStartedAt) {
        animateMonsterFall(time - activeActionData.impactStartedAt);
    } else {
        monster.position.x = 2.15 - 0.08 * cast;
        monster.rotation.x = -0.06 * cast;
        monster.rotation.z = 0.08 * cast;
    }

    if (recoveryProgress > 0) {
        player.rotation.y = lerp(player.rotation.y, -0.08, recovery);
        player.rotation.x = lerp(player.rotation.x, 0, recovery);
        player.rotation.z = lerp(player.rotation.z, 0, recovery);
        player.position.x = lerp(player.position.x, -2.15, recovery);
        player.position.y = lerp(player.position.y, player.userData.baseY || 0, recovery);
    }
}

function animateMonsterAttackAction(time, elapsed) {
    const windupProgress = clamp01(elapsed / 420);
    const castProgress = clamp01((elapsed - 260) / 520);
    const recoveryProgress = clamp01((elapsed - 1750) / 600);
    const windup = easeOutCubic(windupProgress);
    const cast = Math.sin(castProgress * Math.PI);
    const recovery = easeInOutCubic(recoveryProgress);

    monster.rotation.y = lerp(0.08, -0.95, windup);
    monster.rotation.x = -0.08 * cast;
    monster.rotation.z = 0.08 * cast;
    monster.position.x = 2.15 - 0.22 * cast + 0.08 * recovery;
    monster.position.y = (monster.userData.baseY || 0) + 0.04 * cast;

    player.rotation.y = lerp(-0.08, 1.05, windup);

    if (activeActionData && !activeActionData.fireSpawned && elapsed >= 360) {
        activeActionData.fireSpawned = true;
        spawnRedFireProjectile();
    }

    if (activeActionData && activeActionData.impactStartedAt) {
        animatePlayerHit(time - activeActionData.impactStartedAt);
    } else {
        player.position.x = -2.15 + 0.08 * cast;
        player.rotation.x = -0.04 * cast;
        player.rotation.z = -0.06 * cast;
    }

    if (recoveryProgress > 0) {
        monster.rotation.y = lerp(monster.rotation.y, 0.08, recovery);
        monster.rotation.x = lerp(monster.rotation.x, 0, recovery);
        monster.rotation.z = lerp(monster.rotation.z, 0, recovery);
        monster.position.x = lerp(monster.position.x, 2.15, recovery);
        monster.position.y = lerp(monster.position.y, monster.userData.baseY || 0, recovery);
    }
}

function animatePlayerHit(elapsed) {
    const hit = easeOutCubic(clamp01(elapsed / 320));
    const recover = easeInOutCubic(clamp01((elapsed - 820) / 720));
    const pose = lerp(hit, 0, recover);

    player.position.x = -2.15 - pose * 0.34;
    player.position.y = (player.userData.baseY || 0) - pose * 0.08;
    player.rotation.y = lerp(1.05, 0.82, pose);
    player.rotation.x = -pose * 0.18;
    player.rotation.z = pose * 0.72;
    player.scale.setScalar((player.userData.baseScale || 1) * (1 - pose * 0.035));
}

function animateMonsterFall(elapsed) {
    const fall = easeOutCubic(clamp01(elapsed / 380));
    const recover = easeInOutCubic(clamp01((elapsed - 1050) / 760));
    const pose = lerp(fall, 0, recover);

    monster.position.x = 2.15 + pose * 0.36;
    monster.position.y = (monster.userData.baseY || 0) - pose * 0.18;
    monster.rotation.y = lerp(-0.95, -1.1, pose);
    monster.rotation.x = -pose * 0.3;
    monster.rotation.z = -pose * 1.32;
    monster.scale.setScalar((monster.userData.baseScale || 1) * (1 - pose * 0.06));
}

function triggerMonsterFall() {
    if (!activeActionData || activeActionData.impactTriggered) {
        return;
    }
    activeActionData.impactTriggered = true;
    activeActionData.impactStartedAt = performance.now();
}

function triggerPlayerHit() {
    if (!activeActionData || activeActionData.impactTriggered) {
        return;
    }
    activeActionData.impactTriggered = true;
    activeActionData.impactStartedAt = performance.now();
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function easeOutCubic(value) {
    return 1 - Math.pow(1 - clamp01(value), 3);
}

function easeInOutCubic(value) {
    const t = clamp01(value);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateParticles(delta) {
    updateParticleList(healParticles, delta);
    updateParticleList(hitParticles, delta);
}

function animateFireProjectiles(delta) {
    for (let i = fireProjectiles.length - 1; i >= 0; i--) {
        const projectile = fireProjectiles[i];
        projectile.userData.life += delta;
        projectile.userData.trailTimer += delta;
        const progress = Math.min(1, projectile.userData.life / projectile.userData.duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const now = performance.now() * 0.001;
        projectile.position.lerpVectors(projectile.userData.start, projectile.userData.end, eased);
        projectile.position.y += Math.sin(progress * Math.PI) * 0.32;
        projectile.scale.set(1 + progress * 0.16, 1, 1);

        if (projectile.userData.glow) {
            projectile.userData.glow.intensity = 3.2 + Math.sin(now * 22) * 0.9;
        }

        if (projectile.userData.flameSprites) {
            projectile.userData.flameSprites.forEach((sprite, index) => {
                const flicker = Math.sin(now * (15 + index * 1.7) + index * 0.9);
                const flutter = Math.cos(now * (12 + index) + index * 1.3);
                sprite.position.copy(sprite.userData.basePosition);
                sprite.position.x += flicker * 0.035;
                sprite.position.y += flutter * 0.055;
                sprite.position.z += Math.sin(now * 11 + index) * 0.035;
                sprite.scale.set(
                    sprite.userData.baseScale.x * (0.9 + flicker * 0.12),
                    sprite.userData.baseScale.y * (1.05 + flutter * 0.24),
                    1
                );
                sprite.material.opacity = Math.max(0.16, sprite.userData.baseOpacity * (0.72 + flicker * 0.22));
            });
        }

        if (projectile.userData.trailTimer > 0.035 && progress < 0.92) {
            projectile.userData.trailTimer = 0;
            if (projectile.userData.fireColor === 'red') {
                spawnRedFireTrail(projectile.position.clone());
            } else {
                spawnBlueFireTrail(projectile.position.clone());
            }
        }

        if (progress >= 1) {
            if (!projectile.userData.hasImpacted) {
                projectile.userData.hasImpacted = true;
                if (projectile.userData.impactTarget === 'player') {
                    spawnRedImpactParticles(projectile.userData.end.clone());
                    triggerPlayerHit();
                } else {
                    spawnBlueImpactParticles(projectile.userData.end.clone());
                    triggerMonsterFall();
                }
            }
            scene.remove(projectile);
            projectile.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    child.material.dispose();
                }
            });
            fireProjectiles.splice(i, 1);
        }
    }
}

function updateParticleList(list, delta) {
    for (let i = list.length - 1; i >= 0; i--) {
        const particle = list[i];
        particle.position.add(particle.userData.velocity);
        particle.rotation.x += delta * 5;
        particle.rotation.y += delta * 4;
        particle.userData.life -= delta * (particle.userData.decay || 1.6);
        if (particle.material) {
            particle.material.opacity = Math.max(0, particle.userData.life * (particle.userData.fadeBase || 1));
            particle.material.transparent = true;
        }
        if (particle.userData.life <= 0) {
            scene.remove(particle);
            if (particle.geometry) {
                particle.geometry.dispose();
            }
            if (particle.material) {
                particle.material.dispose();
            }
            list.splice(i, 1);
        }
    }
}

function resizeScene() {
    if (!renderer || !camera || !mount) {
        return;
    }
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function exposeDiagnostics() {
    window.OopQuestBattle3D = {
        getState() {
            const canvas = renderer ? renderer.domElement : null;
            return {
                ready: Boolean(renderer && scene && player && monster),
                hasState: Boolean(currentState),
                canvasCount: mount ? mount.querySelectorAll('canvas').length : 0,
                frameCount,
                canvasWidth: canvas ? canvas.width : 0,
                canvasHeight: canvas ? canvas.height : 0,
                centerPixel: readCenterPixel(),
                playerModel: mount ? mount.dataset.playerModel : 'unknown',
                monsterModel: mount ? mount.dataset.monsterModel : 'unknown',
                activeAction,
                hasActionData: Boolean(activeActionData),
                fireProjectiles: fireProjectiles.length,
                lastError
            };
        }
    };
}

function readCenterPixel() {
    if (!renderer) {
        return [0, 0, 0, 0];
    }
    const gl = renderer.getContext();
    const canvas = renderer.domElement;
    const pixels = new Uint8Array(4);
    gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return Array.from(pixels);
}

function updateSceneDiagnostics() {
    if (!mount || !renderer) {
        return;
    }
    mount.dataset.sceneReady = String(Boolean(renderer && scene && player && monster));
    mount.dataset.frameCount = String(frameCount);
    mount.dataset.canvasWidth = String(renderer.domElement.width);
    mount.dataset.canvasHeight = String(renderer.domElement.height);
    try {
        const pixel = readCenterPixel();
        const pixelSum = pixel.reduce((sum, value) => sum + value, 0);
        mount.dataset.centerPixel = pixel.join(',');
        mount.dataset.nonBlank = String(pixelSum > 0);
        mount.dataset.playerModel = mount.dataset.playerModel || 'fallback';
        mount.dataset.monsterModel = mount.dataset.monsterModel || 'fallback';
        mount.dataset.activeAction = activeAction || '';
        mount.dataset.fireProjectiles = String(fireProjectiles.length);
        mount.dataset.playerX = player ? player.position.x.toFixed(2) : '';
        mount.dataset.playerY = player ? player.position.y.toFixed(2) : '';
        mount.dataset.playerRotX = player ? player.rotation.x.toFixed(2) : '';
        mount.dataset.playerRotY = player ? player.rotation.y.toFixed(2) : '';
        mount.dataset.playerRotZ = player ? player.rotation.z.toFixed(2) : '';
        mount.dataset.monsterY = monster ? monster.position.y.toFixed(2) : '';
        mount.dataset.monsterRotX = monster ? monster.rotation.x.toFixed(2) : '';
        mount.dataset.monsterRotY = monster ? monster.rotation.y.toFixed(2) : '';
        mount.dataset.monsterRotZ = monster ? monster.rotation.z.toFixed(2) : '';
    } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        mount.dataset.centerPixel = 'unavailable';
        mount.dataset.nonBlank = 'unknown';
        mount.dataset.lastError = lastError;
    }
}
