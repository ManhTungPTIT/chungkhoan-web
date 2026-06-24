import { useEffect, useRef } from "react";
import * as THREE from "three";

const GREEN = 0x20f263;
const RED = 0xff304a;
const GOLD = 0xffd34e;
const LEFT_PAN_X = -2.65;
const RIGHT_PAN_X = 2.65;

function clampPercent(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, numericValue));
}

export function calculateBalanceTilt({ buyPercent = 0, sellPercent = 0 }) {
  const buy = clampPercent(buyPercent);
  const sell = clampPercent(sellPercent);

  return THREE.MathUtils.clamp((buy - sell) / 520, -0.14, 0.14);
}

function createCylinder({ radius, height, color, opacity = 1, position }) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 48, 1, true);
  const material = new THREE.MeshPhysicalMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    roughness: 0.18,
    metalness: 0.08,
    transmission: opacity < 1 ? 0.18 : 0,
    emissive: color,
    emissiveIntensity: opacity < 1 ? 0.3 : 0.08,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  return mesh;
}

function createPan(color) {
  const group = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.07, 12, 72),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.75,
      roughness: 0.24,
      emissive: color,
      emissiveIntensity: 0.12,
    }),
  );
  rim.rotation.x = Math.PI / 2;

  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 0.82, 0.12, 48),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.65,
      roughness: 0.32,
      emissive: color,
      emissiveIntensity: 0.08,
    }),
  );
  plate.position.y = -0.05;

  group.add(rim, plate);
  return group;
}

function addCupRings(group, color, height, baseY, x) {
  const ringCount = 7;
  for (let index = 0; index < ringCount; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.01, 8, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.x = x;
    ring.position.y = baseY + (height / ringCount) * index;
    group.add(ring);
  }
}

function createCable(x, topY, bottomY, material) {
  const height = Math.max(0.1, topY - bottomY);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, height, 12), material);
  cable.position.set(x, bottomY + height / 2, 0);
  return cable;
}

export default function SupplyBalanceScene({ buyPercent = 0, sellPercent = 0 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined" || !window.WebGLRenderingContext) {
      return undefined;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 3.1, 10.8);
    camera.lookAt(0, 0.65, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const keyLight = new THREE.PointLight(0xffd34e, 150, 22);
    keyLight.position.set(0, 6, 6);
    scene.add(keyLight);

    const greenLight = new THREE.PointLight(GREEN, 80, 12);
    greenLight.position.set(-3.8, 2.8, 3.2);
    scene.add(greenLight);

    const redLight = new THREE.PointLight(RED, 60, 12);
    redLight.position.set(3.7, 1.5, 3.2);
    scene.add(redLight);

    const root = new THREE.Group();
    root.rotation.x = -0.05;
    root.scale.setScalar(0.82);
    scene.add(root);

    const buy = clampPercent(buyPercent);
    const sell = clampPercent(sellPercent);
    const buyHeight = 1.45 + (buy / 100) * 2.3;
    const sellHeight = 1.05 + (sell / 100) * 2.05;
    const beamTilt = calculateBalanceTilt({ buyPercent: buy, sellPercent: sell });

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: GOLD,
      metalness: 0.82,
      roughness: 0.22,
      emissive: GOLD,
      emissiveIntensity: 0.12,
    });

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.15, 0.22, 64), goldMaterial);
    pedestal.position.y = -1.5;
    pedestal.receiveShadow = true;
    root.add(pedestal);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 2.15, 32), goldMaterial);
    column.position.y = -0.42;
    root.add(column);

    const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), goldMaterial);
    pivot.position.y = 0.66;
    root.add(pivot);

    const beamGroup = new THREE.Group();
    beamGroup.position.y = 0.66;
    beamGroup.rotation.z = beamTilt;
    root.add(beamGroup);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.12, 0.12), goldMaterial);
    beam.castShadow = true;
    beamGroup.add(beam);

    const leftAnchorY = 0.66 + Math.sin(beamTilt) * LEFT_PAN_X;
    const rightAnchorY = 0.66 + Math.sin(beamTilt) * RIGHT_PAN_X;
    const leftPanY = leftAnchorY - 0.78;
    const rightPanY = rightAnchorY - 0.78;

    root.add(createCable(LEFT_PAN_X, leftAnchorY, leftPanY + 0.12, goldMaterial));
    root.add(createCable(RIGHT_PAN_X, rightAnchorY, rightPanY + 0.12, goldMaterial));

    const leftPan = createPan(GREEN);
    leftPan.position.set(LEFT_PAN_X, leftPanY, 0);
    root.add(leftPan);

    const rightPan = createPan(RED);
    rightPan.position.set(RIGHT_PAN_X, rightPanY, 0);
    root.add(rightPan);

    const buyCup = createCylinder({
      radius: 0.72,
      height: buyHeight,
      color: GREEN,
      opacity: 0.42,
      position: [LEFT_PAN_X, leftPanY + buyHeight / 2, 0],
    });
    root.add(buyCup);
    addCupRings(root, GREEN, buyHeight, leftPanY + 0.26, LEFT_PAN_X);

    const sellCup = createCylinder({
      radius: 0.67,
      height: sellHeight,
      color: RED,
      opacity: 0.4,
      position: [RIGHT_PAN_X, rightPanY + sellHeight / 2, 0],
    });
    root.add(sellCup);
    addCupRings(root, RED, sellHeight, rightPanY + 0.26, RIGHT_PAN_X);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 72),
      new THREE.MeshBasicMaterial({ color: 0xffd34e, transparent: true, opacity: 0.08 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.62;
    root.add(ground);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const safeWidth = Math.max(1, width);
      const safeHeight = Math.max(1, height);
      renderer.setSize(safeWidth, safeHeight, false);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let animationFrame = 0;
    const animate = () => {
      root.rotation.y = Math.sin(Date.now() * 0.00045) * 0.035;
      pivot.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.025);
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.domElement.remove();
    };
  }, [buyPercent, sellPercent]);

  return (
    <div
      ref={containerRef}
      className="supply-balance__scene"
      role="img"
      aria-label="Mô hình cân cung cầu"
      data-buy-percent={buyPercent}
      data-sell-percent={sellPercent}
    />
  );
}
