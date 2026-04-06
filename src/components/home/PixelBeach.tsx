"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as THREE from "three";

const NAV_LINKS = [
  { href: "/blog",     label: "blog"     },
  { href: "/about",    label: "about"    },
  { href: "/contact",  label: "contact"  },
  { href: "/projects", label: "projects" },
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
  const rowSpacing  = Math.floor(fontSize * 1.2);
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
  uniform sampler2D uNavTex;
  uniform vec2  uNavTexSize;
  uniform float uExit;

  const float CELL  = 3.0;
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

    // Per-cycle predetermined bounds.
    // Each cycle: water rushes from retreatY up to peakY, then retreats to next retreatY.
    float cycleDur = 12.0;
    float cycleIdx = floor(t / cycleDur);
    float phase    = fract(t / cycleDur);

    float retreatY = mix(0.20, 0.32, hash(vec2(cycleIdx,       0.0)));
    float peakY    = mix(0.56, 0.72, hash(vec2(cycleIdx,       1.0)));
    float nextY    = mix(0.20, 0.32, hash(vec2(cycleIdx + 1.0, 0.0)));

    float shoreWobble = (fbm(vec2(nx * 6.0  + t * 0.15, t * 0.08      )) - 0.5) * 0.18
                      + (fbm(vec2(nx * 12.0 - t * 0.10, t * 0.06 + 5.0)) - 0.5) * 0.09;

    // Fast rush in (35% of cycle), slow retreat (65%)
    float waterLine = phase < 0.35
      ? mix(retreatY, peakY, smoothstep(0.0, 1.0, phase / 0.35))
      : mix(peakY, nextY,    smoothstep(0.0, 1.0, (phase - 0.35) / 0.65));
    waterLine += shoreWobble;

    // Wet line: same formula evaluated 1 second behind
    float tD        = t - 1.0;
    float cycleIdxD = floor(tD / cycleDur);
    float phaseD    = fract(tD / cycleDur);
    float retreatYD = mix(0.20, 0.32, hash(vec2(cycleIdxD,       0.0)));
    float peakYD    = mix(0.56, 0.72, hash(vec2(cycleIdxD,       1.0)));
    float nextYD    = mix(0.20, 0.32, hash(vec2(cycleIdxD + 1.0, 0.0)));
    float wobbleD   = (fbm(vec2(nx * 6.0  + tD * 0.15, tD * 0.08      )) - 0.5) * 0.18
                    + (fbm(vec2(nx * 12.0 - tD * 0.10, tD * 0.06 + 5.0)) - 0.5) * 0.09;
    float wetLine = phaseD < 0.35
      ? mix(retreatYD, peakYD, smoothstep(0.0, 1.0, phaseD / 0.35))
      : mix(peakYD, nextYD,    smoothstep(0.0, 1.0, (phaseD - 0.35) / 0.65));
    wetLine += wobbleD;

    bool isWater = ny < waterLine;

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
    if (isWater) {

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

    } else {
      // ─────────────────────────────────────────────────────────────────────
      // SAND
      // ─────────────────────────────────────────────────────────────────────
      if (isNav > 0.3) {
        float mask = smoothstep(wetLine - 0.02, wetLine, ny);
        brightness = mix(0.2, 0.9, mask);
      } else {
        float grain = hash(cell * 0.71) * 0.018;
        brightness = 0.01 + grain;
        brightness = clamp(brightness, 0.0, 0.14);

        // ── FOOTSTEPS ───────────────────────────────────────────────────────
        // One new footstep stamped per second, alternating left/right.
        // Each imprint is fixed in place and fades over time.
        float xStep    = 0.090 / ar;
        float fadeSecs = 1.0 / xStep;   // fade as steps scroll off screen width
        float curStep  = floor(t);

        for (int s = 0; s < 10; s++) {
          float idx = curStep - float(s);
          float age = t - idx;
          if (age > fadeSecs) { continue; }
          float sx    = fract(idx * xStep + (noise(vec2(idx * 0.31, 2.0)) - 0.5) * xStep * 0.25);
          float py   = 0.80 + (noise(vec2(idx * 0.45, 6.1)) - 0.5) * 0.06;
          float side = mod(idx, 2.0) * 2.0 - 1.0;   // -1 or +1
          float sy   = py + side * 12.0 * CELL / uResolution.y;

          // Aspect-corrected delta from foot center
          vec2  dv      = cell / gridCount - vec2(sx, sy);
          float ex      = dv.x * ar;
          float ey      = dv.y;
          float inner   = -side;   // direction toward center path = big toe side

          // Foot shape: heel + narrow bridge + ball + 5 toes — all one connected piece
          bool inFoot = false;
          // Heel
          if (length(vec2((ex + 0.014) / 0.010, ey / 0.010)) < 1.0) inFoot = true;
          // Narrow bridge connecting heel to ball (mid-foot)
          if (length(vec2(ex / 0.008, ey / 0.006)) < 1.0)           inFoot = true;
          // Ball — wider than heel
          if (length(vec2((ex - 0.014) / 0.012, ey / 0.014)) < 1.0) inFoot = true;
          // Toes — sit just past ball edge; big toe on inner side (toward center path)
          if (length(vec2(ex - 0.028, ey - inner * 0.015)) < 0.006) inFoot = true; // big toe
          if (length(vec2(ex - 0.032, ey - inner * 0.008)) < 0.005) inFoot = true; // 2nd
          if (length(vec2(ex - 0.033, ey - inner * 0.001)) < 0.004) inFoot = true; // 3rd
          if (length(vec2(ex - 0.031, ey + inner * 0.006)) < 0.004) inFoot = true; // 4th
          if (length(vec2(ex - 0.027, ey + inner * 0.012)) < 0.003) inFoot = true; // pinky

          if (inFoot) {
            float fade = 1.0 - age / fadeSecs;
            brightness = max(brightness, 0.70 * fade);
          }
        }
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

  return (
    <div className="relative h-screen w-screen" style={{ background: "var(--background)" }}>
      <div
        ref={containerRef}
        className="absolute"
        style={{ top: "3vh", left: 0, right: 0, bottom: 0 }}
      />

      <div
        className="pointer-events-none absolute z-10"
        style={{
          top: "3vh", left: 0, right: 0, bottom: 0,
          borderTop: "1px solid var(--foreground)",
          opacity: 0.2,
        }}
      />

      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="absolute z-20"
        style={{
          top: "calc(1.5vh - 7px)", left: "50%", transform: "translateX(-50%)",
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
            top:    `calc(3vh + ${pos.top}           * (100vh - 3vh))`,
            left:   `calc(${pos.left}                * 100vw)`,
            width:  `calc(${pos.right  - pos.left}   * 100vw)`,
            height: `calc(${pos.bottom - pos.top}    * (100vh - 3vh))`,
            padding: "8px 4px", margin: "-8px -4px",
          }}
          aria-label={NAV_LINKS[i].label}
        />
      ))}
    </div>
  );
}
