"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  phase: number;
  speed: number;
  shape: "square" | "diamond" | "cross";
  flash: number; // 0 = idle, >0 = being "updated", decays
}

interface Signal {
  fromIdx: number;
  toIdx: number;
  progress: number; // 0→1 along the connection
  speed: number;
}

export function NeuralAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let nodes: Node[] = [];
    let signals: Signal[] = [];
    let edges: [number, number][] = [];
    const CONNECTION_DIST = 160;
    const NODE_COUNT = 55;
    const shapes: Node["shape"][] = ["square", "diamond", "cross"];

    // Spawn a new signal surge every N ms
    let lastSurge = 0;
    const SURGE_INTERVAL = 2200;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }

    function initNodes() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      nodes = Array.from({ length: NODE_COUNT }, () => {
        const s = Math.random() * 2.5 + 1.5;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: s,
          baseSize: s,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.015 + 0.005,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          flash: 0,
        };
      });
      signals = [];
      edges = [];
    }

    function isDark() {
      return document.documentElement.classList.contains("dark");
    }

    function buildEdges() {
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < CONNECTION_DIST) {
            edges.push([i, j]);
          }
        }
      }
    }

    function spawnSurge() {
      // Pick a random node as the origin, fire signals along all its edges
      const origin = Math.floor(Math.random() * nodes.length);
      const connected = edges.filter(([a, b]) => a === origin || b === origin);
      for (const [a, b] of connected) {
        const from = a === origin ? a : b;
        const to = a === origin ? b : a;
        signals.push({
          fromIdx: from,
          toIdx: to,
          progress: 0,
          speed: 0.015 + Math.random() * 0.01,
        });
      }
      nodes[origin].flash = 1;
    }

    function drawNode(x: number, y: number, size: number, shape: Node["shape"]) {
      switch (shape) {
        case "square":
          ctx!.fillRect(x - size, y - size, size * 2, size * 2);
          break;
        case "diamond":
          ctx!.beginPath();
          ctx!.moveTo(x, y - size * 1.3);
          ctx!.lineTo(x + size * 1.3, y);
          ctx!.lineTo(x, y + size * 1.3);
          ctx!.lineTo(x - size * 1.3, y);
          ctx!.closePath();
          ctx!.fill();
          break;
        case "cross": {
          const t = size * 0.4;
          ctx!.fillRect(x - size, y - t, size * 2, t * 2);
          ctx!.fillRect(x - t, y - size, t * 2, size * 2);
          break;
        }
      }
    }

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      const now = performance.now();
      ctx!.clearRect(0, 0, w, h);

      const dark = isDark();
      const base = dark ? [150, 145, 175] : [110, 100, 140];
      const surge = dark ? [210, 200, 255] : [70, 50, 140];

      // Update node positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.phase += node.speed;

        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
        node.x = Math.max(0, Math.min(w, node.x));
        node.y = Math.max(0, Math.min(h, node.y));

        // Decay flash
        if (node.flash > 0) node.flash = Math.max(0, node.flash - 0.025);
        // Lerp size back to base
        node.size += (node.baseSize - node.size) * 0.08;
      }

      // Rebuild edges each frame (nodes move)
      buildEdges();

      // Spawn surges periodically
      if (now - lastSurge > SURGE_INTERVAL) {
        spawnSurge();
        lastSurge = now;
      }

      // Update signals
      const remaining: Signal[] = [];
      for (const sig of signals) {
        sig.progress += sig.speed;
        if (sig.progress >= 1) {
          // Signal arrived — flash the target node and cascade
          const target = nodes[sig.toIdx];
          target.flash = 1;
          target.size = target.baseSize * 1.8;

          // Cascade: chance to propagate further
          if (Math.random() < 0.45) {
            const next = edges.filter(
              ([a, b]) => (a === sig.toIdx || b === sig.toIdx) && a !== sig.fromIdx && b !== sig.fromIdx
            );
            if (next.length > 0) {
              const pick = next[Math.floor(Math.random() * next.length)];
              const from = sig.toIdx;
              const to = pick[0] === from ? pick[1] : pick[0];
              remaining.push({ fromIdx: from, toIdx: to, progress: 0, speed: 0.015 + Math.random() * 0.01 });
            }
          }
        } else {
          remaining.push(sig);
        }
      }
      signals = remaining;

      // --- Draw ---

      // Connections (right-angle traces)
      for (const [i, j] of edges) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        const opacity = (1 - dist / CONNECTION_DIST) * 0.1;

        ctx!.strokeStyle = `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${opacity})`;
        ctx!.lineWidth = 0.5;

        const midX = b.x;
        const midY = a.y;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(midX, midY);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();

        // Joint
        ctx!.fillStyle = `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${opacity * 0.6})`;
        ctx!.fillRect(midX - 0.8, midY - 0.8, 1.6, 1.6);
      }

      // Signal streaks along connections
      for (const sig of signals) {
        const a = nodes[sig.fromIdx];
        const b = nodes[sig.toIdx];
        const midX = b.x;
        const midY = a.y;
        const p = sig.progress;

        // Trace is two segments: a→mid (horizontal), mid→b (vertical)
        // Total path length
        const seg1Len = Math.abs(midX - a.x);
        const seg2Len = Math.abs(b.y - midY);
        const totalLen = seg1Len + seg2Len;
        if (totalLen < 1) continue;

        const traveled = p * totalLen;
        let sx: number, sy: number;

        if (traveled <= seg1Len) {
          // On first segment (horizontal)
          const t = seg1Len > 0 ? traveled / seg1Len : 0;
          sx = a.x + (midX - a.x) * t;
          sy = a.y;
        } else {
          // On second segment (vertical)
          const t = seg2Len > 0 ? (traveled - seg1Len) / seg2Len : 0;
          sx = midX;
          sy = midY + (b.y - midY) * t;
        }

        // Bright streak
        const streakOpacity = 0.7 + Math.sin(p * Math.PI) * 0.3;
        ctx!.fillStyle = `rgba(${surge[0]}, ${surge[1]}, ${surge[2]}, ${streakOpacity})`;
        // Diamond-shaped streak
        const ss = 3;
        ctx!.beginPath();
        ctx!.moveTo(sx, sy - ss);
        ctx!.lineTo(sx + ss, sy);
        ctx!.lineTo(sx, sy + ss);
        ctx!.lineTo(sx - ss, sy);
        ctx!.closePath();
        ctx!.fill();

        // Trail glow behind streak
        const trailOpacity = streakOpacity * 0.2;
        ctx!.strokeStyle = `rgba(${surge[0]}, ${surge[1]}, ${surge[2]}, ${trailOpacity})`;
        ctx!.lineWidth = 2;

        // Draw a short trail behind the current position
        const trailLen = totalLen * 0.15;
        const trailStart = Math.max(0, traveled - trailLen);
        let tx1: number, ty1: number;
        if (trailStart <= seg1Len) {
          const t = seg1Len > 0 ? trailStart / seg1Len : 0;
          tx1 = a.x + (midX - a.x) * t;
          ty1 = a.y;
        } else {
          const t = seg2Len > 0 ? (trailStart - seg1Len) / seg2Len : 0;
          tx1 = midX;
          ty1 = midY + (b.y - midY) * t;
        }
        ctx!.beginPath();
        ctx!.moveTo(tx1, ty1);
        if (trailStart <= seg1Len && traveled > seg1Len) {
          ctx!.lineTo(midX, midY);
        }
        ctx!.lineTo(sx, sy);
        ctx!.stroke();
      }

      // Nodes
      for (const node of nodes) {
        const pulse = 0.2 + Math.sin(node.phase) * 0.08;
        const flashBoost = node.flash;

        // Flash glow when "updated"
        if (flashBoost > 0.01) {
          ctx!.fillStyle = `rgba(${surge[0]}, ${surge[1]}, ${surge[2]}, ${flashBoost * 0.3})`;
          drawNode(node.x, node.y, node.size * 2.5, node.shape);
        }

        // Mix base color with surge color based on flash
        const r = Math.round(base[0] + (surge[0] - base[0]) * flashBoost);
        const g = Math.round(base[1] + (surge[1] - base[1]) * flashBoost);
        const bl = Math.round(base[2] + (surge[2] - base[2]) * flashBoost);
        const opacity = pulse + flashBoost * 0.5;

        ctx!.fillStyle = `rgba(${r}, ${g}, ${bl}, ${Math.min(1, opacity)})`;
        drawNode(node.x, node.y, node.size, node.shape);
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    initNodes();
    lastSurge = performance.now();
    draw();

    const onResize = () => { resize(); initNodes(); };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
