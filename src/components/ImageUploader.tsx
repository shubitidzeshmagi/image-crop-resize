import { useCallback, useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 50 * 1024 * 1024;

export function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): boolean => {
    if (!ACCEPTED.includes(file.type)) { setError('Unsupported format. Please use JPG, PNG, or WEBP.'); return false; }
    if (file.size > MAX_SIZE) { setError('File too large. Max 50MB.'); return false; }
    setError(''); return true;
  }, []);

  const handleFile = useCallback((file: File) => {
    if (validate(file)) onImageSelect(file);
  }, [validate, onImageSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed
        p-14 transition-all duration-200 cursor-pointer select-none group
        ${dragging
          ? 'border-primary bg-primary/5 scale-[1.015] glow-primary'
          : 'border-border hover:border-primary/40 hover:bg-muted/20 bg-card/60'
        }
      `}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div className={`
        flex h-18 w-18 items-center justify-center rounded-2xl transition-all duration-200
        ${dragging ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-primary/10 text-primary group-hover:bg-primary/15 group-hover:scale-105'}
      `} style={{ height: '4.5rem', width: '4.5rem' }}>
        {dragging
          ? <ImageIcon className="h-9 w-9" />
          : <Upload className="h-9 w-9" />
        }
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold text-foreground">
          {dragging ? 'Drop your image here' : 'Upload an image'}
        </p>
        <p className="text-sm text-muted-foreground">
          Drag &amp; drop or click to browse
        </p>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {['JPG', 'PNG', 'WEBP'].map(fmt => (
            <span key={fmt} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{fmt}</span>
          ))}
          <span className="text-[11px] text-muted-foreground">· Max 50MB</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
