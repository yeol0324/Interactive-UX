import React, { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
export default function ThreePage({}) {
  const initThree = async () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    // Canvas 크기 설정
    canvas.width = 500;
    canvas.height = 500;

    // Scene 만들기
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("skyblue");

    // Renderer 생성 및 크기 설정
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(canvas.width, canvas.height);

    // 카메라 생성 및 위치 설정
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 2);

    // 바닥 생성 및 Scene에 추가
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshBasicMaterial({ color: "#fff" });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 조명 추가
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    light.castShadow = true;
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040); // 약간의 주변광 추가
    scene.add(ambientLight);

    // 눈사람 모델 로드
    const loader = new GLTFLoader();
    const url = `${process.env.PUBLIC_URL}/snow_man.glb`;
    const snowman = await loader.loadAsync(url);

    snowman.scene.position.set(0, 0, 0);

    // Scene에 추가
    scene.add(snowman.scene);

    // 조형물 생성 및 scene 에 추가
    const coneGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
    const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    // 여러 개의 조형물을 다른 위치에 추가
    const conePositions = [
      { x: 0.4, y: 0.2, z: 0.3 },
      { x: 0.2, y: 0.2, z: 0 },
      { x: -0.2, y: 0.2, z: 0.2 },
      { x: -0.3, y: 0.2, z: -0.2 },
    ];

    conePositions.forEach((pos) => {
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.set(pos.x, pos.y, pos.z); // 원하는 위치로 조절
      scene.add(cone);
    });

    // 눈 생성 및 scene 에 추가
    const snowGeometry = new THREE.SphereGeometry(0.03, 0.03, 36);
    const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const snow = new THREE.Mesh(snowGeometry, snowMaterial);

    // 여러 개의 눈을 다른 위치에 추가
    const positions = [
      { x: 0.5, y: 0.5, z: 0.1 },
      { x: 0.2, y: 0.5, z: 0.3 },
      { x: -0.2, y: 0.7, z: 0.2 },
      { x: -0.5, y: 0.3, z: -0.3 },
      { x: 0.2, y: 0.3, z: -0.1 },
      { x: 0.2, y: 0.3, z: 0.3 },
      { x: -0.2, y: 0.3, z: 0 },
    ];

    positions.forEach((pos) => {
      const snow = new THREE.Mesh(snowGeometry, snowMaterial);
      snow.position.set(pos.x, pos.y, pos.z);
      scene.add(snow);
    });

    // control 추가
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    const animate = () => {
      requestAnimationFrame(animate);

      snowman.scene.rotation.y += 0.01;
      // controls.update();

      renderer.render(scene, camera);
    };

    animate();
    // 초기 렌더링 호출
    renderer.render(scene, camera);
  };

  useEffect(() => {
    initThree();
  }, []);

  return (
    <>
      <canvas
        id="canvas"
        style={{ display: "block", width: "500px", height: "500px" }}
      ></canvas>
    </>
  );
}
