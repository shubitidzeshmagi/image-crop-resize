export type FitMode = 'crop' | 'fit' | 'stretch' | 'pad' | 'auto-center';
export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type Unit = 'px' | 'in' | 'cm';

export interface Dimensions { width: number; height: number; }
export interface CropArea { x: number; y: number; width: number; height: number; }
export interface PanOffset { x: number; y: number; }

export const DPI = 96;

export function toPx(value: number, unit: Unit): number {
  switch (unit) {
    case 'in': return Math.round(value * DPI);
    case 'cm': return Math.round(value * DPI / 2.54);
    default: return Math.round(value);
  }
}

export function fromPx(px: number, unit: Unit): number {
  switch (unit) {
    case 'in': return Math.round((px / DPI) * 100) / 100;
    case 'cm': return Math.round((px * 2.54 / DPI) * 100) / 100;
    default: return Math.round(px);
  }
}

export const PRESETS: { label: string; category: string; width: number; height: number }[] = [
  { label: 'Instagram Post', category: 'Social', width: 1080, height: 1080 },
  { label: 'Instagram Story', category: 'Social', width: 1080, height: 1920 },
  { label: 'Facebook Post', category: 'Social', width: 1200, height: 630 },
  { label: 'Facebook Cover', category: 'Social', width: 820, height: 312 },
  { label: 'Twitter Post', category: 'Social', width: 1200, height: 675 },
  { label: 'Twitter Header', category: 'Social', width: 1500, height: 500 },
  { label: 'LinkedIn Post', category: 'Social', width: 1200, height: 627 },
  { label: 'LinkedIn Cover', category: 'Social', width: 1584, height: 396 },
  { label: 'YouTube Thumbnail', category: 'Social', width: 1280, height: 720 },
  { label: 'Pinterest Pin', category: 'Social', width: 1000, height: 1500 },
  { label: 'HD (1920×1080)', category: 'Standard', width: 1920, height: 1080 },
  { label: '4K (3840×2160)', category: 'Standard', width: 3840, height: 2160 },
  { label: 'Square (1000×1000)', category: 'Standard', width: 1000, height: 1000 },
];

export function detectBackgroundColor(img: HTMLImageElement): string {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const w = c.width, h = c.height;
  const pts = [[0,0],[w-1,0],[0,h-1],[w-1,h-1],[Math.floor(w/2),0],[Math.floor(w/2),h-1],[0,Math.floor(h/2)],[w-1,Math.floor(h/2)]];
  const colors: number[][] = [];
  for (const [x, y] of pts) { const d = ctx.getImageData(x,y,1,1).data; colors.push([d[0],d[1],d[2]]); }
  const avg = [0,1,2].map(i => Math.round(colors.reduce((s,c)=>s+c[i],0)/colors.length));
  return `#${avg.map(v=>v.toString(16).padStart(2,'0')).join('')}`;
}

interface PixelBounds { x: number; y: number; width: number; height: number; }

function findOpaqueBounds(data: Uint8ClampedArray, width: number, height: number): PixelBounds | null {
  let minX=width, minY=height, maxX=-1, maxY=-1;
  for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
    const i=(y*width+x)*4;
    if (data[i+3]>10) { if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
  }
  if (maxX<0||maxY<0) return null;
  return { x:minX, y:minY, width:maxX-minX+1, height:maxY-minY+1 };
}

function colorDistance(r1:number,g1:number,b1:number,r2:number,g2:number,b2:number):number {
  return Math.abs(r1-r2)+Math.abs(g1-g2)+Math.abs(b1-b2);
}

