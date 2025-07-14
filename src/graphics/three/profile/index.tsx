import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
// import { FontLoader, FontData } from "three/examples/jsm/loaders/FontLoader";
// import helvetiker_regular from "three/examples/fonts/helvetiker_regular.typeface.json";

// 상수 정의
const CONFIG = {
  CAMERA: {
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000,
    POSITION: { x: 0, y: 0, z: 25 },
  },
  RENDERER: {
    CLEAR_COLOR: 0x000000,
    BACKGROUND_COLOR: 0xfdfdfd,
  },
  CONTROLS: {
    DAMPING_FACTOR: 0.05,
    MAX_POLAR_ANGLE: Math.PI / 2,
  },
  LIGHTS: {
    AMBIENT: { color: 0xfefefe, intensity: 0.7 },
    DIRECTIONAL: {
      color: 0xffffff,
      intensity: 1.2,
      position: { x: 5, y: 10, z: 7 },
    },
    POINT: {
      color: 0xffffff,
      intensity: 0.5,
      position: { x: -10, y: -10, z: 10 },
    },
  },
  ANIMATION: {
    MOUSE_THROTTLE_MS: 16,
    FRAME_RATE_LIMIT: 1000 / 60,
    ROTATION_SPEED: 0.1,
    LERP_FACTOR: 0.1,
    RESIZE_DEBOUNCE_MS: 100,
  },
  OBJECTS: {
    FACE_SCALE: 1,
    SUNGLASS_SCALE: 8,
    TEXT_SIZE: 2.5,
    TEXT_HEIGHT: 1,
    TEXT_COLOR: 0xffffff,
  },
} as const;

// 타입 정의
interface ObjectData {
  name: string;
  position: [number, number, number];
}
interface MousePosition {
  x: number;
  y: number;
}

const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.RENDERER.BACKGROUND_COLOR);
  return scene;
};

const createCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    CONFIG.CAMERA.FOV,
    window.innerWidth / window.innerHeight,
    CONFIG.CAMERA.NEAR,
    CONFIG.CAMERA.FAR
  );
  camera.position.set(
    CONFIG.CAMERA.POSITION.x,
    CONFIG.CAMERA.POSITION.y,
    CONFIG.CAMERA.POSITION.z
  );
  return camera;
};

const createRenderer = (): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(CONFIG.RENDERER.CLEAR_COLOR, 1);
  renderer.setPixelRatio(window.devicePixelRatio);
  return renderer;
};

const createObject = async (fileName: string): Promise<GLTF> => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const url = `${process.env.PUBLIC_URL}/glb/${fileName}.glb`;
  try {
    const gltf = await loader.loadAsync(url);
    return gltf;
  } catch (error) {
    console.error(`Error loading GLB object ${fileName}:`, error);
    throw error;
  }
};

// 텍스트 객체 생성
// const createTextObject = async (text: string): Promise<THREE.Mesh> => {
//   const loader = new FontLoader();
//   const font = loader.parse(helvetiker_regular as unknown as FontData);
//
//   const textGeometry = new TextGeometry(text, {
//     font: font,
//     size: CONFIG.OBJECTS.TEXT_SIZE,
//     height: CONFIG.OBJECTS.TEXT_HEIGHT,
//     curveSegments: 4,
//     bevelEnabled: true,
//     bevelThickness: 0.2,
//     bevelSize: 0.4,
//     bevelOffset: 0,
//     bevelSegments: 4,
//   });
//
//   textGeometry.computeBoundingBox();
//   textGeometry.center();
//
//   const material = new THREE.MeshStandardMaterial({
//     color: CONFIG.OBJECTS.TEXT_COLOR
//   });
//
//   return new THREE.Mesh(textGeometry, material);
// };

const setupControls = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): OrbitControls => {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = CONFIG.CONTROLS.DAMPING_FACTOR;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = CONFIG.CONTROLS.MAX_POLAR_ANGLE;
  controls.update();
  return controls;
};

