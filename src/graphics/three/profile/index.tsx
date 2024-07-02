import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { FontLoader, FontData } from "three/examples/jsm/loaders/FontLoader";
import helvetiker_regular from "three/examples/fonts/helvetiker_regular.typeface.json";

export default function ProfilePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseOverFace = useRef<boolean>(false);

  const onMouseMove = useCallback(
    (
      event: MouseEvent,
      camera: THREE.Camera,
      scene: THREE.Scene,
      raycaster: THREE.Raycaster,
      mouse: THREE.Vector2,
      faceObject: GLTF,
      objectGroup: THREE.Group
    ) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      const isOverFace = intersects.some((obj) => obj.object.userData.isFace);
      mouseOverFace.current = isOverFace;

      faceObject.scene.rotation.x = mouse.y / 10;
      faceObject.scene.rotation.y = mouse.x / 10;

      objectGroup.rotation.x = -mouse.y / 10;
      objectGroup.rotation.y = -mouse.x / 10;
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

    const faceObject = await createObject("emoji");
    setupFaceObject(scene, faceObject);

    const sunglassObject = await createObject("sunglasses");
    setupSunglassObject(faceObject, sunglassObject);

    const objectGroup = new THREE.Group();
    scene.add(objectGroup);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      onMouseMove(
        event,
        camera,
        scene,
        raycaster,
        mouse,
        faceObject,
        objectGroup
      );
    };

    const faceBox = new THREE.Box3().setFromObject(faceObject.scene);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      const targetY = mouseOverFace.current
        ? faceBox.max.y / 2 + 5
        : faceBox.max.y / 2;
      sunglassObject.scene.position.y +=
        (targetY - sunglassObject.scene.position.y) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    await createAndAddObjects(objectGroup, faceObject);

    renderer.domElement.addEventListener("mousemove", handleMouseMove);

    const textObject = await createTextObject("hover me !");
    textObject.position.set(-10, 5, 0);
    scene.add(textObject);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);

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
      };

      disposeObject(faceObject.scene);
      disposeObject(sunglassObject.scene);

      if (textObject) {
        disposeObject(textObject);
      }

      renderer.dispose();
    };
  }, [onMouseMove]);

  useEffect(() => {
    const cleanupPromise: Promise<() => void> = initThree();

    return () => {
      cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup();
      });
    };
  }, [initThree]);

  return (
    <div style={{ position: "absolute", top: 0, left: 0 }} ref={mountRef} />
  );
}

const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  return scene;
};

const createCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(0, 0, 25);
  return camera;
};

const createRenderer = (): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  return renderer;
};

const createObject = async (fileName: string): Promise<GLTF> => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/path/to/draco/gltf/");
  loader.setDRACOLoader(dracoLoader);
  const url = `${process.env.PUBLIC_URL}/glb/${fileName}.glb`;
  const gltf = await loader.loadAsync(url);

  // 텍스처가 있는지 확인하고 필요시 업데이트
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => {
        if (material.map) {
          material.map.needsUpdate = true; // 텍스처가 업데이트되었음을 표시
        }
      });
    }
  });
  return gltf;
};

const createTextObject = async (string: string): Promise<THREE.Mesh> => {
  const loader = new FontLoader();
  const font = loader.parse(helvetiker_regular as unknown as FontData);

  const textGeometry = new TextGeometry(string, {
    font: font,
    size: 5,
    height: 1,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.2,
    bevelOffset: 0,
    bevelSegments: 3,
  });
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const textMesh = new THREE.Mesh(textGeometry, material);
  return textMesh;
};

const setupFaceObject = (scene: THREE.Scene, faceObject: GLTF) => {
  faceObject.scene.position.set(0, -5, 0);
  faceObject.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.isFace = true;
    }
  });
  scene.add(faceObject.scene);
};

const setupSunglassObject = (faceObject: GLTF, sunglassObject: GLTF) => {
  const faceBox = new THREE.Box3().setFromObject(faceObject.scene);
  sunglassObject.scene.position.set(0, faceBox.max.y / 2, faceBox.max.z);
  sunglassObject.scene.scale.set(8, 8, 8);

  sunglassObject.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => {
        if (material.map) {
          material.map.needsUpdate = true; // 텍스처가 업데이트되었음을 표시
        }
      });
    }
  });

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
    { name: "cherry", position: [-5, 3, -2] },
    { name: "bulb", position: [7, 0, 3] },
    { name: "swirl", position: [-8, 0, 3] },
    { name: "lightning", position: [8, -9, -4] },
    { name: "diamond", position: [3, -6, 6] },
  ];
  const faceBox = new THREE.Box3().setFromObject(faceObject.scene);

  for (const object of objectNames) {
    const obj = await createObject(object.name);
    objectGroup.add(replaceObject(obj, faceBox.max.x, object.position).scene);
  }
};

const replaceObject = (
  object: GLTF,
  standardSize: number,
  position: number[]
): GLTF => {
  const objBox = new THREE.Box3().setFromObject(object.scene);
  object.scene.position.set(position[0], position[1], position[2]);
  const objRatio = standardSize / objBox.max.x / 5;
  object.scene.scale.set(objRatio, objRatio, objRatio);
  return object;
};

const setupControls = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): OrbitControls => {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();
  return controls;
};

const setupLights = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0xfefefe);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 1).normalize();
  scene.add(directionalLight);
};
