import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
// 텍스트 관련 import (현재 사용하지 않음)
// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
// import { FontLoader, FontData } from "three/examples/jsm/loaders/FontLoader";
// import helvetiker_regular from "three/examples/fonts/helvetiker_regular.typeface.json";

const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  return scene;
};

const createCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 25);
  return camera;
};

const createRenderer = (): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
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

// 텍스트 객체 생성 함수 (현재 사용하지 않음)
// const createTextObject = async (string: string): Promise<THREE.Mesh> => {
//   const loader = new FontLoader();
//   const font = loader.parse(helvetiker_regular as unknown as FontData);
//   const textGeometry = new TextGeometry(string, {
//     font: font,
//     size: 4,
//     height: 1,
//     curveSegments: 8,
//     bevelEnabled: true,
//     bevelThickness: 0.1,
//     bevelSize: 0.2,
//     bevelOffset: 0,
//     bevelSegments: 5,
//   });
//   textGeometry.computeBoundingBox();
//   textGeometry.center();
//   const material = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
//   const textMesh = new THREE.Mesh(textGeometry, material);
//   return textMesh;
// };

const setupControls = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): OrbitControls => {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;
  controls.update();
  return controls;
};

const setupLights = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0xfefefe, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 10, 7).normalize();
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  pointLight.position.set(-10, -10, 10);
  scene.add(pointLight);
};

