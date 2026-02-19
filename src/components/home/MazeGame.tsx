"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// --- Maze generation (recursive backtracking) ---
interface Cell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  visited: boolean;
}

function generateMaze(cols: number, rows: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      top: true,
      right: true,
      bottom: true,
      left: true,
      visited: false,
    }))
  );

  const stack: [number, number][] = [];
  grid[0][0].visited = true;
  stack.push([0, 0]);

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors: [number, number, string, string][] = [];

    if (r > 0 && !grid[r - 1][c].visited) neighbors.push([r - 1, c, "top", "bottom"]);
    if (r < rows - 1 && !grid[r + 1][c].visited) neighbors.push([r + 1, c, "bottom", "top"]);
    if (c > 0 && !grid[r][c - 1].visited) neighbors.push([r, c - 1, "left", "right"]);
    if (c < cols - 1 && !grid[r][c + 1].visited) neighbors.push([r, c + 1, "right", "left"]);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const [nr, nc, wall, opposite] = neighbors[Math.floor(Math.random() * neighbors.length)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (grid[r][c] as any)[wall] = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (grid[nr][nc] as any)[opposite] = false;
      grid[nr][nc].visited = true;
      stack.push([nr, nc]);
    }
  }

  return grid;
}

// Clear walls around center cells so the name area is open
function clearCenter(grid: Cell[][], cols: number, rows: number) {
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  // Clear a small area around center (3x3 block)
  for (let r = Math.max(0, cy - 1); r <= Math.min(rows - 1, cy + 1); r++) {
    for (let c = Math.max(0, cx - 1); c <= Math.min(cols - 1, cx + 1); c++) {
      const cell = grid[r][c];
      // Remove walls between this cell and its neighbors within the block
      if (r > cy - 1 && r > 0) { cell.top = false; grid[r - 1][c].bottom = false; }
      if (r < cy + 1 && r < rows - 1) { cell.bottom = false; grid[r + 1][c].top = false; }
      if (c > cx - 1 && c > 0) { cell.left = false; grid[r][c - 1].right = false; }
      if (c < cx + 1 && c < cols - 1) { cell.right = false; grid[r][c + 1].left = false; }
    }
  }
}

const DESTINATIONS = ["/projects", "/blog", "/about", "/contact"];

