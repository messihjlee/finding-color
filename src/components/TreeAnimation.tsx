"use client";

import { useEffect, useRef, useCallback } from "react";

interface TreeNode {
  id: number;
  x: number;
  y: number;
  children: number[];
  parent: number | null;
}

interface Edge {
  from: number;
  to: number;
  onPath: boolean;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Fixed dimensions — all junctions same interval, all branches same height
const ELBOW = 25;       // 45° segment: 25px right/left, 25px down
const DROP = 75;         // vertical drop after elbow
const STEP = ELBOW + DROP; // total branch height = 100px = same as junction interval

function generateTree(totalHeight: number, anchorX: number, maxWidth: number) {
  const rand = seededRandom(71);
  const nodes: TreeNode[] = [];
  const edges: Edge[] = [];
  let nextId = 0;

  const xMin = 15;
  const xMax = Math.round(anchorX + maxWidth * 0.4);

  const clampX = (x: number) => Math.max(xMin, Math.min(xMax, Math.round(x)));

  const addNode = (x: number, y: number, parent: number | null, onPath: boolean): number => {
    const id = nextId++;
    nodes.push({ id, x: Math.round(x), y: Math.round(y), children: [], parent });
    if (parent !== null) {
      nodes[parent].children.push(id);
      edges.push({ from: parent, to: id, onPath });
    }
    return id;
  };

  // ============================================================
  // STEP 1: Build main path at fixed intervals (every STEP px).
  // At each junction it either goes straight or takes a 45° elbow.
  // ============================================================
  const path: number[] = [];
  let pathX = Math.round(anchorX);
  let pathY = 40;
  let prevPathId = addNode(pathX, pathY, null, false);
  path.push(prevPathId);

  while (pathY + STEP <= totalHeight) {
    const nextY = pathY + STEP;
    const distFromTrunk = Math.abs(pathX - anchorX);

    if (rand() < 0.5) {
      // Take a 45° elbow
      let dir: number;
      if (distFromTrunk < 5) {
        dir = rand() < 0.5 ? -1 : 1;
      } else if (rand() < 0.35) {
        dir = pathX > anchorX ? -1 : 1;
      } else {
        dir = rand() < 0.5 ? -1 : 1;
      }

      const elbowX = clampX(pathX + dir * ELBOW);
      const actualDx = Math.abs(elbowX - pathX);

      if (actualDx >= 2) {
        const elbowY = pathY + actualDx; // 45°
        const elbowId = addNode(elbowX, elbowY, prevPathId, true);
        path.push(elbowId);
        const vId = addNode(elbowX, nextY, elbowId, true);
        path.push(vId);
        pathX = elbowX;
        prevPathId = vId;
      } else {
        const vId = addNode(pathX, nextY, prevPathId, true);
        path.push(vId);
        prevPathId = vId;
      }
    } else {
      // Go straight down
      const vId = addNode(pathX, nextY, prevPathId, true);
      path.push(vId);
      prevPathId = vId;
    }

    pathY = nextY;
  }

  // Final segment to totalHeight if there's remaining space
  if (pathY < totalHeight) {
    const vId = addNode(pathX, totalHeight, prevPathId, true);
    path.push(vId);
  }

  // ============================================================
  // STEP 2: Decorative branches off path nodes.
  // All branches have the same shape: ELBOW px at 45° + DROP px vertical.
  // Sub-branches are the same size, forking from the branch endpoint.
  // ============================================================
  const addBranch = (
    parentId: number,
    px: number,
    py: number,
    depth: number,
    forcedDir?: number
  ) => {
    if (depth > 4 || py + STEP > totalHeight) return;

    const dir = forcedDir ?? (rand() < 0.5 ? -1 : 1);
    const elbowX = clampX(px + dir * ELBOW);
    const actualDx = Math.abs(elbowX - px);
    if (actualDx < 2) return;

    const elbowY = py + actualDx; // 45°
    const bottomY = py + STEP;    // all branches same total height

    // 45° segment
    const elbowId = addNode(elbowX, elbowY, parentId, false);
    // Vertical drop
    const vId = addNode(elbowX, bottomY, elbowId, false);

    // Maybe sub-branch from endpoint
    if (rand() < 0.4 && depth < 4) {
      addBranch(vId, elbowX, bottomY, depth + 1);
    }
  };

  // Add branches at each path junction
  for (let i = 0; i < path.length; i++) {
    const node = nodes[path[i]];
    if (node.y + STEP > totalHeight) continue;

    if (rand() < 0.7) {
      const r = rand();
      const count = r < 0.3 ? 1 : r < 0.75 ? 2 : 3;
      for (let b = 0; b < count; b++) {
        let dir: number | undefined;
        if (count === 2) dir = b === 0 ? -1 : 1;
        else if (count === 3) dir = b === 0 ? -1 : b === 1 ? 1 : undefined;
        addBranch(path[i], node.x, node.y, 1, dir);
      }
    }
  }

  // Post-process: force every edge to be vertical or 45°
  for (const edge of edges) {
    const a = nodes[edge.from];
    const b = nodes[edge.to];
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    if (dx === 0 || dx === dy) continue;
    b.y = a.y + dx;
  }

  const firstY = nodes[path[0]].y;
  const lastY = nodes[path[path.length - 1]].y;

  return { nodes, edges, path, firstY, lastY };
}

export function TreeAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const treeRef = useRef<ReturnType<typeof generateTree> | null>(null);
  const animRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const docHeightRef = useRef(1);

