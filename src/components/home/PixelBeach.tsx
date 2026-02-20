"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import * as THREE from "three";

const NAV_LINKS = [
  { href: "/projects", label: "projects" },
  { href: "/blog", label: "blog" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
];

// Nav text region in normalized coordinates (where in the viewport)
const NAV_REGION = {
  y: 0.50,      // center of screen
  spacing: 0.06, // gap between words as fraction of width
};

// Build a texture with nav labels rendered as pixels on an offscreen canvas.
// Returns the texture data and the normalized x-ranges of each label.
function buildNavTexture(gridCols: number, gridRows: number) {
  const canvas = document.createElement("canvas");
  canvas.width = gridCols;
  canvas.height = gridRows;
  const ctx = canvas.getContext("2d")!;

  const fontSize = Math.max(8, Math.floor(gridRows * 0.08));
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";

  // Measure all labels
  const measurements = NAV_LINKS.map((link) => ({
    ...link,
    width: ctx.measureText(link.label).width,
  }));

  const gapPx = gridCols * NAV_REGION.spacing;
  const totalTextWidth = measurements.reduce((s, m) => s + m.width, 0);
  const totalWidth = totalTextWidth + (measurements.length - 1) * gapPx;
  const maxPairWidth = Math.max(
    measurements[0].width + gapPx + measurements[1].width,
    measurements[2].width + gapPx + measurements[3].width
  );
  const centerY = Math.floor(gridRows * NAV_REGION.y);

  // Draw and record positions
  const positions: { left: number; right: number; top: number; bottom: number }[] = [];

  if (totalWidth <= gridCols) {
    // Single-row horizontal layout (desktop / landscape)
    const startX = Math.floor((gridCols - totalWidth) / 2);
    let curX = startX;
    for (const m of measurements) {
      ctx.fillText(m.label, curX, centerY);
      positions.push({
        left: curX / gridCols,
        right: (curX + m.width) / gridCols,
        top: centerY / gridRows,
        bottom: (centerY + fontSize) / gridRows,
      });
      curX += m.width + gapPx;
    }
  } else if (maxPairWidth <= gridCols) {
    // 2×2 grid layout for narrow screens (portrait mobile, small font)
    const rowGap = fontSize;
    const blockStartY = Math.floor(centerY - fontSize - rowGap / 2);
    const rowYs = [blockStartY, blockStartY + fontSize + rowGap];

    for (let i = 0; i < measurements.length; i++) {
      const m = measurements[i];
      const row = Math.floor(i / 2);
      const col = i % 2;
      const textY = rowYs[row];

      const rowItems = measurements.slice(row * 2, row * 2 + 2);
      const rowWidth = rowItems.reduce((s, ri) => s + ri.width, 0) + (rowItems.length - 1) * gapPx;
      const rowStartX = Math.floor((gridCols - rowWidth) / 2);
      const curX = col === 0 ? rowStartX : rowStartX + rowItems[0].width + gapPx;

      ctx.fillText(m.label, curX, textY);
      positions.push({
        left: curX / gridCols,
        right: (curX + m.width) / gridCols,
        top: textY / gridRows,
        bottom: (textY + fontSize) / gridRows,
      });
    }
  } else {
    // 4-row vertical layout (portrait mobile with large font)
    const rowSpacing = Math.floor(fontSize * 1.3);
    const blockStartY = Math.floor(centerY - (3 * rowSpacing + fontSize) / 2);

    for (let i = 0; i < measurements.length; i++) {
      const m = measurements[i];
      const textY = blockStartY + i * rowSpacing;
      const curX = Math.floor((gridCols - m.width) / 2);

      ctx.fillText(m.label, curX, textY);
      positions.push({
        left: curX / gridCols,
        right: (curX + m.width) / gridCols,
        top: textY / gridRows,
        bottom: (textY + fontSize) / gridRows,
      });
    }
  }

  // Read pixel data — we only need the red channel as brightness
  const imageData = ctx.getImageData(0, 0, gridCols, gridRows);
  const data = new Uint8Array(gridCols * gridRows);
  for (let i = 0; i < gridCols * gridRows; i++) {
    data[i] = imageData.data[i * 4 + 3]; // alpha channel
  }

  return { data, width: gridCols, height: gridRows, positions };
}

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uDark;
  uniform vec2 uMouse;
  uniform sampler2D uNavTex;
  uniform vec2 uNavTexSize;

  const float CELL = 6.0;
  const float DOT_R = 0.3;
  const float PI = 3.14159265;

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      v += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return v;
  }

  float waveCurve(float phase, float inEnd, float holdEnd) {
    // Rush in is 20% faster: compress the in-phase into a shorter window
    float fastIn = inEnd * 0.833; // 1/1.2 = 0.833
    if (phase < fastIn) {
      float t2 = phase / fastIn;
      return t2 * t2 * (3.0 - 2.0 * t2);
    } else if (phase < holdEnd) {
      return 1.0;
    } else {
      // Pull back is slower (takes the remaining time)
      float t2 = (phase - holdEnd) / (1.0 - holdEnd);
      t2 = 1.0 - t2;
      return t2 * t2 * t2;
    }
  }

  float navLookup(vec2 cell, vec2 gridCount) {
    vec2 uv = cell / gridCount;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
    return texture2D(uNavTex, uv).r;
  }

  void main() {
    vec2 fc = gl_FragCoord.xy;
    fc.y = uResolution.y - fc.y;

    vec2 cell = floor(fc / CELL);
    vec2 center = (cell + 0.5) * CELL;
    vec2 gridCount = floor(uResolution / CELL);

    float dist = length(fc - center) / (CELL * 0.5);

    vec3 bg = uDark > 0.5 ? vec3(0.102, 0.102, 0.094) : vec3(0.91, 0.894, 0.871);
    vec3 fg = uDark > 0.5 ? vec3(0.91, 0.894, 0.871) : vec3(0.102, 0.102, 0.094);

    if (dist > DOT_R * 2.0) {
      gl_FragColor = vec4(bg, 1.0);
      return;
    }

    float nx = cell.x / gridCount.x;
    float ny = cell.y / gridCount.y;
    float t = uTime;

    // =============================================
    // CLOSE-UP: looking down at waves hitting the shore
    // Water is flat/uniform — all action is at the edge
    // =============================================

    float shoreY = 0.79;

    // --- Waves washing in and pulling out (vertical motion) ---
    float w1 = waveCurve(fract(t * 0.045), 0.3, 0.42);
    float w2 = waveCurve(fract(t * 0.038 + 0.5), 0.28, 0.38);

    // Wave reach varies over time — sometimes deep pushes, sometimes shallow
    float reachMod = 0.6 + 0.4 * noise(vec2(t * 0.025, 0.0))   // slow drift 0.6–1.0
                   + 0.3 * (sin(t * 0.1) * 0.5 + 0.5);          // periodic swell
    float waveReach = mix(0.0, 0.443 * reachMod, max(w1, w2));

    // Organic edge — variation emerges from random points along the shore
    float shoreWobble = (fbm(vec2(nx * 6.0 + t * 0.15, t * 0.08)) - 0.5) * 0.207
                      + (fbm(vec2(nx * 12.0 - t * 0.1, t * 0.06 + 5.0)) - 0.5) * 0.105;

    float waterLine = shoreY + shoreWobble - waveReach;

    // Water fingers — thin tendrils creeping ahead of the main wash
    float fingerBase = fbm(vec2(nx * 18.0 + t * 0.1, ny * 8.0));
    float fingers = max(0.0, fingerBase - 0.5) * 0.06;
    float tendrilLine = waterLine + fingers;

    bool isWater = ny < waterLine;
    bool isTendril = ny < tendrilLine && !isWater;

    // --- Residual foam tracking (where waves have been) ---
    float maxReach = 0.0;
    for (float k = 0.0; k < 5.0; k += 1.0) {
      float pastT = t - k * 0.7;
      float pw1 = waveCurve(fract(pastT * 0.045), 0.3, 0.42);
      float pw2 = waveCurve(fract(pastT * 0.038 + 0.5), 0.28, 0.38);
      float pastReachMod = 0.6 + 0.4 * noise(vec2(pastT * 0.025, 0.0))
                        + 0.3 * (sin(pastT * 0.1) * 0.5 + 0.5);
      float pastReach = mix(0.0, 0.443 * pastReachMod, max(pw1, pw2));
      float pastWobble = (fbm(vec2(nx * 6.0 + pastT * 0.15, pastT * 0.08)) - 0.5) * 0.207
                       + (fbm(vec2(nx * 12.0 - pastT * 0.1, pastT * 0.06 + 5.0)) - 0.5) * 0.105;
      float pastLine = shoreY + pastWobble - pastReach;
      float fade = 1.0 - k / 5.0;
      maxReach = max(maxReach, (shoreY - pastLine) * fade);
    }

    // --- Nav text ---
    float isNav = navLookup(cell, gridCount);

    float brightness = 0.0;

    if (isNav > 0.3 && !isWater && !isTendril) {
      float distToWater = ny - tendrilLine;
      float dissolve = smoothstep(0.0, 0.04, distToWater);
      float ripple = 1.0;
      if (distToWater < 0.04) {
        ripple = step(0.3, hash(cell * 0.37 + floor(vec2(t * 3.0))));
      }
      brightness = 0.9 * dissolve * ripple;

    } else if (isWater || isTendril) {
      // --- WATER ---
      float depthFromShore = waterLine - ny;

      if (isTendril) {
        // Thin water film creeping on sand
        float sheen = fbm(vec2(nx * 24.0 + t * 0.6, ny * 16.0)) * 0.08 + 0.04;
        brightness = sheen;
      } else {
        // Flat open water — clean, no texture
        brightness = 0.02;

        // Foam only right at the shore edge — thin crisp line
        float foamZone = 0.02;
        if (depthFromShore < foamZone) {
          // Bright leading edge
          float leadingEdge = smoothstep(0.02, 0.002, depthFromShore);
          brightness = max(brightness, leadingEdge * 0.8);

          // Thin lacy foam just behind the edge
          float foamEdge = smoothstep(foamZone, 0.005, depthFromShore);
          float foamTex = fbm(vec2(nx * 22.0 + t * 0.8, ny * 16.0 - t * 0.4));
          float foam = foamEdge * smoothstep(0.35, 0.6, foamTex) * 0.4;
          brightness = max(brightness, foam);
        }

        brightness = clamp(brightness, 0.0, 1.0);
      }

    } else {
      // --- SAND ---
      float distFromWater = ny - tendrilLine;

      float grain = hash(cell * 0.71) * 0.018;

      // Wet sand — darkened where waves have been
      float wetExtent = max(0.0, maxReach);
      float wetness = smoothstep(wetExtent + 0.01, 0.0, distFromWater);

      // Wet sheen right at the waterline
      float sheen = smoothstep(0.04, 0.0, distFromWater) * 0.07;

      // Residual foam lace left behind by retreating waves
      float residualFoam = 0.0;
      if (distFromWater < wetExtent + 0.02) {
        float foamPattern = fbm(vec2(nx * 28.0, ny * 20.0 + t * 0.03));
        residualFoam = smoothstep(0.48, 0.65, foamPattern)
                     * smoothstep(wetExtent + 0.02, 0.003, distFromWater)
                     * 0.07;
      }

      brightness = 0.01 + grain + wetness * 0.03 + sheen + residualFoam;
      brightness = clamp(brightness, 0.0, 0.14);
    }

    // --- Diamond cursor (5 dots) ---
    if (uMouse.x > 0.0) {
      vec2 mouseCell = floor(uMouse / CELL);
      vec2 diff = cell - mouseCell;
      // Diamond: center + 4 cardinal neighbors (Manhattan distance <= 1)
      float md = abs(diff.x) + abs(diff.y);
      if (md <= 1.0) {
        brightness = 0.9;
      }
    }

    if (brightness < 0.005) {
      gl_FragColor = vec4(bg, 1.0);
      return;
    }

    float edge = smoothstep(DOT_R * 2.0, DOT_R * 2.0 - 0.25, dist);
    vec3 dotColor = mix(bg, fg, brightness);
    vec3 finalColor = mix(bg, dotColor, edge);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function PixelBeach() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const { resolvedTheme, setTheme } = useTheme();
  const [navPositions, setNavPositions] = useState<
    { left: number; right: number; top: number; bottom: number }[]
  >([]);

  const setup = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = container.clientWidth;
    const h = container.clientHeight;
    const gridCols = Math.floor(w * dpr / 6); // CELL = 6, use physical pixels
    const gridRows = Math.floor(h * dpr / 6);

    // Build nav texture at grid resolution
    const navData = buildNavTexture(gridCols, gridRows);
    setNavPositions(navData.positions);

    const navTex = new THREE.DataTexture(
      navData.data,
      navData.width,
      navData.height,
      THREE.RedFormat,
      THREE.UnsignedByteType
    );
    navTex.minFilter = THREE.NearestFilter;
    navTex.magFilter = THREE.NearestFilter;
    navTex.needsUpdate = true;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const isDark = document.documentElement.classList.contains("dark") ? 1.0 : 0.0;

    const uniforms = {
      uResolution: new THREE.Uniform(new THREE.Vector2(w * dpr, h * dpr)),
      uTime: new THREE.Uniform(0),
      uDark: new THREE.Uniform(isDark),
      uMouse: new THREE.Uniform(new THREE.Vector2(-1, -1)),
      uNavTex: new THREE.Uniform(navTex),
      uNavTexSize: new THREE.Uniform(new THREE.Vector2(navData.width, navData.height)),
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    scene.add(new THREE.Mesh(geometry, material));

    const startTime = performance.now();
    let lastFrame = 0;
    const FRAME_MS = 1000 / 30; // cap at 30fps
    const loop = (now: number) => {
      animRef.current = requestAnimationFrame(loop);
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      uniforms.uTime.value = (now - startTime) * 0.001;
      uniforms.uDark.value = document.documentElement.classList.contains("dark") ? 1.0 : 0.0;
      renderer.render(scene, camera);
    };
    animRef.current = requestAnimationFrame(loop);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      uniforms.uMouse.value.set(x, y);
    };
    const onMouseLeave = () => {
      uniforms.uMouse.value.set(-1, -1);
    };
    window.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      renderer.setSize(rw, rh);
      uniforms.uResolution.value.set(rw * dpr, rh * dpr);

      // Rebuild nav texture at new size
      const newGridCols = Math.floor(rw * dpr / 6);
      const newGridRows = Math.floor(rh * dpr / 6);
      const newNavData = buildNavTexture(newGridCols, newGridRows);
      setNavPositions(newNavData.positions);

      const newNavTex = new THREE.DataTexture(
        newNavData.data,
        newNavData.width,
        newNavData.height,
        THREE.RedFormat,
        THREE.UnsignedByteType
      );
      newNavTex.minFilter = THREE.NearestFilter;
      newNavTex.magFilter = THREE.NearestFilter;
      newNavTex.needsUpdate = true;

      uniforms.uNavTex.value.dispose();
      uniforms.uNavTex.value = newNavTex;
      uniforms.uNavTexSize.value.set(newNavData.width, newNavData.height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      navTex.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    const cleanup = setup();
    return () => {
      document.documentElement.style.overflow = "";
      cleanup?.();
    };
  }, [setup]);

  const MARGIN = 30;

  return (
    <div className="relative h-screen w-screen" style={{ background: "var(--background)" }}>
      {/* WebGL canvas */}
      <div
        ref={containerRef}
        className="canvas-cursor absolute"
        style={{ top: MARGIN, left: MARGIN, right: MARGIN, bottom: MARGIN }}
      />

      {/* Border box */}
      <div
        className="pointer-events-none absolute z-10"
        style={{
          top: MARGIN,
          left: MARGIN,
          right: MARGIN,
          bottom: MARGIN,
          border: "1px solid var(--foreground)",
          opacity: 0.2,
        }}
      />

      {/* Theme toggle — above the box, right side */}
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="absolute z-20"
        style={{
          top: MARGIN - 20,
          right: MARGIN,
          color: "var(--foreground)",
          opacity: 0.5,
          background: "none",
          border: "none",
          padding: 0,
          lineHeight: 1,
        }}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      {/* Invisible click targets for nav — positioned over the shader text */}
      {navPositions.map((pos, i) => (
        <Link
          key={NAV_LINKS[i].href}
          href={NAV_LINKS[i].href}
          className="absolute z-20"
          style={{
            top: `calc(${MARGIN}px + ${pos.top} * (100vh - ${MARGIN * 2}px))`,
            left: `calc(${MARGIN}px + ${pos.left} * (100vw - ${MARGIN * 2}px))`,
            width: `calc(${pos.right - pos.left} * (100vw - ${MARGIN * 2}px))`,
            height: `calc(${pos.bottom - pos.top} * (100vh - ${MARGIN * 2}px))`,
            padding: "8px 4px",
            margin: "-8px -4px",
            cursor: "none",
          }}
          aria-label={NAV_LINKS[i].label}
        />
      ))}
    </div>
  );
}
