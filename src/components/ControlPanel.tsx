import { Lock, Unlock, Download, RotateCcw, Shield, Scissors, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { EditorState } from '@/hooks/useImageEditor';
import type { FitMode, ExportFormat, Unit } from '@/lib/imageProcessor';
import { PRESETS } from '@/lib/imageProcessor';

interface ControlPanelProps {
  state: EditorState;
  setWidth: (w: number) => void;
  setHeight: (h: number) => void;
  setUnit: (u: Unit) => void;
  update: (p: Partial<EditorState>) => void;
  applyPreset: (w: number, h: number) => void;
  download: () => void;
  resetImage: () => void;
  toggleBgRemoval: (enabled: boolean) => void;
}

const FIT_MODES: { value: FitMode; label: string; desc: string; icon: string }[] = [
  { value: 'crop',        label: 'Crop to Fill',  desc: 'Fill target, crop overflow',   icon: '⌗' },
  { value: 'fit',         label: 'Fit Inside',    desc: 'Full image within target',      icon: '⤡' },
  { value: 'stretch',     label: 'Stretch',       desc: 'Force exact dimensions',        icon: '↔' },
  { value: 'pad',         label: 'Add Padding',   desc: 'Fill space with background',    icon: '□' },
  { value: 'auto-center', label: 'Auto Center',   desc: 'Trim & center product',         icon: '⊕' },
];

const UNITS: { value: Unit; label: string }[] = [
  { value: 'px', label: 'Pixels' },
  { value: 'in', label: 'Inches' },
  { value: 'cm', label: 'Centimeters' },
];

export function ControlPanel({ state, setWidth, setHeight, setUnit, update, applyPreset, download, resetImage, toggleBgRemoval }: ControlPanelProps) {
  const hasImage = !!state.image;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Scrollable content */}
      <div className="flex flex-col gap-0 flex-1 px-4 py-3">

        {/* Original info */}
        {state.originalDimensions && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/60 border border-border/50 px-3 py-2 text-xs animate-fade-in">
            <span className="text-muted-foreground font-mono">
              {state.originalDimensions.width}×{state.originalDimensions.height}px
            </span>
            <button
              onClick={resetImage}
              className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Change
            </button>
          </div>
        )}

        {/* PRESETS */}
        <Section label="Presets">
          <Select onValueChange={(v) => { const p = PRESETS.find(p => p.label === v); if (p) applyPreset(p.width, p.height); }}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Choose a preset…" />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map(p => (
                <SelectItem key={p.label} value={p.label} className="text-xs">
                  <span>{p.label}</span>
                  <span className="ml-1.5 text-muted-foreground font-mono">{p.width}×{p.height}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>

        <Separator className="my-1" />

        {/* DIMENSIONS */}
        <Section label="Dimensions">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-[11px] text-muted-foreground mb-1 block">Width</Label>
              <Input
                type="number" min={1}
                value={state.width || ''}
                onChange={e => setWidth(Number(e.target.value))}
                className="h-9 text-sm font-mono"
              />
            </div>
            <button
              onClick={() => update({ aspectLocked: !state.aspectLocked })}
              className={`mb-0.5 h-9 w-9 flex items-center justify-center rounded-lg border transition-all shrink-0 ${
                state.aspectLocked
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
              title={state.aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            >
              {state.aspectLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <div className="flex-1">
              <Label className="text-[11px] text-muted-foreground mb-1 block">Height</Label>
              <Input
                type="number" min={1}
                value={state.height || ''}
                onChange={e => setHeight(Number(e.target.value))}
                className="h-9 text-sm font-mono"
              />
            </div>
          </div>

          <div className="mt-2">
            <Label className="text-[11px] text-muted-foreground mb-1 block">Unit</Label>
            <Select value={state.unit} onValueChange={(v) => setUnit(v as Unit)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map(u => <SelectItem key={u.value} value={u.value} className="text-xs">{u.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <Checkbox
              id="remember-dims"
              checked={state.rememberDimensions}
              onCheckedChange={(c) => update({ rememberDimensions: !!c })}
              className="h-3.5 w-3.5"
            />
            <label htmlFor="remember-dims" className="text-[11px] text-muted-foreground cursor-pointer select-none">
              Remember for next image
            </label>
          </div>
        </Section>

        <Separator className="my-1" />

        {/* FIT MODE */}
        <Section label="Fit Mode">
          <div className="grid grid-cols-2 gap-1.5">
            {FIT_MODES.map(m => (
              <button
                key={m.value}
                onClick={() => update({ fitMode: m.value })}
                className={`
                  relative rounded-lg px-2.5 py-2 text-left text-xs transition-all duration-150
                  ${state.fitMode === m.value
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-1 ring-primary/30'
                    : 'bg-muted/50 text-foreground hover:bg-muted border border-transparent hover:border-border/50'
                  }
                `}
              >
                <span className="font-semibold text-[11px] block">{m.label}</span>
                <span className="text-[10px] opacity-65 mt-0.5 block leading-tight">{m.desc}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Conditional bg/padding settings */}
        {(state.bgRemovalEnabled || state.fitMode === 'fit' || state.fitMode === 'pad' || state.fitMode === 'auto-center') && (
          <div className="space-y-3 px-0.5 pb-1 animate-fade-in">
            {state.fitMode === 'auto-center' && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <Label className="text-[11px] text-muted-foreground">Product Padding</Label>
                  <span className="text-[11px] font-semibold text-foreground tabular-nums">{state.autoCenterPadding}%</span>
                </div>
                <Slider
                  value={[state.autoCenterPadding]}
                  onValueChange={([v]) => update({ autoCenterPadding: v })}
                  min={0} max={40} step={1}
                />
              </div>
            )}

            <div>
              <Label className="text-[11px] text-muted-foreground mb-2 block">Background Color</Label>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="auto-bg-toggle" className="text-[11px] text-muted-foreground cursor-pointer select-none">
                  Auto-detect from image
                </label>
                <Switch
                  id="auto-bg-toggle"
                  checked={state.useAutoBgColor}
                  onCheckedChange={(c) => {
                    const newPad = c && state.detectedBgColor ? state.detectedBgColor : '#ffffff';
                    update({ useAutoBgColor: !!c, padColor: newPad });
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={state.padColor}
                  onChange={e => update({ padColor: e.target.value, useAutoBgColor: false })}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-border p-0.5 bg-transparent"
                />
                <Input
                  value={state.padColor}
                  onChange={e => update({ padColor: e.target.value, useAutoBgColor: false })}
                  className="h-9 flex-1 text-xs font-mono"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        )}

        <Separator className="my-1" />

        {/* BACKGROUND REMOVAL */}
        <Section label="Background Removal">
          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${state.bgRemovalEnabled ? 'bg-primary/15' : 'bg-muted'}`}>
                <Scissors className={`h-3 w-3 ${state.bgRemovalEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <label htmlFor="bg-removal-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
                Remove background
              </label>
            </div>
            <Switch
              id="bg-removal-toggle"
              checked={state.bgRemovalEnabled}
              disabled={!hasImage}
              onCheckedChange={toggleBgRemoval}
            />
          </div>
          {!hasImage && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">Upload an image to enable</p>
          )}
        </Section>

        <Separator className="my-1" />

        {/* EXPORT */}
        <Section label="Export">
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">Format</Label>
            <Select value={state.format} onValueChange={(v) => update({ format: v as ExportFormat })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="png" className="text-xs">PNG — lossless, transparency</SelectItem>
                <SelectItem value="jpeg" className="text-xs">JPEG — smaller, no transparency</SelectItem>
                <SelectItem value="webp" className="text-xs">WEBP — modern, efficient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(state.format === 'jpeg' || state.format === 'webp') && (
            <div className="mt-3 animate-fade-in">
              <div className="flex justify-between mb-1.5">
                <Label className="text-[11px] text-muted-foreground">Quality</Label>
                <span className="text-[11px] font-semibold text-foreground tabular-nums">{state.quality}%</span>
              </div>
              <Slider value={[state.quality]} onValueChange={([v]) => update({ quality: v })} min={10} max={100} step={5} />
            </div>
          )}

          {state.estimatedSize && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Estimated: <span className="font-semibold text-foreground">{state.estimatedSize}</span>
            </p>
          )}
        </Section>
      </div>

      {/* Sticky download footer */}
      <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3">
        <Button
          onClick={download}
          disabled={!hasImage}
          className="w-full h-10 gap-2 text-sm font-semibold shadow-sm shadow-primary/20 transition-all"
          size="lg"
        >
          <Download className="h-4 w-4" />
          Download Image
        </Button>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="h-2.5 w-2.5 text-privacy" />
          <span>All processing happens in your browser</span>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</h3>
      {children}
    </div>
  );
}
