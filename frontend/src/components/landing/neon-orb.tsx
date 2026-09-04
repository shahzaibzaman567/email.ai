"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function NeonOrb() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 3;

    // Neon glowing sphere
    const geometry = new THREE.IcosahedronGeometry(1, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff2d78,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wire = new THREE.Mesh(geometry, wireMat);
    scene.add(wire);

    // Ambient + point lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const pinkLight = new THREE.PointLight(0xff2d78, 4, 10);
    pinkLight.position.set(2, 2, 2);
    scene.add(pinkLight);
    const goldLight = new THREE.PointLight(0xffd700, 3, 10);
    goldLight.position.set(-2, -1, 2);
    scene.add(goldLight);

    // Floating particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 300;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) {
      pPositions[i] = (Math.random() - 0.5) * 10;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.015,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    let frame = 0;
    const animate = () => {
      frame++;
      sphere.rotation.x = frame * 0.005;
      sphere.rotation.y = frame * 0.007;
      wire.rotation.x = frame * 0.005;
      wire.rotation.y = frame * 0.007;
      particles.rotation.y = frame * 0.001;
      pinkLight.position.x = Math.sin(frame * 0.02) * 3;
      pinkLight.position.y = Math.cos(frame * 0.015) * 2;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