function getDominantEdgeColors(data: Uint8ClampedArray, width: number, height: number): number[][] {
  const counts = new Map<string,{count:number;color:[number,number,number]}>();
  const step = Math.max(1, Math.floor(Math.min(width,height)/120));
  const addColor = (x:number,y:number) => {
    const i=(y*width+x)*4;
    if(data[i+3]<=10) return;
    const qr=Math.round(data[i]/24)*24, qg=Math.round(data[i+1]/24)*24, qb=Math.round(data[i+2]/24)*24;
    const key=`${qr},${qg},${qb}`;
    const ex=counts.get(key);
    if(ex) ex.count+=1; else counts.set(key,{count:1,color:[qr,qg,qb]});
  };
  for(let x=0;x<width;x+=step){addColor(x,0);addColor(x,height-1);}
  for(let y=0;y<height;y+=step){addColor(0,y);addColor(width-1,y);}
  return [...counts.values()].sort((a,b)=>b.count-a.count).slice(0,4).map(e=>e.color);
}

function isNearAnyBg(data:Uint8ClampedArray,i:number,bgColors:number[][],tol=52):boolean {
  return bgColors.some(([r,g,b])=>colorDistance(data[i],data[i+1],data[i+2],r,g,b)<=tol);
}

function prepareBgRemovedSource(img: HTMLImageElement): { canvas: HTMLCanvasElement; bounds: PixelBounds } {
  const canvas = document.createElement('canvas');
  canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
  const ctx=canvas.getContext('2d')!;
  ctx.drawImage(img,0,0);
  const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
  const {data}=imageData;
  const width=canvas.width, height=canvas.height;

  const cornerAlpha=[data[3],data[((width-1)*4)+3],data[(((height-1)*width)*4)+3],data[(((height-1)*width+(width-1))*4)+3]];
  const directOpaqueBounds=findOpaqueBounds(data,width,height);
  if(cornerAlpha.some(a=>a<128)&&directOpaqueBounds) return {canvas,bounds:directOpaqueBounds};

  const bgColors=getDominantEdgeColors(data,width,height);
  if(!bgColors.length) return {canvas,bounds:directOpaqueBounds??{x:0,y:0,width,height}};

  const visited=new Uint8Array(width*height);
  const bgMask=new Uint8Array(width*height);
  const queue:number[]=[];

  const enqueue=(x:number,y:number)=>{
    if(x<0||x>=width||y<0||y>=height) return;
    const pos=y*width+x;
    if(visited[pos]) return;
    visited[pos]=1;
    const i=pos*4;
    if(data[i+3]<=10||isNearAnyBg(data,i,bgColors)){bgMask[pos]=1;queue.push(pos);}
  };

  for(let x=0;x<width;x++){enqueue(x,0);enqueue(x,height-1);}
  for(let y=0;y<height;y++){enqueue(0,y);enqueue(width-1,y);}
  while(queue.length){const pos=queue.pop()!;const x=pos%width,y=Math.floor(pos/width);enqueue(x-1,y);enqueue(x+1,y);enqueue(x,y-1);enqueue(x,y+1);}
  for(let pos=0;pos<bgMask.length;pos++) if(bgMask[pos]) data[pos*4+3]=0;

  const compId=new Int32Array(width*height).fill(-1);
  const compSizes:number[]=[];
  let curId=0;
  for(let pos=0;pos<width*height;pos++){
    if(data[pos*4+3]<=10||compId[pos]!==-1) continue;
    const q=[pos]; compId[pos]=curId; let sz=0;
    while(q.length){
      const p=q.pop()!; sz++;
      const px=p%width,py=Math.floor(p/width);
      for(const [nx,ny] of [[px-1,py],[px+1,py],[px,py-1],[px,py+1]]){
        if(nx<0||nx>=width||ny<0||ny>=height) continue;
        const np=ny*width+nx;
        if(compId[np]!==-1||data[np*4+3]<=10) continue;
        compId[np]=curId; q.push(np);
      }
    }
    compSizes.push(sz); curId++;
  }
  if(compSizes.length>1){
    let lId=0,lSz=0;
    for(let i=0;i<compSizes.length;i++) if(compSizes[i]>lSz){lSz=compSizes[i];lId=i;}
    for(let pos=0;pos<width*height;pos++) if(data[pos*4+3]>10&&compId[pos]!==lId) data[pos*4+3]=0;
  }

  ctx.putImageData(imageData,0,0);
  const bounds=findOpaqueBounds(data,width,height)??{x:0,y:0,width,height};
  return {canvas,bounds};
}