const setupFaceObject = (scene: THREE.Scene, faceObject: GLTF) => {
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

const setupSunglassObject = (faceObject: GLTF, sunglassObject: GLTF) => {
  const faceBox = new THREE.Box3().setFromObject(faceObject.scene);
  const faceCenter = faceBox.getCenter(new THREE.Vector3());
  const faceSize = faceBox.getSize(new THREE.Vector3());

  sunglassObject.scene.position.set(
    faceCenter.x,
    faceCenter.y + faceSize.y / 2,
    faceCenter.z + faceSize.z / 2
  );
  sunglassObject.scene.scale.set(8, 8, 8);

  faceObject.scene.add(sunglassObject.scene);
};

const createAndAddObjects = async (
  objectGroup: THREE.Group,
  faceObject: GLTF
) => {
  const objectNames = [
    { name: "sparkle", position: [3, 3, 7] },
    { name: "snowflake", position: [-3, 3, 7] },
    { name: "lamp", position: [-3, -6, 6] },
    { name: "bulb", position: [7, 0, 3] },
    { name: "swirl", position: [-8, 0, 3] },
    { name: "cherry", position: [3, -6, 6] },
  ];
  const faceBox = new THREE.Box3().setFromObject(faceObject.scene);
  const standardSize = faceBox.getSize(new THREE.Vector3()).x;

  for (const objectData of objectNames) {
    try {
      const obj = await createObject(objectData.name);
      const objBox = new THREE.Box3().setFromObject(obj.scene);
      const objSize = objBox.getSize(new THREE.Vector3());
      const scaleFactor =
        standardSize / 5 / Math.max(objSize.x, objSize.y, objSize.z);
      obj.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
      obj.scene.position.set(
        objectData.position[0],
        objectData.position[1],
        objectData.position[2]
      );
      objectGroup.add(obj.scene);
    } catch (error) {
      console.error(`Failed to load and add object: ${objectData.name}`, error);
    }
  }
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

  // 성능 최적화: 마우스 이벤트 throttling을 위한 ref
  const lastMouseUpdate = useRef<number>(0);
  const MOUSE_THROTTLE_MS = 16; // 60fps에 맞춤

  // 성능 최적화: 마우스 위치 캐싱
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 성능 최적화: raycaster 재사용을 위한 ref
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
      if (now - lastMouseUpdate.current < MOUSE_THROTTLE_MS) {
        return; // throttling으로 불필요한 계산 방지
      }
      lastMouseUpdate.current = now;

      // 마우스 위치 계산 및 캐싱
      const newX = (event.clientX / window.innerWidth) * 2 - 1;
      const newY = -(event.clientY / window.innerHeight) * 2 + 1;

      // 위치가 실제로 변경되었을 때만 업데이트
      if (
        Math.abs(mousePosition.current.x - newX) < 0.001 &&
        Math.abs(mousePosition.current.y - newY) < 0.001
      ) {
        return;
      }

      mousePosition.current.x = newX;
      mousePosition.current.y = newY;

      // raycaster 재사용
      if (!raycasterRef.current) raycasterRef.current = new THREE.Raycaster();
      if (!mouseRef.current) mouseRef.current = new THREE.Vector2();

      mouseRef.current.set(mousePosition.current.x, mousePosition.current.y);
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      if (faceObject && faceObject.scene) {
        const intersects = raycasterRef.current.intersectObjects(
          [faceObject.scene],
          true
        );
        const isOverFace = intersects.some((obj) => obj.object.userData.isFace);
        mouseOverFace.current = isOverFace;

        // 회전 애니메이션 최적화: 더 부드러운 움직임
        const rotationSpeed = 0.1;
        faceObject.scene.rotation.x +=
          (mousePosition.current.y / 10 - faceObject.scene.rotation.x) *
          rotationSpeed;
        faceObject.scene.rotation.y +=
          (mousePosition.current.x / 10 - faceObject.scene.rotation.y) *
          rotationSpeed;
      }
      if (objectGroup) {
        const rotationSpeed = 0.1;
        objectGroup.rotation.x +=
          (-mousePosition.current.y / 10 - objectGroup.rotation.x) *
          rotationSpeed;
        objectGroup.rotation.y +=
          (-mousePosition.current.x / 10 - objectGroup.rotation.y) *
          rotationSpeed;
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
    // let textObject: THREE.Mesh | null = null;
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
      // textObject = await createTextObject(`Welcome to\nmy blog!`);
      // textObject.position.set(-10, 5, 0);
      // scene.add(textObject);
    } catch (error) {
      console.error("Failed to load initial 3D objects:", error);
      return () => {};
    }

    // 성능 최적화: 이벤트 리스너 최적화
    const handleMouseMove = (event: MouseEvent) => {
      if (faceObject && sunglassObject) {
        onMouseMove(event, camera, faceObject, objectGroup);
      }
    };

    // 성능 최적화: passive 이벤트 리스너 사용
    renderer.domElement.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    // 성능 최적화: 애니메이션 최적화를 위한 변수들
    let lastFrameTime = 0;
    const FRAME_RATE_LIMIT = 1000 / 60; // 60fps 제한

    const animate = (currentTime: number) => {
      animationFrameId.current = requestAnimationFrame(animate);

      // 프레임 레이트 제한으로 불필요한 렌더링 방지
      if (currentTime - lastFrameTime < FRAME_RATE_LIMIT) {
        return;
      }
      lastFrameTime = currentTime;

      controls.update();

      // 성능 최적화: sunglass 애니메이션 최적화
      if (faceObject && sunglassObject) {
        const faceBox = new THREE.Box3().setFromObject(faceObject.scene);
        const targetY = mouseOverFace.current
          ? faceBox.max.y / 2 + 5
          : faceBox.max.y / 2;

        // 더 부드러운 애니메이션을 위한 lerp 사용
        const lerpFactor = 0.1;
        sunglassObject.scene.position.y = THREE.MathUtils.lerp(
          sunglassObject.scene.position.y,
          targetY,
          lerpFactor
        );
      }
      renderer.render(scene, camera);
    };
    animate(0);

    // 성능 최적화: 리사이즈 이벤트 throttling
    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 100); // 100ms debounce
    };
    window.addEventListener("resize", handleResize, { passive: true });

    /**성능 최적화: 완전한 cleanup */
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

      // 메모리 정리 (const 변수이므로 null 할당 제거)
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