const setupLights = (scene: THREE.Scene): void => {
  const ambientLight = new THREE.AmbientLight(
    CONFIG.LIGHTS.AMBIENT.color,
    CONFIG.LIGHTS.AMBIENT.intensity
  );
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    CONFIG.LIGHTS.DIRECTIONAL.color,
    CONFIG.LIGHTS.DIRECTIONAL.intensity
  );
  directionalLight.position
    .set(
      CONFIG.LIGHTS.DIRECTIONAL.position.x,
      CONFIG.LIGHTS.DIRECTIONAL.position.y,
      CONFIG.LIGHTS.DIRECTIONAL.position.z
    )
    .normalize();
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(
    CONFIG.LIGHTS.POINT.color,
    CONFIG.LIGHTS.POINT.intensity
  );
  pointLight.position.set(
    CONFIG.LIGHTS.POINT.position.x,
    CONFIG.LIGHTS.POINT.position.y,
    CONFIG.LIGHTS.POINT.position.z
  );
  scene.add(pointLight);
};

const setupFaceObject = (scene: THREE.Scene, faceObject: GLTF): void => {
  faceObject.scene.position.set(0, -5, 0);
  faceObject.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.isFace = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(faceObject.scene);
};

const setupSunglassObject = (faceObject: GLTF, sunglassObject: GLTF): void => {
  const faceBox = new THREE.Box3().setFromObject(faceObject.scene);
  const faceCenter = faceBox.getCenter(new THREE.Vector3());
  const faceSize = faceBox.getSize(new THREE.Vector3());

  sunglassObject.scene.position.set(
    faceCenter.x,
    faceCenter.y + faceSize.y / 2,
    faceCenter.z + faceSize.z / 2
  );
  sunglassObject.scene.scale.set(
    CONFIG.OBJECTS.SUNGLASS_SCALE,
    CONFIG.OBJECTS.SUNGLASS_SCALE,
    CONFIG.OBJECTS.SUNGLASS_SCALE
  );

  faceObject.scene.add(sunglassObject.scene);
};

const OBJECT_DATA: ObjectData[] = [
  { name: "sparkle", position: [3, 3, 7] },
  { name: "snowflake", position: [-3, 3, 7] },
  { name: "lamp", position: [-3, -6, 6] },
  { name: "bulb", position: [7, 0, 3] },
  { name: "swirl", position: [-8, 0, 3] },
  { name: "cherry", position: [3, -6, 6] },
];

const createAndAddObjects = async (
  objectGroup: THREE.Group,
  faceObject: GLTF
): Promise<void> => {
  const faceBox = new THREE.Box3().setFromObject(faceObject.scene);
  const standardSize = faceBox.getSize(new THREE.Vector3()).x;

  const loadPromises = OBJECT_DATA.map(async (objectData) => {
    try {
      const obj = await createObject(objectData.name);
      const objBox = new THREE.Box3().setFromObject(obj.scene);
      const objSize = objBox.getSize(new THREE.Vector3());
      const scaleFactor =
        standardSize / 5 / Math.max(objSize.x, objSize.y, objSize.z);

      obj.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
      obj.scene.position.set(...objectData.position);
      objectGroup.add(obj.scene);
    } catch (error) {
      console.error(`Failed to load object: ${objectData.name}`, error);
    }
  });

  await Promise.all(loadPromises);
};

/**clean up */
const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
  if (object.parent) {
    object.parent.remove(object);
  }
};

