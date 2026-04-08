import { useRef, useCallback, useState } from 'react';
import { Upload, Move } from 'lucide-react';
import { toPx } from '@/lib/imageProcessor';
import type { PanOffset } from '@/lib/imageProcessor';
import type { EditorState } from '@/hooks/useImageEditor';
import { Ruler } from './Ruler';
import { useDraggableGuides } from '@/hooks/useDraggableGuides';

interface PreviewCanvasProps {
  state: EditorState;
  onPan?: (offset: PanOffset) => void;
  onNewImage?: (file: File) => void;
}

export function PreviewCanvas({ state, onPan, onNewImage }: PreviewCanvasProps) {
  const { previewDataUrl, width, height, unit, format, estimatedSize } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pxW = toPx(width, unit);
  const pxH = toPx(height, unit);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [localOffset, setLocalOffset] = useState<PanOffset>({ x: 0, y: 0 });

  const { guides, handleRulerMouseDown, handleGuideMouseDown, handleDoubleClick } = useDraggableGuides({ canvasRef });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onPan) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, [onPan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !onPan) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setLocalOffset(prev => { const next = { x: prev.x + dx, y: prev.y + dy }; onPan(next); return next; });
  }, [onPan]);

  const handleMouseUp = useCallback(() => { dragging.current = false; }, []);

  const currentPan = state.panOffset;
  if (currentPan.x === 0 && currentPan.y === 0 && (localOffset.x !== 0 || localOffset.y !== 0)) {
    setLocalOffset({ x: 0, y: 0 });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <div className="relative" style={{ maxWidth: '800px', width: '100%' }}>
        {/* Top ruler */}
        <div
          className="ml-[28px] cursor-s-resize"
          onMouseDown={e => handleRulerMouseDown('horizontal', e)}
          title="Drag to add horizontal guide"
        >
          <Ruler direction="horizontal" lengthPx={pxW} />
        </div>

        <div className="flex">
          {/* Left ruler */}
          <div
            className="mt-0 cursor-e-resize"
            onMouseDown={e => handleRulerMouseDown('vertical', e)}
            title="Drag to add vertical guide"
          >
            <Ruler direction="vertical" lengthPx={pxH} />
          </div>

          {/* Canvas */}
          <div
            ref={el => { (containerRef as any).current = el; (canvasRef as any).current = el; }}
            className="checkerboard relative flex items-center justify-center rounded-xl border border-border overflow-hidden flex-1 shadow-sm"
            style={{
              aspectRatio: `${pxW} / ${pxH}`,
              maxHeight: 'calc(100vh - 260px)',
              cursor: onPan ? 'grab' : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Preview"
                className="h-full w-full object-contain select-none pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                <p className="text-xs font-medium">Preview will appear here</p>
              </div>
            )}

            {/* Guide lines */}
            {guides.map(guide => (
              <div
                key={guide.id}
                className="absolute z-40 group"
                style={guide.direction === 'horizontal'
                  ? { left: 0, right: 0, top: `${guide.positionPct}%`, height: 0 }
                  : { top: 0, bottom: 0, left: `${guide.positionPct}%`, width: 0 }}
              >
                <div
                  className={`absolute ${guide.direction === 'horizontal'
                    ? '-top-[5px] left-0 right-0 h-[11px] cursor-ns-resize'
                    : '-left-[5px] top-0 bottom-0 w-[11px] cursor-ew-resize'}`}
                  onMouseDown={e => handleGuideMouseDown(guide.id, e)}
                  onDoubleClick={() => handleDoubleClick(guide.id)}
                />
                <div
                  className={`absolute ${guide.direction === 'horizontal'
                    ? 'top-0 left-0 right-0 border-t'
                    : 'left-0 top-0 bottom-0 border-l'} border-dashed`}
                  style={{ borderColor: 'hsl(217 91% 62%)' }}
                />
                <div
                  className={`absolute text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 rounded ${
                    guide.direction === 'horizontal' ? '-top-[14px] left-1' : 'top-1 left-1'}`}
                  style={{ color: 'hsl(217 91% 62%)', backgroundColor: 'hsl(var(--background) / 0.9)' }}
                >
                  {guide.positionPct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="rounded-lg bg-muted px-2.5 py-1.5 font-mono font-medium text-foreground tabular-nums">
          {pxW} × {pxH}
        </span>
        <span className="rounded-lg bg-muted px-2.5 py-1.5 font-medium uppercase text-muted-foreground">
          {format}
        </span>
        {estimatedSize && (
          <span className="rounded-lg bg-muted px-2.5 py-1.5 font-medium text-muted-foreground">
            ~{estimatedSize}
          </span>
        )}
        {onPan && (
          <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 font-medium text-primary flex items-center gap-1">
            <Move className="h-3 w-3" /> Drag to reposition
          </span>
        )}
        {onNewImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file?.type.startsWith('image/')) onNewImage(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Upload className="h-3 w-3" />
              New image
            </button>
          </>
        )}
      </div>
    </div>
  );
}
