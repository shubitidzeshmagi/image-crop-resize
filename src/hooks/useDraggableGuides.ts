import { useState, useCallback, useRef, useEffect } from 'react';

interface Guide {
  id: string;
  direction: 'horizontal' | 'vertical';
  positionPct: number; // 0-100 relative to canvas
}

interface DraggableGuidesProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

export function DraggableGuides({ canvasRef }: DraggableGuidesProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const draggingRef = useRef<string | null>(null);
  const directionRef = useRef<'horizontal' | 'vertical'>('horizontal');
  const idCounter = useRef(0);
  const [, forceRender] = useState(0);

  const getCanvasRect = useCallback(() => {
    return canvasRef.current?.getBoundingClientRect() ?? null;
  }, [canvasRef]);

  // Start creating a new guide from ruler
  const handleRulerMouseDown = useCallback((direction: 'horizontal' | 'vertical', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const id = `guide-${++idCounter.current}`;
    directionRef.current = direction;

    const rect = getCanvasRect();
    const pos = rect
      ? direction === 'horizontal'
        ? ((e.clientY - rect.top) / rect.height) * 100
        : ((e.clientX - rect.left) / rect.width) * 100
      : 0;

    setGuides(prev => [...prev, { id, direction, positionPct: Math.max(0, Math.min(100, pos)) }]);
    draggingRef.current = id;
  }, [getCanvasRect]);

  // Global mouse tracking for drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const id = draggingRef.current;
      if (!id) return;

      const rect = getCanvasRect();
      if (!rect) return;

      setGuides(prev => {
        const guide = prev.find(g => g.id === id);
        if (!guide) return prev;

        const pos = guide.direction === 'horizontal'
          ? ((e.clientY - rect.top) / rect.height) * 100
          : ((e.clientX - rect.left) / rect.width) * 100;

        // Remove if dragged far outside
        const outside = guide.direction === 'horizontal'
          ? (e.clientY < rect.top - 50 || e.clientY > rect.bottom + 50)
          : (e.clientX < rect.left - 50 || e.clientX > rect.right + 50);

        if (outside) {
          draggingRef.current = null;
          return prev.filter(g => g.id !== id);
        }

        return prev.map(g =>
          g.id === id ? { ...g, positionPct: Math.max(0, Math.min(100, pos)) } : g
        );
      });
    };

    const handleMouseUp = () => {
      draggingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [getCanvasRect]);

  const handleGuideMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = id;
  }, []);

  const handleDoubleClick = useCallback((id: string) => {
    setGuides(prev => prev.filter(g => g.id !== id));
  }, []);

  return { guides, handleRulerMouseDown, handleGuideMouseDown, handleDoubleClick };
}

export { DraggableGuides as useDraggableGuides };
