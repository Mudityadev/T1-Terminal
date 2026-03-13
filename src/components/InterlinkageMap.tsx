'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { IntelItem } from '@/lib/wire-engine';

interface Node {
  id: string;
  label: string;
  type: 'category' | 'storyline' | 'region';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulse: boolean;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
}

// Simple deterministic color map for categories
const COLOR_MAP: Record<string, string> = {
  GEOPOLITICS: '#ef4444',
  MARKETS: '#22c55e',
  ECONOMICS: '#f59e0b',
  TECH: '#06b6d4',
  ENERGY: '#fb923c',
  DEFENSE: '#a855f7',
  CYBER: '#ec4899',
  POLITICS: '#3b82f6',
  GOVERNANCE: '#8b5cf6',
  DEFAULT: '#6b7280',
};

export default function InterlinkageMap({ items }: { items: IntelItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Generate Graph Data
  useEffect(() => {
    if (!items || items.length === 0) return;

    const newNodes = new Map<string, Node>();
    const newEdges = new Map<string, Edge>();

    // We only process the 20 most recent high-impact items to keep the map readable
    const relevantItems = items
      .filter(i => i.urgency === 'FLASH' || i.urgency === 'URGENT' || i.storyline)
      .slice(0, 20);

    const addNode = (id: string, label: string, type: Node['type'], color: string, pulse: boolean) => {
      if (!newNodes.has(id)) {
        newNodes.set(id, {
          id, label, type,
          x: Math.random() * 400 + 50, // Initial random layout
          y: Math.random() * 200 + 50,
          vx: 0, vy: 0,
          radius: type === 'storyline' ? 12 : type === 'region' ? 8 : 10,
          color,
          pulse
        });
      } else {
        // Increase radius slightly if seen again
        const n = newNodes.get(id)!;
        n.radius = Math.min(n.radius + 1, 16);
        if (pulse) n.pulse = true;
      }
    };

    const addEdge = (source: string, target: string) => {
      if (source === target) return;
      // Sort to make edges undirected
      const [u, v] = [source, target].sort();
      const edgeId = `${u}-${v}`;
      if (!newEdges.has(edgeId)) {
        newEdges.set(edgeId, { source: u, target: v, weight: 1 });
      } else {
        newEdges.get(edgeId)!.weight += 0.5;
      }
    };

    relevantItems.forEach(item => {
      const catId = `cat_${item.category}`;
      const catColor = COLOR_MAP[item.category] || COLOR_MAP.DEFAULT;
      const isUrgent = item.urgency === 'FLASH' || item.urgency === 'URGENT';

      addNode(catId, item.category, 'category', catColor, isUrgent);

      if (item.region) {
        const regId = `reg_${item.region}`;
        addNode(regId, item.region, 'region', '#9ca3af', false);
        addEdge(catId, regId);
      }

      if (item.storyline) {
        const storyId = `story_${item.storyline}`;
        addNode(storyId, item.storyline, 'storyline', '#f97316', isUrgent);
        addEdge(catId, storyId);
        if (item.region) addEdge(`reg_${item.region}`, storyId);
      }
    });

    setNodes(Array.from(newNodes.values()));
    setEdges(Array.from(newEdges.values()));
  }, [items]);

  // Very simple force-directed layout simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    let width = 500;
    let height = 300;
    if (containerRef.current) {
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
    }

    const k = Math.sqrt((width * height) / nodes.length); // Optimal distance
    const attraction = 0.05;
    const repulsion = k * k * 0.5;
    const damping = 0.85;

    let animationFrameId: number;
    let simulationSteps = 0;
    const MAX_STEPS = 150; // Stop simulating after a while to save CPU

    const simulate = () => {
      if (simulationSteps++ > MAX_STEPS) return;

      setNodes(prevNodes => {
        const nextNodes = prevNodes.map(n => ({ ...n }));

        // Repulsion
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const u = nextNodes[i];
            const v = nextNodes[j];
            const dx = u.x - v.x;
            const dy = u.y - v.y;
            const distSq = dx * dx + dy * dy || 0.01;
            const dist = Math.sqrt(distSq);
            
            const force = repulsion / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            u.vx += fx;
            u.vy += fy;
            v.vx -= fx;
            v.vy -= fy;
          }
        }

        // Attraction (Edges)
        edges.forEach(edge => {
          const uIndex = nextNodes.findIndex(n => n.id === edge.source);
          const vIndex = nextNodes.findIndex(n => n.id === edge.target);
          if (uIndex === -1 || vIndex === -1) return;

          const u = nextNodes[uIndex];
          const v = nextNodes[vIndex];
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy || 0.01);
          
          const force = attraction * (dist - k) * edge.weight;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          u.vx += fx;
          u.vy += fy;
          v.vx -= fx;
          v.vy -= fy;
        });

        // Update positions & bounding box
        nextNodes.forEach(n => {
          n.vx *= damping;
          n.vy *= damping;
          n.x += n.vx;
          n.y += n.vy;

          // Keep in bounds with padding
          const pad = 20;
          if (n.x < pad) { n.x = pad; n.vx *= -1; }
          if (n.x > width - pad) { n.x = width - pad; n.vx *= -1; }
          if (n.y < pad) { n.y = pad; n.vy *= -1; }
          if (n.y > height - pad) { n.y = height - pad; n.vy *= -1; }
        });

        return nextNodes;
      });

      animationFrameId = requestAnimationFrame(simulate);
    };

    simulate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [edges.length, nodes.length]); // Re-run layout if topology changes

  if (nodes.length === 0) {
     return (
        <div className="glass rounded-lg border border-[var(--t1-border)] flex items-center justify-center p-4 w-full h-[300px]">
          <p className="text-[10px] text-[var(--t1-text-muted)] font-mono">GATHERING INTEL SIGNALS...</p>
        </div>
      );
  }

  return (
    <div className="glass rounded-lg border border-[var(--t1-border)] flex flex-col p-4 w-full h-[350px] relative overflow-hidden group">
      <div className="flex items-center gap-2 mb-2 z-10 relative">
        <h3 className="text-[10px] font-bold tracking-widest text-[var(--t1-text-muted)]">INTEL INTERLINKAGE GRAPH</h3>
        <span className="text-[9px] text-[var(--t1-accent-orange)] font-mono ml-auto animate-pulse">ANALYZING</span>
      </div>

      <div className="flex-1 w-full relative" ref={containerRef}>
        <svg className="w-full h-full absolute inset-0">
          {/* Edges */}
          {edges.map(e => {
            const u = nodes.find(n => n.id === e.source);
            const v = nodes.find(n => n.id === e.target);
            if (!u || !v) return null;

            const isHovered = hoveredNode === u.id || hoveredNode === v.id;

            return (
              <line
                key={`${e.source}-${e.target}`}
                x1={u.x} y1={u.y}
                x2={v.x} y2={v.y}
                stroke={isHovered ? 'var(--t1-text-primary)' : 'var(--t1-border)'}
                strokeWidth={isHovered ? 1.5 : e.weight * 0.5}
                strokeOpacity={isHovered ? 0.8 : 0.4}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const isHovered = hoveredNode === n.id;
            const isFaded = hoveredNode !== null && hoveredNode !== n.id && !edges.some(e => (e.source === n.id && e.target === hoveredNode) || (e.target === n.id && e.source === hoveredNode));

            return (
              <g 
                key={n.id} 
                className={cn("transition-opacity duration-300 cursor-pointer", isFaded ? 'opacity-20' : 'opacity-100')}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Pulse ring for high urgency items */}
                {n.pulse && (
                  <circle
                    cx={n.x} cy={n.y} r={n.radius * 1.5}
                    fill="none"
                    stroke={n.color}
                    strokeWidth="1"
                    className="animate-ping opacity-30"
                  />
                )}
                <circle
                  cx={n.x} cy={n.y} r={n.radius}
                  fill={n.color}
                  stroke={isHovered ? '#fff' : 'var(--t1-bg-primary)'}
                  strokeWidth="2"
                  className={cn("transition-all duration-200", isHovered ? "filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "")}
                />
                
                {/* Always show labels for Storylines, hide others unless hovered */}
                {(n.type === 'storyline' || isHovered) && (
                  <text
                    x={n.x} y={n.y + n.radius + 10}
                    textAnchor="middle"
                    fill={isHovered ? '#fff' : 'var(--t1-text-secondary)'}
                    className="text-[9px] font-mono font-bold select-none pointer-events-none drop-shadow-md"
                    style={{ textShadow: '0 1px 3px var(--t1-bg-primary)' }}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="absolute bottom-2 left-4 text-[9px] font-mono text-[var(--t1-text-muted)] z-10">
        NODES: {nodes.length} | EDGES: {edges.length}
      </div>
    </div>
  );
}