export default function ProfilePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseOverFace = useRef<boolean>(false);
  const animationFrameId = useRef<number | null>(null);
  const lastMouseUpdate = useRef<number>(0);
  const mousePosition = useRef<MousePosition>({ x: 0, y: 0 });
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);

  const onMouseMove = useCallback(
    (
      event: MouseEvent,
      camera: THREE.Camera,
      faceObject: GLTF,
      objectGroup: THREE.Group
    ) => {
      const now = performance.now();
      if (now - lastMouseUpdate.current < CONFIG.ANIMATION.MOUSE_THROTTLE_MS) {
        return;
      }
      lastMouseUpdate.current = now;

      const newX = (event.clientX / window.innerWidth) * 2 - 1;
      const newY = -(event.clientY / window.innerHeight) * 2 + 1;

      if (
        Math.abs(mousePosition.current.x - newX) < 0.001 &&
        Math.abs(mousePosition.current.y - newY) < 0.001
      ) {
        return;
      }

      mousePosition.current.x = newX;
      mousePosition.current.y = newY;

      if (!raycasterRef.current) raycasterRef.current = new THREE.Raycaster();
      if (!mouseRef.current) mouseRef.current = new THREE.Vector2();

      mouseRef.current.set(mousePosition.current.x, mousePosition.current.y);
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      if (faceObject?.scene) {
        const intersects = raycasterRef.current.intersectObjects(
          [faceObject.scene],
          true
        );
        mouseOverFace.current = intersects.some(
          (obj) => obj.object.userData.isFace
        );

        faceObject.scene.rotation.x +=
          (mousePosition.current.y / 10 - faceObject.scene.rotation.x) *
          CONFIG.ANIMATION.ROTATION_SPEED;
        faceObject.scene.rotation.y +=
          (mousePosition.current.x / 10 - faceObject.scene.rotation.y) *
          CONFIG.ANIMATION.ROTATION_SPEED;
      }

      if (objectGroup) {
        objectGroup.rotation.x +=
          (-mousePosition.current.y / 10 - objectGroup.rotation.x) *
          CONFIG.ANIMATION.ROTATION_SPEED;
        objectGroup.rotation.y +=
          (-mousePosition.current.x / 10 - objectGroup.rotation.y) *
          CONFIG.ANIMATION.ROTATION_SPEED;
      }
    },
    []
  );

  const initThree = useCallback(async (): Promise<() => void> => {
    const mount = mountRef.current;
    if (!mount) return () => {};

    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer();

    mount.appendChild(renderer.domElement);

    const controls = setupControls(camera, renderer);
    setupLights(scene);

    let faceObject: GLTF | null = null;
    let sunglassObject: GLTF | null = null;
    const objectGroup = new THREE.Group();
    scene.add(objectGroup);

    try {
      faceObject = await createObject("emoji");
      setupFaceObject(scene, faceObject);

      sunglassObject = await createObject("sunglasses");
      if (faceObject) {
        setupSunglassObject(faceObject, sunglassObject);
      }
      await createAndAddObjects(objectGroup, faceObject);
    } catch (error) {
      console.error("Failed to load initial 3D objects:", error);
      return () => {};
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (faceObject && sunglassObject) {
        onMouseMove(event, camera, faceObject, objectGroup);
      }
    };

    renderer.domElement.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    let lastFrameTime = 0;

    const animate = (currentTime: number) => {
      animationFrameId.current = requestAnimationFrame(animate);

      if (currentTime - lastFrameTime < CONFIG.ANIMATION.FRAME_RATE_LIMIT) {
        return;
      }
      lastFrameTime = currentTime;

      controls.update();

      if (faceObject && sunglassObject) {
        const faceBox = new THREE.Box3().setFromObject(faceObject.scene);
        const targetY = mouseOverFace.current
          ? faceBox.max.y / 2 + 5
          : faceBox.max.y / 2;

        sunglassObject.scene.position.y = THREE.MathUtils.lerp(
          sunglassObject.scene.position.y,
          targetY,
          CONFIG.ANIMATION.LERP_FACTOR
        );
      }
      renderer.render(scene, camera);
    };
    animate(0);

    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, CONFIG.ANIMATION.RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      // 애니메이션 정지
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }

      // 리사이즈 타이머 정리
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
        resizeTimeout = null;
      }

      // 이벤트 리스너 제거
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      // DOM에서 렌더러 제거
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }

      // 모든 3D 객체 정리
      scene.children.forEach((object) => disposeObject(object));
      scene.clear();

      // 추가 정리 작업
      if (raycasterRef.current) {
        raycasterRef.current = null;
      }
      if (mouseRef.current) {
        mouseRef.current = null;
      }

      // Three.js 객체들 정리
      controls.dispose();
      renderer.dispose();
    };
  }, [onMouseMove]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    initThree().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [initThree]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
      ref={mountRef}
    />
  );
}
