import { AppHeader } from '@/components/AppHeader';
import { ImageUploader } from '@/components/ImageUploader';
import { ControlPanel } from '@/components/ControlPanel';
import { PreviewCanvas } from '@/components/PreviewCanvas';
import { useImageEditor } from '@/hooks/useImageEditor';
import React from 'react';

const Index = () => {
  const editor = useImageEditor();
  const { state } = editor;
  const hasImage = !!state.image;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Main canvas area */}
        <div
          className="flex flex-1 flex-col bg-canvas relative"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith('image/')) editor.loadImage(file);
          }}
        >
          {!hasImage ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="w-full max-w-lg animate-fade-in">
                <ImageUploader onImageSelect={editor.loadImage} />
              </div>
            </div>
          ) : (
            <PreviewCanvas state={state} onPan={editor.setPanOffset} onNewImage={editor.loadImage} />
          )}
        </div>

        {/* Right sidebar */}
        <aside className="w-[300px] shrink-0 border-l border-border bg-card overflow-hidden flex flex-col panel-shadow animate-slide-in">
          <ControlPanel
            state={state}
            setWidth={editor.setWidth}
            setHeight={editor.setHeight}
            setUnit={editor.setUnit}
            update={editor.update}
            applyPreset={editor.applyPreset}
            download={editor.download}
            resetImage={editor.resetImage}
            toggleBgRemoval={editor.toggleBgRemoval}
          />
        </aside>
      </div>
    </div>
  );
};

export default Index;