export function processImage(
  sourceImage: HTMLImageElement,
  targetWidth: number, targetHeight: number,
  fitMode: FitMode, cropArea: CropArea | null,
  padColor: string, panOffset?: PanOffset,
  autoCenterPadding?: number, hasBgRemoval?: boolean
): HTMLCanvasElement {
  const canvas=document.createElement('canvas');
  canvas.width=targetWidth; canvas.height=targetHeight;
  const ctx=canvas.getContext('2d')!;

  let drawSource: CanvasImageSource=sourceImage;
  let sx:number, sy:number, sw:number, sh:number;

  if(hasBgRemoval){
    const prepared=prepareBgRemovedSource(sourceImage);
    drawSource=prepared.canvas; sx=prepared.bounds.x; sy=prepared.bounds.y; sw=prepared.bounds.width; sh=prepared.bounds.height;
  } else if(cropArea){
    sx=cropArea.x; sy=cropArea.y; sw=cropArea.width; sh=cropArea.height;
  } else {
    sx=0; sy=0; sw=sourceImage.naturalWidth; sh=sourceImage.naturalHeight;
  }

  const ox=panOffset?.x??0, oy=panOffset?.y??0;

  switch(fitMode){
    case 'crop':{
      ctx.fillStyle=padColor; ctx.fillRect(0,0,targetWidth,targetHeight);
      const scale=Math.max(targetWidth/sw,targetHeight/sh);
      const dw=sw*scale,dh=sh*scale;
      ctx.drawImage(drawSource,sx,sy,sw,sh,(targetWidth-dw)/2+ox*scale,(targetHeight-dh)/2+oy*scale,dw,dh); break;
    }
    case 'fit':{
      ctx.fillStyle=padColor; ctx.fillRect(0,0,targetWidth,targetHeight);
      const scale=Math.min(targetWidth/sw,targetHeight/sh);
      const dw=sw*scale,dh=sh*scale;
      ctx.drawImage(drawSource,sx,sy,sw,sh,(targetWidth-dw)/2+ox*scale,(targetHeight-dh)/2+oy*scale,dw,dh); break;
    }
    case 'stretch':{
      ctx.fillStyle=padColor; ctx.fillRect(0,0,targetWidth,targetHeight);
      ctx.drawImage(drawSource,sx,sy,sw,sh,ox,oy,targetWidth,targetHeight); break;
    }
    case 'pad':{
      ctx.fillStyle=padColor; ctx.fillRect(0,0,targetWidth,targetHeight);
      const scale=Math.min(targetWidth/sw,targetHeight/sh);
      const dw=sw*scale,dh=sh*scale;
      ctx.drawImage(drawSource,sx,sy,sw,sh,(targetWidth-dw)/2+ox*scale,(targetHeight-dh)/2+oy*scale,dw,dh); break;
    }
    case 'auto-center':{
      ctx.fillStyle=padColor; ctx.fillRect(0,0,targetWidth,targetHeight);
      const padding=autoCenterPadding??15;
      const availW=targetWidth*(1-padding/50), availH=targetHeight*(1-padding/50);
      const scale=Math.min(availW/sw,availH/sh);
      const dw=sw*scale,dh=sh*scale;
      ctx.drawImage(drawSource,sx,sy,sw,sh,(targetWidth-dw)/2+ox*scale,(targetHeight-dh)/2+oy*scale,dw,dh); break;
    }
  }
  return canvas;
}

export function exportCanvas(canvas: HTMLCanvasElement, format: ExportFormat, quality: number): string {
  const mime=format==='png'?'image/png':format==='jpeg'?'image/jpeg':'image/webp';
  return canvas.toDataURL(mime, quality/100);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a=document.createElement('a'); a.download=filename; a.href=dataUrl;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

export function estimateFileSize(dataUrl: string): string {
  const b64=dataUrl.split(',')[1];
  if(!b64) return '0 KB';
  const bytes=Math.round((b64.length*3)/4);
  if(bytes<1024) return `${bytes} B`;
  if(bytes<1024*1024) return `${Math.round(bytes/1024)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}
