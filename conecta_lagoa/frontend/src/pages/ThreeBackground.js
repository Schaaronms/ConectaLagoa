// components/ThreeBackground.jsx
// Substitui o <ParticleCanvas /> da Home.jsx
//
// Instale: npm install three
//
// Uso na Home.jsx:
//   import ThreeBackground from "../components/ThreeBackground";
//   ... troque <ParticleCanvas /> por <ThreeBackground />

import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 120;
const CONNECTION_DIST = 2.2;
const DEPTH_RANGE = 6;

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Setup ────────────────────────────────────────────────────────────────
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 10;

    // ── Particles ────────────────────────────────────────────────────────────
    const positions = [];
    const velocities = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.push(
        (Math.random() - 0.5) * 20,   // x
        (Math.random() - 0.5) * 12,   // y
        (Math.random() - 0.5) * DEPTH_RANGE  // z
      );
      velocities.push(
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.003
      );
    }

    const ptGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(positions);
    ptGeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));

    // Custom shader material — partículas com glow suave
    const ptMat = new THREE.ShaderMaterial({
      uniforms: {
        uSize:  { value: 3.5 * renderer.getPixelRatio() },
        uColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        uniform float uSize;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (8.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.25, 0.5, d);
          gl_FragColor = vec4(uColor, alpha * 0.75);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    // ── Lines (conexões) ─────────────────────────────────────────────────────
    // Usamos uma LineSegments com buffer dinâmico
    const maxLines   = PARTICLE_COUNT * PARTICLE_COUNT;
    const linePos    = new Float32Array(maxLines * 6); // 2 pontos × 3 coords por linha
    const lineColors = new Float32Array(maxLines * 6); // cor por vértice

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeo.setAttribute("color",    new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Mouse parallax ───────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const targetRot = { x: 0, y: 0 };

    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Touch support
    const onTouch = (e) => {
      const t = e.touches[0];
      mouse.x = (t.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (t.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("touchmove", onTouch, { passive: true });

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ───────────────────────────────────────────────────────
    let raf;

    // Cor de conexão — azul royal levemente brilhante
    const connColor = new THREE.Color(0x4488ff);

    const animate = () => {
      raf = requestAnimationFrame(animate);

      // Suaviza rotação da cena em direção ao mouse
      targetRot.x += (mouse.y * 0.18 - targetRot.x) * 0.04;
      targetRot.y += (mouse.x * 0.28 - targetRot.y) * 0.04;
      scene.rotation.x = targetRot.x;
      scene.rotation.y = targetRot.y;

      // Move partículas
      const pos = ptGeo.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
        pos[ix] += velocities[ix];
        pos[iy] += velocities[iy];
        pos[iz] += velocities[iz];
        // wrap nas bordas
        if (pos[ix] >  10) pos[ix] = -10;
        if (pos[ix] < -10) pos[ix] =  10;
        if (pos[iy] >   6) pos[iy] =  -6;
        if (pos[iy] <  -6) pos[iy] =   6;
        if (pos[iz] >  DEPTH_RANGE / 2) pos[iz] = -DEPTH_RANGE / 2;
        if (pos[iz] < -DEPTH_RANGE / 2) pos[iz] =  DEPTH_RANGE / 2;
      }
      ptGeo.attributes.position.needsUpdate = true;

      // Recalcula conexões
      let lineCount = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const ax = pos[i * 3], ay = pos[i * 3 + 1], az = pos[i * 3 + 2];
          const bx = pos[j * 3], by = pos[j * 3 + 1], bz = pos[j * 3 + 2];
          const dx = ax - bx, dy = ay - by, dz = az - bz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.6;
            const base  = lineCount * 6;

            // posições dos dois vértices
            linePos[base]     = ax; linePos[base + 1] = ay; linePos[base + 2] = az;
            linePos[base + 3] = bx; linePos[base + 4] = by; linePos[base + 5] = bz;

            // cor com alpha codificado no R (trick para vertexColors sem alpha por vértice)
            lineColors[base]     = connColor.r * alpha * 1.6;
            lineColors[base + 1] = connColor.g * alpha * 1.6;
            lineColors[base + 2] = connColor.b * alpha * 1.6;
            lineColors[base + 3] = connColor.r * alpha * 1.6;
            lineColors[base + 4] = connColor.g * alpha * 1.6;
            lineColors[base + 5] = connColor.b * alpha * 1.6;

            lineCount++;
            if (lineCount >= maxLines) break;
          }
        }
        if (lineCount >= maxLines) break;
      }

      // Só renderiza as linhas calculadas
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate    = true;
      lineGeo.setDrawRange(0, lineCount * 2);

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      ptGeo.dispose();
      ptMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