  const buildTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.offsetWidth;
    const docH = Math.max(
      document.documentElement.scrollHeight,
      window.innerHeight * 2
    );
    docHeightRef.current = docH;

    const anchorX = w < 768 ? w * 0.12 : w * 0.1;
    treeRef.current = generateTree(docH, anchorX, w * 0.45);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    buildTree();

    const onScroll = () => { scrollRef.current = window.scrollY; };
    const onResize = () => { buildTree(); };
    const ro = new ResizeObserver(() => {
      docHeightRef.current = document.documentElement.scrollHeight;
    });
    ro.observe(document.documentElement);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [buildTree]);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const tree = treeRef.current;
      if (!canvas || !tree) { animRef.current = requestAnimationFrame(draw); return; }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const scroll = scrollRef.current;
      const docH = docHeightRef.current;
      const maxScroll = Math.max(1, docH - h);
      const progress = Math.min(1, scroll / maxScroll);
      const dark = document.documentElement.classList.contains("dark");

      ctx.clearRect(0, 0, w, h);

      const branchColor = dark ? "rgba(90, 80, 130, 0.45)" : "rgba(140, 125, 170, 0.35)";
      const pathDim = dark ? "rgba(90, 80, 130, 0.45)" : "rgba(140, 125, 170, 0.35)";
      const pathActive = dark ? "rgba(180, 155, 235, 0.85)" : "rgba(80, 45, 155, 0.7)";
      const dotFill = dark ? "rgba(210, 190, 255, 1)" : "rgba(80, 50, 150, 1)";
      const dotGlowC = dark ? "rgba(210, 190, 255," : "rgba(80, 50, 150,";
      const junctionColor = dark ? "rgba(100, 90, 145, 0.5)" : "rgba(130, 115, 165, 0.4)";

      const viewTop = scroll;
      const viewBottom = scroll + h;
      const toY = (treeY: number) => treeY - scroll;
      const { nodes, edges, path, firstY, lastY } = tree;

      const targetY = firstY + progress * (lastY - firstY);

      // Draw non-path edges
      for (const edge of edges) {
        if (edge.onPath) continue;
        const a = nodes[edge.from];
        const b = nodes[edge.to];
        if (Math.max(a.y, b.y) < viewTop - 20 || Math.min(a.y, b.y) > viewBottom + 20) continue;

        ctx.beginPath();
        ctx.strokeStyle = branchColor;
        ctx.lineWidth = 1;
        ctx.moveTo(a.x, toY(a.y));
        ctx.lineTo(b.x, toY(b.y));
        ctx.stroke();

        if (nodes[b.id].children.length === 0) {
          const ey = toY(b.y);
          if (ey > -5 && ey < h + 5) {
            ctx.fillStyle = branchColor;
            ctx.fillRect(b.x - 1.5, ey - 1.5, 3, 3);
          }
        }
      }

      // Draw path edges
      for (let i = 0; i < path.length - 1; i++) {
        const a = nodes[path[i]];
        const b = nodes[path[i + 1]];
        if (Math.max(a.y, b.y) < viewTop - 20 || Math.min(a.y, b.y) > viewBottom + 20) continue;

        if (targetY >= b.y) {
          ctx.beginPath();
          ctx.strokeStyle = pathActive;
          ctx.lineWidth = 2;
          ctx.moveTo(a.x, toY(a.y));
          ctx.lineTo(b.x, toY(b.y));
          ctx.stroke();
        } else if (targetY <= a.y) {
          ctx.beginPath();
          ctx.strokeStyle = pathDim;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, toY(a.y));
          ctx.lineTo(b.x, toY(b.y));
          ctx.stroke();
        } else {
          const t = (b.y > a.y) ? (targetY - a.y) / (b.y - a.y) : 0;
          const mx = a.x + (b.x - a.x) * t;

          ctx.beginPath();
          ctx.strokeStyle = pathActive;
          ctx.lineWidth = 2;
          ctx.moveTo(a.x, toY(a.y));
          ctx.lineTo(mx, toY(targetY));
          ctx.stroke();

          ctx.beginPath();
          ctx.strokeStyle = pathDim;
          ctx.lineWidth = 1;
          ctx.moveTo(mx, toY(targetY));
          ctx.lineTo(b.x, toY(b.y));
          ctx.stroke();
        }
      }

      // Junction squares
      for (let i = 0; i < path.length; i++) {
        const node = nodes[path[i]];
        if (node.children.length < 2) continue;
        const jy = toY(node.y);
        if (jy < -5 || jy > h + 5) continue;
        const isActive = node.y <= targetY;
        ctx.fillStyle = isActive ? pathActive : junctionColor;
        ctx.fillRect(node.x - 2.5, jy - 2.5, 5, 5);
      }

      // Dot position
      let dotX = nodes[path[0]].x;
      let dotScreenY = toY(nodes[path[0]].y);
      for (let i = 0; i < path.length - 1; i++) {
        const a = nodes[path[i]];
        const b = nodes[path[i + 1]];
        if (targetY <= b.y) {
          const t = (b.y > a.y) ? (targetY - a.y) / (b.y - a.y) : 0;
          dotX = a.x + (b.x - a.x) * t;
          dotScreenY = toY(targetY);
          break;
        }
        if (i === path.length - 2) {
          dotX = b.x;
          dotScreenY = toY(b.y);
        }
      }

      // Diamond dot with glow
      if (dotScreenY > -30 && dotScreenY < h + 30) {
        const grd = ctx.createRadialGradient(dotX, dotScreenY, 0, dotX, dotScreenY, 22);
        grd.addColorStop(0, dotGlowC + " 0.35)");
        grd.addColorStop(1, dotGlowC + " 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(dotX, dotScreenY, 22, 0, Math.PI * 2);
        ctx.fill();

        const ds = 5;
        ctx.fillStyle = dotFill;
        ctx.beginPath();
        ctx.moveTo(dotX, dotScreenY - ds);
        ctx.lineTo(dotX + ds, dotScreenY);
        ctx.lineTo(dotX, dotScreenY + ds);
        ctx.lineTo(dotX - ds, dotScreenY);
        ctx.closePath();
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-screen w-full"
      aria-hidden="true"
    />
  );
}