export function MazeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mazeRef = useRef<Cell[][] | null>(null);
  const playerRef = useRef({ col: 0, row: 0 });
  const exitRef = useRef({ col: 0, row: 0 });
  const solvedRef = useRef(false);
  const animIdRef = useRef<number>(0);
  const trailRef = useRef<{ col: number; row: number; time: number }[]>([]);
  const dimsRef = useRef({ cols: 10, rows: 7, cellSize: 0 });
  const router = useRouter();
  const [hint, setHint] = useState(true);
  const [flash, setFlash] = useState(false);
  const destinationRef = useRef("");

  const initMaze = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;

    // Fewer, larger cells → easier maze
    const targetCell = Math.max(40, Math.min(70, Math.floor(w / 12)));
    const cols = Math.max(7, Math.min(15, Math.floor(w / targetCell)));
    const rows = Math.max(5, Math.min(11, Math.floor(h / targetCell)));
    // Force odd so there's a true center cell
    const finalCols = cols % 2 === 0 ? cols - 1 : cols;
    const finalRows = rows % 2 === 0 ? rows - 1 : rows;
    const cellSize = Math.min(Math.floor(w / finalCols), Math.floor(h / finalRows));

    dimsRef.current = { cols: finalCols, rows: finalRows, cellSize };

    const dpr = window.devicePixelRatio || 1;
    canvas.width = finalCols * cellSize * dpr;
    canvas.height = finalRows * cellSize * dpr;
    canvas.style.width = `${finalCols * cellSize}px`;
    canvas.style.height = `${finalRows * cellSize}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const maze = generateMaze(finalCols, finalRows);
    clearCenter(maze, finalCols, finalRows);
    mazeRef.current = maze;

    // Player starts bottom-left
    playerRef.current = { col: 0, row: finalRows - 1 };
    // Exit is the center
    exitRef.current = { col: Math.floor(finalCols / 2), row: Math.floor(finalRows / 2) };

    solvedRef.current = false;
    trailRef.current = [{ col: 0, row: finalRows - 1, time: performance.now() }];
    destinationRef.current = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
    setFlash(false);
  }, []);

  useEffect(() => {
    initMaze();
    window.addEventListener("resize", initMaze);
    return () => window.removeEventListener("resize", initMaze);
  }, [initMaze]);

  const handleSolve = useCallback(() => {
    solvedRef.current = true;
    setFlash(true);
    setTimeout(() => {
      router.push(destinationRef.current);
    }, 900);
  }, [router]);

  const checkWin = useCallback((col: number, row: number) => {
    const exit = exitRef.current;
    return col === exit.col && row === exit.row;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const move = (dcol: number, drow: number) => {
      if (solvedRef.current) return;
      const maze = mazeRef.current;
      if (!maze) return;

      const { col, row } = playerRef.current;
      const cell = maze[row][col];
      const ncol = col + dcol;
      const nrow = row + drow;

      let blocked = false;
      if (drow === -1) blocked = cell.top;
      if (drow === 1) blocked = cell.bottom;
      if (dcol === -1) blocked = cell.left;
      if (dcol === 1) blocked = cell.right;

      if (blocked) return;
      if (ncol < 0 || ncol >= dimsRef.current.cols) return;
      if (nrow < 0 || nrow >= dimsRef.current.rows) return;

      playerRef.current = { col: ncol, row: nrow };
      setHint(false);
      trailRef.current.push({ col: ncol, row: nrow, time: performance.now() });

      if (checkWin(ncol, nrow)) handleSolve();
    };

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": move(0, -1); break;
        case "ArrowDown": move(0, 1); break;
        case "ArrowLeft": move(-1, 0); break;
        case "ArrowRight": move(1, 0); break;
        default: return;
      }
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleSolve, checkWin]);

  // Touch/swipe controls
  useEffect(() => {
    let sx = 0, sy = 0;
    const onStart = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      if (solvedRef.current || !mazeRef.current) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

      const { col, row } = playerRef.current;
      const cell = mazeRef.current[row][col];
      let ncol = col, nrow = row;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && !cell.right && col < dimsRef.current.cols - 1) ncol++;
        else if (dx < 0 && !cell.left && col > 0) ncol--;
      } else {
        if (dy > 0 && !cell.bottom && row < dimsRef.current.rows - 1) nrow++;
        else if (dy < 0 && !cell.top && row > 0) nrow--;
      }

      if (ncol !== col || nrow !== row) {
        playerRef.current = { col: ncol, row: nrow };
        setHint(false);
        trailRef.current.push({ col: ncol, row: nrow, time: performance.now() });
        if (checkWin(ncol, nrow)) handleSolve();
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [handleSolve, checkWin]);

  // Render loop
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const maze = mazeRef.current;
      if (!canvas || !maze) { animIdRef.current = requestAnimationFrame(draw); return; }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { cols, rows, cellSize } = dimsRef.current;
      const w = cols * cellSize;
      const h = rows * cellSize;
      const now = performance.now();
      const dark = document.documentElement.classList.contains("dark");

      ctx.clearRect(0, 0, w, h);

      const wallColor = dark ? "rgba(70, 65, 90, 0.45)" : "rgba(160, 150, 180, 0.4)";
      const trailRgb = dark ? "140, 130, 180" : "110, 100, 150";
      const playerColor = dark ? "rgba(200, 190, 230, 1)" : "rgba(80, 70, 120, 1)";
      const playerGlowColor = dark ? "rgba(200, 190, 230," : "rgba(80, 70, 120,";

      // Grid dots at intersections
      const dotColor = dark ? "rgba(60, 55, 80, 0.3)" : "rgba(180, 170, 200, 0.3)";
      ctx.fillStyle = dotColor;
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          ctx.beginPath();
          ctx.arc(c * cellSize, r * cellSize, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw walls
      ctx.strokeStyle = wallColor;
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize;
          const y = r * cellSize;
          const cell = maze[r][c];
          if (cell.top) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); }
          if (cell.right) { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
          if (cell.bottom) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
          if (cell.left) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke(); }
        }
      }

      // Trail — fading breadcrumbs
      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const age = (now - trail[i].time) / 1000;
        const fade = Math.max(0, 1 - age / 10);
        if (fade <= 0) continue;
        const tx = trail[i].col * cellSize + cellSize / 2;
        const ty = trail[i].row * cellSize + cellSize / 2;
        ctx.fillStyle = `rgba(${trailRgb}, ${fade * 0.2})`;
        ctx.beginPath();
        ctx.arc(tx, ty, cellSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player dot
      if (!solvedRef.current) {
        const px = playerRef.current.col * cellSize + cellSize / 2;
        const py = playerRef.current.row * cellSize + cellSize / 2;

        const pg = ctx.createRadialGradient(px, py, 0, px, py, cellSize * 0.5);
        pg.addColorStop(0, playerGlowColor + " 0.25)");
        pg.addColorStop(1, playerGlowColor + " 0)");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }

      animIdRef.current = requestAnimationFrame(draw);
    };

    animIdRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animIdRef.current);
  }, []);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-[2] flex items-center justify-center">
        <canvas ref={canvasRef} className="block" />
        {hint && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted/50 animate-pulse select-none md:bottom-10">
            use arrow keys to navigate the maze
          </div>
        )}
      </div>

      {/* Full-screen blinding flash on solve */}
      {flash && (
        <div className="maze-flash fixed inset-0 z-[100] bg-white dark:bg-neutral-200" />
      )}
    </>
  );
}
