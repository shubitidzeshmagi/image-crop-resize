import { useState, useCallback, useRef } from 'react';
import {
  FitMode, ExportFormat, Unit, CropArea, Dimensions, PanOffset,
  toPx, fromPx, processImage, exportCanvas, downloadDataUrl, estimateFileSize,
  detectBackgroundColor
} from '@/lib/imageProcessor';
const STORAGE_KEY = 'image-tool-remembered-dims';

interface SavedDims {
  width: number;
  height: number;
  unit: Unit;
}

function loadSavedDims(): SavedDims | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveDims(width: number, height: number, unit: Unit) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ width, height, unit }));
}

function clearSavedDims() {
  localStorage.removeItem(STORAGE_KEY);
}

export interface EditorState {
  image: HTMLImageElement | null;
  imageName: string;
  originalDimensions: Dimensions | null;
  width: number;
  height: number;
  unit: Unit;
  fitMode: FitMode;
  aspectLocked: boolean;
  cropArea: CropArea | null;
  format: ExportFormat;
  quality: number;
  padColor: string;
  previewDataUrl: string | null;
  estimatedSize: string;
  rememberDimensions: boolean;
  panOffset: PanOffset;
  autoCenterPadding: number;
  detectedBgColor: string | null;
  useAutoBgColor: boolean;
  bgRemovalEnabled: boolean;
  bgObjectDescription: string;
}

export function useImageEditor() {
  const saved = loadSavedDims();

  const [state, setState] = useState<EditorState>({
    image: null,
    imageName: '',
    originalDimensions: null,
    width: saved?.width ?? 1080,
    height: saved?.height ?? 1080,
    unit: saved?.unit ?? 'px',
    fitMode: 'crop',
    aspectLocked: false,
    cropArea: null,
    format: 'png',
    quality: 90,
    padColor: '#ffffff',
    previewDataUrl: null,
    estimatedSize: '',
    rememberDimensions: !!saved,
    panOffset: { x: 0, y: 0 },
    autoCenterPadding: 15,
    detectedBgColor: null,
    useAutoBgColor: false,
    bgRemovalEnabled: false,
    bgObjectDescription: '',
  });

  const aspectRatioRef = useRef<number>(1);

  const updatePreview = useCallback((s: EditorState) => {
    const img = s.image;
    if (!img) return;
    const tw = toPx(s.width, s.unit);
    const th = toPx(s.height, s.unit);
    if (tw <= 0 || th <= 0) return;
    const canvas = processImage(img, tw, th, s.fitMode, s.cropArea, s.padColor, s.panOffset, s.autoCenterPadding, s.bgRemovalEnabled);
    const dataUrl = exportCanvas(canvas, s.format, s.quality);
    setState(prev => ({
      ...prev,
      previewDataUrl: dataUrl,
      estimatedSize: estimateFileSize(dataUrl),
    }));
  }, []);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const schedulePreview = useCallback((s: EditorState) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => updatePreview(s), 150);
  }, [updatePreview]);

  const update = useCallback((partial: Partial<EditorState>) => {
    setState(prev => {
      const next = { ...prev, ...partial };
      // Persist dimensions if checkbox is on
      if (next.rememberDimensions && ('width' in partial || 'height' in partial || 'unit' in partial || 'rememberDimensions' in partial)) {
        saveDims(next.width, next.height, next.unit);
      }
      if ('rememberDimensions' in partial && !partial.rememberDimensions) {
        clearSavedDims();
      }
      schedulePreview(next);
      return next;
    });
  }, [schedulePreview]);

  const loadImage = useCallback((file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      aspectRatioRef.current = dims.width / dims.height;
      const detectedBg = detectBackgroundColor(img);

      setState(prev => {
        const useRemembered = prev.rememberDimensions;
        const newState: EditorState = {
          ...prev,
          image: img,
          imageName: file.name,
          originalDimensions: dims,
          width: useRemembered ? prev.width : fromPx(dims.width, prev.unit),
          height: useRemembered ? prev.height : fromPx(dims.height, prev.unit),
          cropArea: null,
          previewDataUrl: null,
          panOffset: { x: 0, y: 0 },
          detectedBgColor: detectedBg,
          padColor: (prev.fitMode === 'auto-center' && prev.useAutoBgColor) ? detectedBg : prev.padColor,
        };
        schedulePreview(newState);
        return newState;
      });
    };
    img.src = url;
  }, [schedulePreview]);

  const setWidth = useCallback((w: number) => {
    if (state.aspectLocked && state.originalDimensions) {
      const ratio = state.originalDimensions.width / state.originalDimensions.height;
      update({ width: w, height: Math.round((w / ratio) * 100) / 100 });
    } else {
      update({ width: w });
    }
  }, [update, state.aspectLocked, state.originalDimensions]);

  const setHeight = useCallback((h: number) => {
    if (state.aspectLocked && state.originalDimensions) {
      const ratio = state.originalDimensions.width / state.originalDimensions.height;
      update({ height: h, width: Math.round(h * ratio * 100) / 100 });
    } else {
      update({ height: h });
    }
  }, [update, state.aspectLocked, state.originalDimensions]);

  const setUnit = useCallback((unit: Unit) => {
    const wPx = toPx(state.width, state.unit);
    const hPx = toPx(state.height, state.unit);
    update({ unit, width: fromPx(wPx, unit), height: fromPx(hPx, unit) });
  }, [update, state.width, state.height, state.unit]);

  const applyPreset = useCallback((width: number, height: number) => {
    update({
      width: fromPx(width, state.unit),
      height: fromPx(height, state.unit),
      aspectLocked: false,
    });
  }, [update, state.unit]);

  const setPanOffset = useCallback((panOffset: PanOffset) => {
    update({ panOffset });
  }, [update]);

  const download = useCallback(() => {
    if (!state.image) return;
    const tw = toPx(state.width, state.unit);
    const th = toPx(state.height, state.unit);
    const canvas = processImage(state.image, tw, th, state.fitMode, state.cropArea, state.padColor, state.panOffset, state.autoCenterPadding, state.bgRemovalEnabled);
    const dataUrl = exportCanvas(canvas, state.format, state.quality);
    const ext = state.format === 'jpeg' ? 'jpg' : state.format;
    const baseName = state.imageName.replace(/\.[^.]+$/, '');
    downloadDataUrl(dataUrl, `${baseName}_${tw}x${th}.${ext}`);
  }, [state]);

  const toggleBgRemoval = useCallback((enabled: boolean) => {
    update({ bgRemovalEnabled: enabled });
  }, [update]);

  const resetImage = useCallback(() => {
    setState(prev => ({
      ...prev,
      image: null,
      imageName: '',
      originalDimensions: null,
      cropArea: null,
      previewDataUrl: null,
      estimatedSize: '',
      panOffset: { x: 0, y: 0 },
      bgRemovalEnabled: false,
    }));
  }, []);

  return {
    state,
    loadImage,
    setWidth,
    setHeight,
    setUnit,
    update,
    applyPreset,
    download,
    resetImage,
    setPanOffset,
    toggleBgRemoval,
  };
}
