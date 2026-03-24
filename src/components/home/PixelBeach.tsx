"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as THREE from "three";

const NAV_LINKS = [
  { href: "/projects", label: "projects" },
  { href: "/blog",     label: "blog"     },
  { href: "/about",    label: "about"    },
  { href: "/contact",  label: "contact"  },
];

const NAV_REGION = {
  y: 0.50,
  spacing: 0.06,
};

function buildNavTexture(gridCols: number, gridRows: number) {
  const canvas = document.createElement("canvas");
  canvas.width  = gridCols;
  canvas.height = gridRows;
  const ctx = canvas.getContext("2d")!;

  const fontSize = Math.max(8, Math.floor(gridRows * 0.08));
  ctx.font         = `${fontSize}px monospace`;
  ctx.textBaseline = "top";
  ctx.fillStyle    = "#fff";

  const measurements = NAV_LINKS.map((link) => ({
    ...link,
    width: ctx.measureText(link.label).width,
  }));

  // Always 4-row vertical layout, tightly spaced
  const rowSpacing  = Math.floor(fontSize * 1.1);
  const centerY     = Math.floor(gridRows * NAV_REGION.y);
  const blockStartY = Math.floor(centerY - (3 * rowSpacing + fontSize) / 2);

  const positions: { left: number; right: number; top: number; bottom: number }[] = [];

  for (let i = 0; i < measurements.length; i++) {
    const m    = measurements[i];
    const textY = blockStartY + i * rowSpacing;
    const curX  = Math.floor((gridCols - m.width) / 2);

    ctx.fillText(m.label, curX, textY);
    positions.push({
      left:   curX / gridCols,
      right:  (curX + m.width) / gridCols,
      top:    textY / gridRows,
      bottom: (textY + fontSize) / gridRows,
    });
  }

  const imageData = ctx.getImageData(0, 0, gridCols, gridRows);
  const data = new Uint8Array(gridCols * gridRows);
  for (let i = 0; i < gridCols * gridRows; i++) {
    data[i] = imageData.data[i * 4 + 3];
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

  uniform vec2  uResolution;
  uniform float uTime;
  uniform float uDark;
  uniform vec2  uMouse;
  uniform sampler2D uNavTex;
  uniform vec2  uNavTexSize;
  uniform float uExit;

  const float CELL  = 6.0;
  const float DOT_R = 0.3;
  const float PI    = 3.14159265;

  // ─── noise helpers ────────────────────────────────────────────────────────
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i),              b = hash(i + vec2(1,0));
    float c = hash(i + vec2(0,1)),  d = hash(i + vec2(1,1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 2; i++) {   // 2 octaves — was 3
      v   += amp * noise(p);
      p   *= 2.0;
      amp *= 0.5;
    }
    return v;
  }

  // ─── wave shape ───────────────────────────────────────────────────────────
  float waveCurve(float phase, float inEnd, float holdEnd) {
    float fastIn = inEnd * 0.833;
    if (phase < fastIn) {
      float t2 = phase / fastIn;
      return t2 * t2 * (3.0 - 2.0 * t2);
    } else if (phase < holdEnd) {
      return 1.0;
    } else {
      float t2 = 1.0 - (phase - holdEnd) / (1.0 - holdEnd);
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
    fc.y = uResolution.y - fc.y;          // y = 0 at top

    vec2 cell      = floor(fc / CELL);
    vec2 center    = (cell + 0.5) * CELL;
    vec2 gridCount = floor(uResolution / CELL);

    float dist = length(fc - center) / (CELL * 0.5);

    vec3 bg = uDark > 0.5 ? vec3(0.102, 0.102, 0.094) : vec3(0.910, 0.894, 0.871);
    vec3 fg = uDark > 0.5 ? vec3(0.910, 0.894, 0.871) : vec3(0.102, 0.102, 0.094);

    if (dist > DOT_R * 2.0) {
      gl_FragColor = vec4(bg, 1.0);
      return;
    }

    float nx = cell.x / gridCount.x;   // 0..1 horizontal
    float ny = cell.y / gridCount.y;   // 0..1 vertical (0 = top)
    float t  = uTime;
    float ar = uResolution.x / uResolution.y;

    // ─────────────────────────────────────────────────────────────────────────
    // EXIT TRANSITION
    // ─────────────────────────────────────────────────────────────────────────
    float exitT  = uExit * (2.0 - uExit);
    float shoreY = 0.72 + exitT * 1.2;   // shore moves down → water floods screen

    // ─────────────────────────────────────────────────────────────────────────
    // TIDAL WAVE MOTION  (unchanged from original)
    // ─────────────────────────────────────────────────────────────────────────
    float w1 = waveCurve(fract(t * 0.045), 0.30, 0.42);
    float w2 = waveCurve(fract(t * 0.038 + 0.5), 0.28, 0.38);

    float reachMod = 0.6 + 0.4 * noise(vec2(t * 0.025, 0.0))
                         + 0.3 * (sin(t * 0.1) * 0.5 + 0.5);
    float waveReach = mix(0.0, 0.43 * reachMod, max(w1, w2));

    float shoreWobble = (fbm(vec2(nx * 6.0  + t * 0.15,  t * 0.08      )) - 0.5) * 0.20
                      + (fbm(vec2(nx * 12.0 - t * 0.10,  t * 0.06 + 5.0)) - 0.5) * 0.10;

    float waterLine  = shoreY + shoreWobble - waveReach;

    float fingerBase = fbm(vec2(nx * 18.0 + t * 0.1, ny * 8.0));
    float fingers    = max(0.0, fingerBase - 0.5) * 0.06;
    float tendrilLine = waterLine + fingers;

    bool isWater   = ny < waterLine;
    bool isTendril = ny < tendrilLine && !isWater;

    // ─────────────────────────────────────────────────────────────────────────
    // WET-SAND MAX REACH  (2-sample approximation — was a 5-iteration loop)
    // ─────────────────────────────────────────────────────────────────────────
    float pw1 = waveCurve(fract((t - 0.7) * 0.045), 0.30, 0.42);
    float pw2 = waveCurve(fract((t - 0.7) * 0.038 + 0.5), 0.28, 0.38);
    float pastReachMod = 0.6 + 0.4 * noise(vec2((t - 0.7) * 0.025, 0.0))
                             + 0.3 * (sin((t - 0.7) * 0.1) * 0.5 + 0.5);
    float pastReach = mix(0.0, 0.43 * pastReachMod, max(pw1, pw2));
    float maxReach  = max(waveReach * 0.95, pastReach * 0.65);

    // ─────────────────────────────────────────────────────────────────────────
    // NAV TEXT
    // ─────────────────────────────────────────────────────────────────────────
    float isNav = navLookup(cell, gridCount);

    float brightness = 0.0;

    // ─────────────────────────────────────────────────────────────────────────
    // OCEAN SURFACE — caustic shimmer
    // Three plane waves mostly directed toward shore (+y) at slowly varying
    // angles. Their interference creates drifting bright nodes that look like
    // sunlight refracted through moving water.
    // ─────────────────────────────────────────────────────────────────────────
    if (isWater || isTendril) {

      if (isTendril) {
        // Thin water film creeping on sand — keep the subtle sheen
        float sheen = fbm(vec2(nx * 24.0 + t * 0.6, ny * 16.0)) * 0.08 + 0.04;
        brightness  = sheen;

      } else {
        // ── Flat open water ───────────────────────────────────────────────
        float depthFromShore = waterLine - ny;
        brightness = 0.02;

        // Foam at the leading shore edge
        float foamZone = 0.022;
        if (depthFromShore < foamZone) {
          float leadingEdge = smoothstep(foamZone, 0.002, depthFromShore);
          brightness = max(brightness, leadingEdge * 0.85);

          float foamTex = fbm(vec2(nx * 22.0 + t * 0.8, ny * 16.0 - t * 0.4));
          float foam    = smoothstep(foamZone, 0.005, depthFromShore)
                        * smoothstep(0.35, 0.60, foamTex) * 0.45;
          brightness = max(brightness, foam);
        }

        brightness = clamp(brightness, 0.0, 1.0);
      }

    } else {
      // ─────────────────────────────────────────────────────────────────────
      // SAND
      // ─────────────────────────────────────────────────────────────────────
      if (isNav > 0.3) {
        float distToWater = ny - tendrilLine;
        float dissolve = smoothstep(0.0, 0.04, distToWater);
        float ripple   = 1.0;
        if (distToWater < 0.04) {
          ripple = step(0.3, hash(cell * 0.37 + floor(vec2(t * 3.0))));
        }
        brightness = 0.9 * dissolve * ripple;

      } else {
        float distFromWater = ny - tendrilLine;
        float grain         = hash(cell * 0.71) * 0.018;

        float wetness = smoothstep(maxReach + 0.01, 0.0, distFromWater);
        float sheen   = smoothstep(0.04, 0.0, distFromWater) * 0.07;

        float residualFoam = 0.0;
        if (distFromWater < maxReach + 0.02) {
          float foamPattern  = fbm(vec2(nx * 28.0, ny * 20.0 + t * 0.03));
          residualFoam = smoothstep(0.48, 0.65, foamPattern)
                       * smoothstep(maxReach + 0.02, 0.003, distFromWater) * 0.07;
        }

        brightness = 0.01 + grain + wetness * 0.03 + sheen + residualFoam;
        brightness = clamp(brightness, 0.0, 0.14);

      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DIAMOND CURSOR
    // ─────────────────────────────────────────────────────────────────────────
    if (uMouse.x > 0.0) {
      vec2 mc = floor(uMouse / CELL);
      if (abs(cell.x - mc.x) + abs(cell.y - mc.y) <= 1.0) {
        brightness = 0.9;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXIT FADE
    // ─────────────────────────────────────────────────────────────────────────
    brightness *= max(0.0, 1.0 - uExit * 1.4);

    if (brightness < 0.005) {
      gl_FragColor = vec4(bg, 1.0);
      return;
    }

    brightness = clamp(brightness, 0.0, 1.0);
    float edge = smoothstep(DOT_R * 2.0, DOT_R * 2.0 - 0.25, dist);
    gl_FragColor = vec4(mix(bg, mix(bg, fg, brightness), edge), 1.0);
  }
`;

export function PixelBeach() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef      = useRef<number>(0);
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [navPositions, setNavPositions] = useState<
    { left: number; right: number; top: number; bottom: number }[]
  >([]);

  const triggerExitRef = useRef<((target: string) => void) | null>(null);

  const setup = useCallback((onNavigate: (path: string) => void) => {
    const container = containerRef.current;
    if (!container) return;

    const dpr      = Math.min(window.devicePixelRatio, 2);
    const w        = container.clientWidth;
    const h        = container.clientHeight;
    const gridCols = Math.floor(w * dpr / 6);
    const gridRows = Math.floor(h * dpr / 6);

    const navData = buildNavTexture(gridCols, gridRows);
    setNavPositions(navData.positions);

    const navTex = new THREE.DataTexture(
      navData.data, navData.width, navData.height,
      THREE.RedFormat, THREE.UnsignedByteType
    );
    navTex.minFilter  = THREE.NearestFilter;
    navTex.magFilter  = THREE.NearestFilter;
    navTex.needsUpdate = true;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    const scene    = new THREE.Scene();
    const camera   = new THREE.Camera();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const isDark = document.documentElement.classList.contains("dark") ? 1.0 : 0.0;

    const uniforms = {
      uResolution: new THREE.Uniform(new THREE.Vector2(w * dpr, h * dpr)),
      uTime:       new THREE.Uniform(0),
      uDark:       new THREE.Uniform(isDark),
      uMouse:      new THREE.Uniform(new THREE.Vector2(-1, -1)),
      uNavTex:     new THREE.Uniform(navTex),
      uNavTexSize: new THREE.Uniform(new THREE.Vector2(navData.width, navData.height)),
      uExit:       new THREE.Uniform(0),
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    scene.add(new THREE.Mesh(geometry, material));

    const TRANSITION_MS = 5400;
    const NAVIGATE_MS   = 1800;
    const exitState = { active: false, startTime: 0, target: "", navigated: false };

    triggerExitRef.current = (target: string) => {
      if (exitState.active) return;
      exitState.active    = true;
      exitState.startTime = performance.now();
      exitState.target    = target;
    };

    const startTime = performance.now();

    // Full frame rate — new shader is much cheaper than before
    const loop = (now: number) => {
      animRef.current = requestAnimationFrame(loop);

      uniforms.uTime.value = (now - startTime) * 0.001;
      uniforms.uDark.value = document.documentElement.classList.contains("dark") ? 1.0 : 0.0;

      if (exitState.active) {
        const elapsed = now - exitState.startTime;
        uniforms.uExit.value = Math.min(elapsed / TRANSITION_MS, 1.0);
        if (!exitState.navigated && elapsed >= NAVIGATE_MS) {
          exitState.navigated = true;
          onNavigate(exitState.target);
        }
      }

      renderer.render(scene, camera);
    };
    animRef.current = requestAnimationFrame(loop);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      uniforms.uMouse.value.set(
        (e.clientX - rect.left) * dpr,
        (e.clientY - rect.top)  * dpr
      );
    };
    const onMouseLeave = () => { uniforms.uMouse.value.set(-1, -1); };
    window.addEventListener("mousemove",  onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      renderer.setSize(rw, rh);
      uniforms.uResolution.value.set(rw * dpr, rh * dpr);

      const nc   = Math.floor(rw * dpr / 6);
      const nr   = Math.floor(rh * dpr / 6);
      const nd   = buildNavTexture(nc, nr);
      setNavPositions(nd.positions);

      const nt = new THREE.DataTexture(
        nd.data, nd.width, nd.height, THREE.RedFormat, THREE.UnsignedByteType
      );
      nt.minFilter  = THREE.NearestFilter;
      nt.magFilter  = THREE.NearestFilter;
      nt.needsUpdate = true;

      uniforms.uNavTex.value.dispose();
      uniforms.uNavTex.value = nt;
      uniforms.uNavTexSize.value.set(nd.width, nd.height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      triggerExitRef.current = null;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize",     onResize);
      window.removeEventListener("mousemove",  onMouseMove);
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
    const cleanup = setup((path) => router.push(path));
    return () => {
      document.documentElement.style.overflow = "";
      cleanup?.();
    };
  }, [setup, router]);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    triggerExitRef.current?.(href);
  };

  const MARGIN = 30;

  return (
    <div className="relative h-screen w-screen" style={{ background: "var(--background)" }}>
      <div
        ref={containerRef}
        className="canvas-cursor absolute"
        style={{ top: MARGIN, left: MARGIN, right: MARGIN, bottom: MARGIN }}
      />

      <div
        className="pointer-events-none absolute z-10"
        style={{
          top: MARGIN, left: MARGIN, right: MARGIN, bottom: MARGIN,
          border: "1px solid var(--foreground)",
          opacity: 0.2,
        }}
      />

      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="absolute z-20"
        style={{
          top: MARGIN - 20, right: MARGIN,
          color: "var(--foreground)", opacity: 0.5,
          background: "none", border: "none", padding: 0, lineHeight: 1,
        }}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1"  x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1"  y1="12" x2="3"  y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      {navPositions.map((pos, i) => (
        <a
          key={NAV_LINKS[i].href}
          href={NAV_LINKS[i].href}
          onClick={(e) => handleNavClick(e, NAV_LINKS[i].href)}
          className="absolute z-20"
          style={{
            top:    `calc(${MARGIN}px + ${pos.top}            * (100vh - ${MARGIN * 2}px))`,
            left:   `calc(${MARGIN}px + ${pos.left}           * (100vw - ${MARGIN * 2}px))`,
            width:  `calc(${pos.right  - pos.left}            * (100vw - ${MARGIN * 2}px))`,
            height: `calc(${pos.bottom - pos.top}             * (100vh - ${MARGIN * 2}px))`,
            padding: "8px 4px", margin: "-8px -4px",
            cursor: "none",
          }}
          aria-label={NAV_LINKS[i].label}
        />
      ))}
    </div>
  );
}
