import React, { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function ProfilePage() {
  const initThree = async () => {
    // 씬 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 카메라 생성
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    camera.position.set(0, 0, 20);

    // 렌더러 생성
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const faceObject = await createObject("emoji");
    faceObject.scene.position.set(0, -5, 0);
    scene.add(faceObject.scene);

    const sunglassObject = await createObject("sunglasses");
    sunglassObject.scene.position.set(0, 3.5, 4.5);
    sunglassObject.scene.scale.set(8, 8, 8);

    // 경계 상자 계산
    const faceBox = new THREE.Box3().setFromObject(faceObject.scene);

    // faceObject의 크기 계산
    const faceSize = new THREE.Vector3();
    faceBox.getSize(faceSize);

    // sunglassObject를 faceObject의 앞쪽에 배치
    sunglassObject.scene.position.set(0, faceBox.max.y / 2, faceBox.max.z);

    faceObject.scene.add(sunglassObject.scene);

    // TODO: 랜덤 오브젝트 생성
    // 객체 그룹 생성
    const objectGroup = new THREE.Group();
    scene.add(objectGroup);

    // Math.floor((Math.random() * (최대값 - 최소값)) + 최소값)

    // 무작위 객체 생성 및 배치
    for (let i = 0; i < 10; i++) {
      // const obj = await createObject("lightning");
      const obj = await createObject("sparkle");
      const obj02 = await createObject("heart");
      obj.scene.position.set(
        (Math.random() * 20 - 10) * 1.5,
        (Math.random() * 20 - 10) * 1.5,
        (Math.random() * 20 - 10) * 1.5
      );
      obj02.scene.position.set(
        (Math.random() * 20 - 10) * 1.5,
        (Math.random() * 20 - 10) * 1.5,
        (Math.random() * 20 - 10) * 1.5
      );
      obj.scene.scale.set(6, 6, 6);
      objectGroup.add(obj.scene);
      // obj02.scene.scale.set(0.01, 0.01, 0.01);
      objectGroup.add(obj02.scene);
    }

    // 오비트 컨트롤 생성
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    sunglassObject.scene.position.set(0, 3.5, 4.5);
    sunglassObject.scene.scale.set(8, 8, 8);

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0x404040); // 주변광 추가
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 방향광 추가
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 마우스 이동에 따른 객체 이동
    const mouse = new THREE.Vector2();
    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // 화면 중앙을 기준으로 마우스 위치에 따라 큐브 이동
      faceObject.scene.rotation.x = mouse.x / 10; // 적절한 값으로 조정
      faceObject.scene.rotation.y = mouse.y / 10; // 적절한 값으로 조정

      // 객체 그룹 반대로 회전
      objectGroup.rotation.x = -mouse.x / 10; // 적절한 값으로 조정
      objectGroup.rotation.y = -mouse.y / 10; // 적절한 값으로 조정
    };

    // 이벤트 리스너 등록
    window.addEventListener("mousemove", onMouseMove);

    // 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 창 크기 변경 시 처리
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onWindowResize);

    // 정리: 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onWindowResize);
      document.body.removeChild(renderer.domElement);
    };
  };
  useEffect(() => {
    const asyncInit = async () => {
      const cleanup = await initThree();
      return cleanup;
    };
    const cleanupPromise = asyncInit();

    return () => {
      cleanupPromise.then((cleanup) => cleanup());
    };
  }, []);
  return <div />;
}
const createObject = async (fileName: string) => {
  const loader = new GLTFLoader();
  const url = `${process.env.PUBLIC_URL}/glb/${fileName}.glb`;
  const gltf = await loader.loadAsync(url);
  return gltf;
};
