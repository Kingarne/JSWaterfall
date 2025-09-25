import { createSignal, onMount, onCleanup, createEffect, JSX, Accessor, createMemo } from "solid-js";
import {createStore, produce } from "solid-js/store";
import { MSSEvent } from '../events';
import InfoView from "./InfoView";
import SettingsOverlay from "./SettingButt";
import NavOverlay from "./NavOverlay";
import ScrollbarV from "./ScrollbarV";
import ScrollbarH from "./ScrollbarH";
import { ParsedDat, readDatData, LineDataInfo, LineData  } from "./DatParser";
import { linesToGrayscaleImageData } from "./DatParser";
import { LineDataHead } from "./DatParser";
import { greatCircle, destinationPoint, LatLon } from "./geo";
import { DistBear } from "./InfoView";

type RGBA = [number, number, number, number];
type Point = { x: number; y: number };

type ZoomLensProps = {
  src: string;        // image URL
  width: number;      // main canvas CSS width (px)
  height: number;     // main canvas CSS height (px)
  zoom?: number;      // magnification factor (e.g. 3 = 3x)
  lensSize?: number;  // lens box size in CSS px (square)
  round?: boolean;    // make lens circular
};

const DEFAULT_DB: DistBear = {
  dist: 0,
  bear: 0,
}

const DEFAULT_HEAD: LineDataHead = {
  nTime: 0,
  fLo: 0,
  fLa: 0,
  fHeading: 0,
  fScale: 1,
  fAlt: 0,
  fSpeed: 0,
  nState: 0n,
  fSquintAngle: 5,
};

const slarLineW = 2672;
const slarHalfW = slarLineW/2;

type LUT = Uint8Array & { length: 256 };
type RGBALUT = { r: LUT; g: LUT; b: LUT };

/** Make a LUT from a mapper i→[0..255]. */
function makeLUT(map: (i: number) => number): LUT {
  const u = new Uint8Array(256);
  for (let i = 0; i < 256; i++) u[i] = Math.max(0, Math.min(255, map(i))) | 0;
  return u as LUT;
}

/** Identity LUT (no change). */
const IDENTITY_LUT = makeLUT(i => i);

const Heatmap_LUT = makeHeatmapRGBLUT({ gamma: 1.0 });
/** Interpolate colors between stops to build a 256-entry RGB LUT. */
function makeHeatmapRGBLUT(opts?: {
  /** Optional gamma to skew the scalar domain (1 = linear). */
  gamma?: number;
  /** Override color stops if you want a different palette. */
  stops?: [pos: number, rgb: [number, number, number]][]; // pos in [0,1]
}): RGBALUT {
  const r = new Uint8Array(256) as LUT;
  const g = new Uint8Array(256) as LUT;
  const b = new Uint8Array(256) as LUT;

  const stops =
    opts?.stops ??
    ([
      [0.00, [0, 0, 0]],        // black (optional: use [0,0,32] for dark navy)
      [0.15, [0, 0, 128]],      // dark blue
      [0.35, [0, 255, 255]],    // cyan
      [0.50, [0, 255, 0]],      // green
      [0.70, [255, 255, 0]],    // yellow
      [0.85, [255, 96, 0]],     // orange
      [1.00, [255, 255, 255]],  // white (or [255,0,0] if you want to end at red)
    ] as [number, [number, number, number]][]);

  const gamma = Math.max(0.01, opts?.gamma ?? 1);

  for (let i = 0; i < 256; i++) {
    // scalar in [0,1] with optional gamma shaping
    let x = i / 255;
    x = Math.pow(x, gamma);

    // find the two surrounding stops
    let j = 0;
    while (j < stops.length - 1 && x > stops[j + 1][0]) j++;
    const [p0, c0] = stops[j];
    const [p1, c1] = stops[Math.min(j + 1, stops.length - 1)];
    const t = p1 > p0 ? (x - p0) / (p1 - p0) : 0;

    // linear interpolate RGB
    const R = Math.round((1 - t) * c0[0] + t * c1[0]);
    const G = Math.round((1 - t) * c0[1] + t * c1[1]);
    const B = Math.round((1 - t) * c0[2] + t * c1[2]);

    r[i] = R; g[i] = G; b[i] = B;
  }

  return { r, g, b };
}

export default function SBComp() 
{
    let divRef: HTMLDivElement | undefined;        
    let scRef: HTMLDivElement;        
    let scHRef: HTMLDivElement;        
    let infoV: HTMLDivElement;        
    let canvasRef: HTMLCanvasElement;
    let OLCanvRef: HTMLCanvasElement;    
    let overlay!: HTMLDivElement;
    let ro: ResizeObserver | undefined;

    const props:ZoomLensProps = {src:"", width:50, height:50, zoom:3.0, lensSize:300, round:true};
    const lensSize = props.lensSize ?? 250;
    const makeRound = props.round ?? true;

    let lensCanvas!: HTMLCanvasElement; // canvas inside the lens
    let lensDiv!: HTMLDivElement;       // floating lens container
    let lensCtx!: CanvasRenderingContext2D;

    const INITIAL_PARSED_DAT: ParsedDat = {
  info: {} as LineDataInfo, // TODO: put your real defaults here
  imgWidth: 0,
  eLineType: 0,
  lineLength: 0,
  lineCount: 0,
  lines: [] as LineData[], // reversed order (push_front style)
};
    let slarData:ParsedDat = INITIAL_PARSED_DAT;
   
    var comWS:any;
  
    //let wfInsertPos:number=-1;
    const [insertPos, setInsertPos] = createSignal(-1);
    const [zoom, setZoom] = createSignal(1.0);
    const [newTop, setNewTop] = createSignal(0);
    const [newLeft, setNewLeft] = createSignal(0);
    const [scrollY, setScrollY] = createSignal(0);
    const [scrollX, setScrollX] = createSignal(0);
    const [divHeight, setDivHeight] = createSignal(600);
    const [contentHeight, setContentHeight] = createSignal(800);
    const [divWidth, setDivWidth] = createSignal(600);
    const [contentWidth, setContentWidth] = createSignal(800);
    const [imgPos, setImgPos] = createSignal<Point>({ x: 0, y: 0 });
    const [cliPos, setCliPos] = createSignal({ x: 0, y: 0 });
    const [hover, setHover] = createSignal(false);    
    const [rgba, setRgba] = createSignal<RGBA>([0,0,0,255]);
    const [keyHeld, setKeyHeld] = createSignal('');
    const [cliCenter, setCliCenter] = createSignal(100);
    const [isTop, setIsTop] = createSignal(true);
    const [offsetX, setOffsetX] = createSignal(0);
    const [meta, setMeta] = createSignal<LineDataHead>(DEFAULT_HEAD);
    const [distBear, setDistBear] = createSignal<DistBear>(DEFAULT_DB);
    const [enhance, setEnhance] = createSignal(0);
    const [lut, setLut] = createSignal<LUT>(IDENTITY_LUT);
    const [RGBLut, setRGBLut] = createSignal<RGBALUT>(Heatmap_LUT);
    const [navJson, setNavJson] = createSignal<string>( JSON.stringify({lat: 59.3293, lon: 18.0686, speed: 14.2, /*knots*/ heading: 72, /*degrees*/ alt: 120, /* meters*/ time: new Date().toISOString() }));
    const [DBPos1, setDBPos1] = createSignal({x:-1, y:-1});  
    const [DBPos2, setDBPos2] = createSignal({x:-1, y:-1});  
  
    type Target = {
      img:Point;     
      geo:LatLon; 
      meta:{hover:boolean, selected:boolean}
    };

    const def_TRG:Target[] = [];//{img:{x:0,y:0}, geo:{lat:0,lon:0}, meta:{hover:false, selected:false}};
    
    const [targets, setTargets] = createStore<Target[]>(def_TRG);
// --- helpers ---
 const addTarget = (t: Target) =>
  setTargets(produce(list => { list.push(t); }));

 const removeTrgAt = (index: number) =>
  setTargets(produce(list => { list.splice(index, 1); }));

 const setTrgImg = (index: number, x: number, y: number) =>
  setTargets(index, "img", { x, y });

 const setTrgGeo = (index: number, lat: number, lon: number) =>
  setTargets(index, "geo", { lat, lon });

 const setTrgHover = (index: number, hover: boolean) =>
  setTargets(index, "meta", "hover", hover);

 const toggleTrgSelected = (index: number) =>
  setTargets(index, "meta", "selected", v => !v);

   //let targets: Target[] = [];

  const css = () => {
      const [r, g, b, a] = rgba();
      return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    };

  // Drag state
  const [dragging, setDragging] = createSignal(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let startScrollX = 0;
  let startScrollY = 0;

  let lastNavTime = 0;          // timestamp of last setNav  

  const updateOverlayPos = () => {
    if (!canvasRef) return;
    const r = canvasRef.getBoundingClientRect();
    setOvPos({ left: Math.round(r.left + 8), top: Math.round(r.top + 8) });
  };


    //const slarDat = new URL('../assets/SLAR_10420003.dat', import.meta.url).href  
    //const imgBmp = new URL('../assets/SLAR-smal2.bmp', import.meta.url).href
    //const imgBmp = new URL('../assets/SLAR-mark.bmp', import.meta.url).href
    //const imgBmp = new URL('../assets/SLAR-large.bmp', import.meta.url).href
   // const img = new Image();
    // Optionally handle cross-origin images (if needed).
    // img.crossOrigin = "anonymous";
    //img.src = imgBmp;
    
    let backCanvas = document.createElement('canvas');
    let backCtx = backCanvas.getContext('2d', { willReadFrequently: true } );     
    //let wfInsertPos:number=-1;

    //const canvasHeight = 1200;d
    //let viewportHeight = 600;

    const updateCanvasSize = () => {
        if (divRef && canvasRef && OLCanvRef) {
          // Get the parent element's current size.
          const { clientWidth, clientHeight } = divRef;
          // Update the canvas's drawing buffer size.
          canvasRef.width = clientWidth;
          canvasRef.height = clientHeight;
          OLCanvRef.width = clientWidth;
          OLCanvRef.height = clientHeight;
          setDivHeight(clientHeight);
          setDivWidth(clientWidth);
          
          //console.log("hej:", canvasRef.width, canvasRef.height);
        }
    }

    const toLocal = (e: MouseEvent) => {
    const r = canvasRef.getBoundingClientRect();
    return { x: (e.clientX - r.left), y: (e.clientY - r.top) };
  };

const InvY = (y:number):number => {return (backCanvas.height-insertPos())-y;}

  const img2Cli = (imgX: number, imgY: number, fromTop:boolean=true) => {
  if (!canvasRef)
    return { x: 0, y: 0 };

  // image → device pixels inside the canvast
  if(!fromTop){
    imgY = InvY(imgY);
  }
  // (apply zoom, then remove scroll)
  let dx = imgX * zoom() - scrollX();
  let dy = imgY * zoom() - scrollY();

  // clamp to the canvas backing-store (device px)
  dx = Math.min(canvasRef.width - 1, Math.max(0, Math.floor(dx)));
  dy = Math.min(canvasRef.height - 1, Math.max(0, Math.floor(dy)));

  // device px → client (CSS) px
  const cliX = dx  + offsetX();
  const cliY = dy ;

  
  return { x: cliX, y: cliY };
};
  
  const cli2Img = (cliX: number, cliY: number, fromTop:boolean=true) => {
    if(!canvasRef)
      return { x: (0), y: (0) };

    let ix = scrollX() + Math.min(canvasRef.width - 1, Math.max(0, Math.floor(cliX )));
    let iy = scrollY() + Math.min(canvasRef.height - 1, Math.max(0, Math.floor(cliY )));
    ix = ix-offsetX();

    ix = ix/zoom();
    iy = iy/zoom();
    if(!fromTop){
      iy = InvY(iy);
    }
   //z iy = iy+wfInsertPos;
  //console.log("p:" + ix + "," + iy);

    return { x: (Math.floor(ix)), y: (Math.floor(iy)) };
  
  }

const img2Geo = (x:number, y:number):LatLon => {

  if(y >= slarData.lineCount)
    return {lat:0, lon:0};
          
  //const m = cloneHead(slarDatda.lines[y].head); 
  const m = slarData.lines[y].head; 
  const start = { lat: m.fLa, lon: m.fLo }; 
  const dist = x-slarHalfW;            
  const ang = (dist > 0) ? 90-m.fSquintAngle: 270+m.fSquintAngle;
  const dir = m.fHeading + ang;
  const absDist = Math.abs(dist)*60;
  const dest = destinationPoint(start, dir, absDist, { unit: "m" });       
  //m.fLa = dest.lat;
  //m.fLo = dest.lon;
    
  return {lat:dest.lat, lon:dest.lon}
}

const cloneHead = (h: LineDataHead): LineDataHead => ({ ...h });

  const pick = (clientX: number, clientY: number) => {
    if(!canvasRef)// || slarData === undefined || slarData.lineCount === undefined)
      return;

    const p = cli2Img(clientX, clientY);
    setCliPos({x:clientX, y:clientY});
   
    const data = backCtx!.getImageData(p.x, p.y+insertPos(), 1, 1).data;

    setImgPos({x:p.x, y:p.y});
    setRgba([data[0], data[1], data[2], data[3]]);

    //console.log("lc: " + p.y);
    if(p.y < slarData!.lineCount)
    {      
      const m = cloneHead(slarData.lines[p.y].head); 
     /* const start = { lat: m.fLa, lon: m.fLo }; 
      const dist = p.x-slarHalfW;            
      const ang = (dist > 0) ? 90-m.fSquintAngle: 270+m.fSquintAngle;
      const dir = m.fHeading + ang;
      const absDist = Math.abs(dist)*60;
      const dest = destinationPoint(start, dir, absDist, { unit: "m" });       
      m.fLa = dest.lat;
      m.fLo = dest.lon;*/

      const geo = img2Geo(p.x, p.y);
      m.fLa = geo.lat;
      m.fLo = geo.lon;
      setMeta(m);  


      //console.log(navJson());
      let o = JSON.parse(navJson() ?? "{}");// as Record<string, unknown>;
      //console.log(o);
      const AC:LatLon = { lat: o.lat, lon: o.lon };
      
      const res = greatCircle(AC, geo, { unit: "nm" }); // nautical miles
      //console.log(`Distance: ${res.distance.toFixed(1)} m`);
      //console.log(`Initial bearing: ${res.initialBearing.toFixed(1)}°`);
      //console.log(`Final bearing: ${res.finalBearing.toFixed(1)}°`);

      setDistBear({dist:res.distance, bear:res.initialBearing});      
     
      //bc.postMessage({ type: 'hello', t: Date.now() });
      //bc.postMessage(JSON.stringify(pos));//){ pos: 'hello', t: Date.now() });
      if(hover())
      {
        const cm = keyHeld() === "c" ? 1 : 0;
        const pos = {cmd: cm, la:m.fLa, lo:m.fLo, t: Date.now()};
        //console.log(pos);
        bc.postMessage(pos);
      }
    }

    
    //  console.log(meta().fHeading);
    //  console.log(slarData.lines[p.y].head.fHeading);

  };

function drawLensAt(clientX: number, clientY: number) {
    if (keyHeld() !== 'z') return;

    // Position lens near the cursor
    const pad = 5; // offset from cursor
    let left = clientX + pad;
    let top = clientY + pad;

    // Keep lens within viewport if it would spill off-screen
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (left + lensSize > vw) left = clientX - lensSize - pad;
    if (top + lensSize > vh) top = clientY - lensSize - pad;

    //console.log("cli: " + clientX + ", " + clientY);
    //lensDiv.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    lensDiv.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;

    lensCtx.clearRect(0, 0, lensSize, lensSize);

 // Source rect in image px: make it lensSize/zoom, centered on (ix, iy)
    let ix = imgPos().x;
    let iy = imgPos().y;

    const srcW = lensSize / (zoom()*4);//props.zoom!;
    const srcH = lensSize / (zoom()*4);//props.zoom!;
    let sx = ix - srcW / 2;
    let sy = iy - srcH / 2;

    let width:number = backCanvas.width;
    let height:number = backCanvas.height;
    // Clamp to image bounds so the lens is always filled
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sx + srcW > width) sx = width - srcW;
    if (sy + srcH > height) sy = height - srcH;

    //lensCtx.imageSmoothingEnabled = true;
    //(lensCtx as any).imageSmoothingQuality = "high";
    // Draw from offscreen original -> lens canvas (scaled to fill)
   // lensCtx.save();
    lensCtx.imageSmoothingEnabled = false;

    lensCtx.drawImage(backCanvas, sx, insertPos() + sy, srcW, srcH, 0, 0, lensSize, lensSize);
   // lensCtx.restore();
    // Optional crosshair
    lensCtx.strokeStyle = "rgba(219, 43, 43, 0.6)";
    lensCtx.lineWidth = 1;
    lensCtx.beginPath();
    lensCtx.moveTo(lensSize / 2, 0);
    lensCtx.lineTo(lensSize / 2, lensSize);
    lensCtx.moveTo(0, lensSize / 2);
    lensCtx.lineTo(lensSize, lensSize / 2);
    lensCtx.stroke();
}

  // --- Event listeners on the <canvas> ---
  const onPointerMove = (e: PointerEvent) => {
    //const p = toLocal(e);
    pick(e.clientX, e.clientY);
    
    if (hover() && keyHeld() === 'z') {
        console.log("draw lens");
        lensDiv.style.opacity = "1";
        drawLensAt(e.clientX, e.clientY);
        return;
      }

      if(hover() && keyHeld() === "d")
      {
        const p= cli2Img(e.clientX, e.clientY, false);
        setDBPos2({x:p.x, y:p.y});
        //console.log("create target");
        //console.log(DBPos2());
        return;
      }

      //hittest
      targets.forEach((t, i) => {
        const cl = img2Cli(t.img.x, t.img.y, false);
        const dist = Math.hypot(cl.x-e.clientX, cl.y-e.clientY);
        setTrgHover(i, dist< 15);
        //t.meta.hover = dist< 15;
      //  console.log(t.meta.hover);

      });
      

      if (dragging()){
        // If the left button is released, stop dragging
        if ((e.buttons & 1) === 0) {
          setDragging(false);
          canvasRef.style.cursor = "crosshair";
          return;
        }

        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        let y = scrollY() - dy;                                   
        const clampedY = Math.max(0, Math.min(y, (contentHeight()-divHeight())));
        CenterAtVert(clampedY);

        let x = scrollX() - dx; 
        const clampedX = Math.max(0, Math.min(x, (contentWidth()-divWidth())));
        CenterAtHor(clampedX);
      }



//      console.log("dx:" + dx + ", dy: " + dy);
    //setPos(p);
   // updateOverlayPos();
   // DrawCanvas();
  };
  

  const onPointerDown = (e: PointerEvent) => {
     //CenterAtImgVert( imgPos().y);
      if (e.button !== 0) return; // left only
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
     setDragging(true);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      startScrollX = scrollX();
      startScrollY = scrollY();
      canvasRef.style.cursor = "grabbing";

      if(keyHeld() === "d")
      {
        const p= cli2Img(e.clientX, e.clientY, false);
        setDBPos1({x:p.x, y:p.y});
        //console.log("create target");
        //console.log(DBPos1());
      }

      if(keyHeld() === "t")
      {
        const p= cli2Img(e.clientX, e.clientY, false);
        const ta:Target = {img:{x:p.x, y:p.y},geo:{lat:59, lon:18}, meta:{hover:false, selected:false}};
        addTarget(ta);
        //targets.push(ta);
      
        //console.log(ta);
        DrawOverlay();
        //console.log(DBPos1());
      }


      
     //CenterAtImg(imgPos().x, imgPos().y);     

   // console.log("down:", imgPos().y)
  };

  const onPointerUp = () => {
      setDragging(false);
      canvasRef.style.cursor = "crosshair";
    };


  const onEnter = (e: MouseEvent) => { 
    console.log("onEnter");
    setHover(true); 
    if (keyHeld() === 'z') lensDiv.style.opacity = "1";  
    pick(e.clientX, e.clientY); 
    DrawCanvas(); 
  };

   // Hold 'm' to show lens
    const onKeyDown = (e: KeyboardEvent) => {
      
      //if (e.key.toLowerCase() === "z") {
        if (keyHeld() !== e.key.toLowerCase()) {
          setKeyHeld(e.key.toLowerCase());        
          
          if (hover() && e.key.toLowerCase() === "z") {
            console.log("onKeyDown");
            lensDiv.style.opacity = "1";
            const m = cliPos();
            drawLensAt(m.x, m.y);
          }
        }
      //}
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "z") {
        console.log("onKeyUp");      
        lensDiv.style.opacity = "0";
      }
       
      if (e.key.toLowerCase() === "d") {        
        setDBPos1({x:-1, y:-1});
      }
      setKeyHeld('');
    };

  const onLeave = () => { setHover(false); DrawCanvas(); };
  const dpr = () => Math.max(1, window.devicePixelRatio || 1);

// --- Transparent overlay drawing (no background fill) ---
  const DrawOverlay = () => {
     const ctx = OLCanvRef!.getContext('2d', { willReadFrequently: true });
    console.log("draw overlay");
     if(!ctx)
      return;

    
    const w = OLCanvRef!.clientWidth, h = OLCanvRef!.clientHeight;
    ctx.clearRect(0, 0, w, h);  // keep it transparent

    const t1:Point = DBPos1();
    if(t1.x > 0)
    {
      //Draw distance and bearing
      const t2:Point = DBPos2();
      
      const geo1 = img2Geo(t1.x, InvY(t1.y));
      const geo2 = img2Geo(t2.x, InvY(t2.y));
      //console.log(geo1);
      //console.log(geo2);
      const res = greatCircle(geo1, geo2, { unit: "nm" }); // nautical miles      

      const p = img2Cli(t1.x, t1.y, false);
      const p2 = img2Cli(t2.x, t2.y, false);
      const x = 0;
      const y = 0;
      //ctx.strokeStyle = '#ef4444';
      ctx.strokeStyle = '#429e85';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 5, 0, 2 * Math.PI);
      ctx.stroke();

      const fontH = 18;
      const lineH = fontH+2;
      const xmarg = 20;
      const textY = p2.y+fontH;
      ctx.fillStyle = '#1d5143af';
      const line1 = `Dist: ${res.distance.toFixed(1)}nm`;
      const line2 = `Bear: ${res.initialBearing.toFixed(1)}°`;
      let s1 = ctx.measureText(line1).width*1.2;
      let s2 = ctx.measureText(line2).width*1.2;     
      ctx.beginPath();
      ctx.roundRect(p2.x+10, p2.y, Math.max(s1, s2), lineH*2.2, 6);
      ctx.fill();

      ctx.font = `normal ${fontH}px courier`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line1, p2.x+xmarg, textY);
      ctx.fillText(line2, p2.x+xmarg, textY + lineH);
      //fgCtx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
      //fgCtx.arc(p.x, p.y, 15, 0, 2 * Math.PI);
      

      ctx.beginPath(); ctx.moveTo(p.x , p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    // fgCtx.beginPath(); fgCtx.moveTo(0, h); fgCtx.lineTo(w, 0); fgCtx.stroke();
      ctx.fillStyle = '#ef4444';
      //fgCtx.beginPath(); fgCtx.arc(x, y, 4, 0, Math.PI * 2); fgCtx.fill();
    }

    //Draw targets
    targets.forEach((t, i) => {
      const p = img2Cli(t.img.x, t.img.y, false);

      //ctx.strokeStyle = '#7b11b2';
      const sz = t.meta.hover ? 20:15;
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = t.meta.hover ? '#1b11b25f' : '#7b11b2bf';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, 2 * Math.PI);
     // ctx.stroke();
     //  ctx.beginPath();
     // ctx.arc(p.x, p.y, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      //console.log(`#${i}: cx=${p.x}, cy=${p.y}, x=${t.img.x}, y=${t.img.y}, lat=${t.geo.lat}, lon=${t.geo.lon}`);
    });

  }

    const DrawCanvas = () => {
        if(!canvasRef)
            return;
console.log("draw canvas");
        /*let w = backCanvas.width/2;
        const p = img2Cli(w, 0);
        setCliCenter(p.x);*/

        //console.log("DrawCanvas");
        const ctx = canvasRef.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.fillStyle = "#93b0f1";
        ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);

       // ctx.fillStyle = "#8080fb";
       // ctx.fillRect(0, scrollY(), canvasRef.width, viewHeight());
        let scrX = scrollX();
        let scrY = scrollY();
        if (backCtx ) {
             ctx.drawImage(backCanvas, scrX/zoom(), insertPos()+scrY/zoom(), canvasRef.width/zoom(), canvasRef.height/zoom(), offsetX(), 0, canvasRef.width, canvasRef.height);
  
        // 2) Apply LUT on the front canvas pixels
        if(enhance() == 1)
        {
         // console.log(canvasRef.width, canvasRef.height);
          const img = ctx!.getImageData(offsetX(), 0, canvasRef.width-2*offsetX(), canvasRef.height);
          const data = img.data; // Uint8ClampedArray [R,G,B,A, ...]
          //const l = lut();
          const lr = RGBLut().r;
          const lg = RGBLut().g;
          const lb = RGBLut().b;
          
          for (let i = 0; i < data.length; i += 4) {
          const r = data[i];//, g = data[i + 1], b = data[i + 2];
          data[i]     = lr[r];//l[r];
          data[i + 1] = lg[r];//l[g];
          data[i + 2] = lb[r];//l[b]; 
          // preserve alpha          
          }
          ctx!.putImageData(img, offsetX(), 0);   
        }
        else if(enhance() == 2)
        {
          //(canvasRef.width, canvasRef.height);
          const img = ctx!.getImageData(offsetX(), 0, canvasRef.width-2*offsetX(), canvasRef.height);
          const data = img.data; // Uint8ClampedArray [R,G,B,A, ...]
          const l = lut();
          
          for (let i = 0; i < data.length; i += 4) {
          const r = data[i];//, g = data[i + 1], b = data[i + 2];
          data[i]     = l[r];
          data[i + 1] = l[r];
          data[i + 2] = l[r]; 
          // preserve alpha          
          }
          ctx!.putImageData(img, offsetX(), 0);   
        }
       
        let p = img2Cli(1336,0);
        
       // console.log(p.x);
        ctx.strokeStyle = "#1fff1f5f";
        ctx.lineWidth = 3; 
        ctx.beginPath();
        ctx.moveTo(p.x, 0);
        ctx.lineTo(p.x, canvasRef.height);
        ctx.stroke();
      
       // DrawOverlay();
      }

         // Crosshair at mouse
    /*if (hover()) {
      const { x, y } = cliPos();
      const X = x;// * dpr(), 
      const Y = y;// * dpr();
      ctx.strokeStyle = "#ff2d3a99";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, Y); ctx.lineTo(canvasRef.width, Y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X, canvasRef.height); ctx.stroke();

      ctx.fillStyle = "#4f46e5"; // dot
      ctx.beginPath(); ctx.arc(X, Y, 5 * dpr(), 0, Math.PI * 2); ctx.fill();

      // Position label
      ctx.fillStyle = "#e5e7eb";
      ctx.font = `${12 * dpr()}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      const label = `(${Math.round(x)}, ${Math.round(y)})`;
      ctx.fillText(label, X + 8 * dpr(), Y - 8 * dpr());
    }*/
      
      
    }

    const handleWheel = (e: WheelEvent) => {       
        //scRef!.innerText = "hej";
//        console.log("canvas wheel bef: " + scrollY());
       
      if (e.ctrlKey) {  
        e.preventDefault();
       
        //console.log("D: " + e.deltaY);        
        let newz = zoom() * (e.deltaY > 0 ? 0.9: 1.1);        
        if(newz< 0.2)
          return;

        console.log(imgPos().x, imgPos().y);

        setZoom(newz);
        setContentHeight(backCanvas.height*zoom());
        setContentWidth(backCanvas.width*zoom());
        CenterAtImg( imgPos().x, imgPos().y);///zoom());
        //CenterAtHor(scrollX());///zoom());
       // console.log("newz: " + newz + ", " + backCanvas.height*zoom());

        return;
      }

      if (!e.shiftKey) {  
        //console.log("canvas wheel: " + scrollY());
        let y = scrollY() + e.deltaY/2;                                     
        const clampedY = Math.max(0, Math.min(y, (contentHeight()-divHeight())));
        CenterAtVert(clampedY);
      }
      else
      {
        
        let x = scrollX() + e.deltaY/2;      
        const clampedX = Math.max(0, Math.min(x, (contentWidth()-divWidth())));
        CenterAtHor(clampedX);
      }

      /*setScrollY(clampedY);

        const fac = y / (contentHeight()-divHeight());
        const thumbHeight = Math.max((divHeight() / contentHeight()) * divHeight(), 30);
        const maxTop = divHeight() - thumbHeight;
        const top = fac * maxTop;
        const clampedTop = Math.max(0, Math.min(top, maxTop));

        console.log("new top: " + clampedTop);
        setNewTop(clampedTop);        */
        //const scrollY = (clampedTop / maxTop) * (props.contentHeight - props.wndHeight);

       // 
        //const startTop = thumbRef.offsetTop;
      //  updateScroll(startTop + e.deltaY/10);
    };

function addSlarLine(data:any) : number
{	
	if (!data.slar || !backCtx) {
		return -1;
	}
	
    if (!data.slar.data) {
		return -1;
	}
    if (!data.slar.data.pixels) {
		return -1;
	}
    //console.log("length: ", slar.data.pixels);
	
    if(insertPos() < 0)
        GrowCanvas(60*10); 

  if (!slarData) return -1;

    // Create a LineDataHead with whatever values you want
    const head: LineDataHead = {
      nTime: Math.floor(Date.now() / 1000),
      fLo: data.gnss.longitude,
      fLa: data.gnss.latitude,
      fHeading: data.fms.true_heading!.heading,
      fScale: 60,
      fAlt: data.gnss.altitude,
      fSpeed: data.gnss.speed,
      nState: 0n,
      fSquintAngle: 0,
    };

    // push_front equivalent: add to the front; keep data EMPTY
    slarData.lines = [{ head, data: new Uint8Array(0) }, ...slarData.lines];
    slarData.lineCount = slarData.lines.length;

	var line = atob(data.slar.data.line);	
    var img = backCtx.createImageData(line.length, 1);
	var imgData = img.data;
	for (let i = 0; i < line.length; i++) {
		var value = line.charCodeAt(i);
		imgData[4 * i] = value;
		imgData[4 * i + 1] = value;
		imgData[4 * i + 2] = value;
		imgData[4 * i + 3] = 255;
	}
	/*for (let i = 1332; i < 1335; i++) {
			imgData[4 * i] = 127;
			imgData[4 * i + 1] = 255;
			imgData[4 * i + 2] = 127;
			imgData[4 * i + 3] = 224;		
	}*/
	backCtx.putImageData(img, 0, insertPos());
    setInsertPos(insertPos()-1);    
    return 0;
    }

   
    function GrowCanvas(grow:number)
    {
        console.log("GrowCanvas: ", grow);
        // Create a new canvas, slightly taller
        const newCanvas = document.createElement('canvas');
        const newCtx = newCanvas.getContext('2d',  { willReadFrequently: true });
        newCanvas.width = backCanvas.width;
        newCanvas.height = backCanvas.height + grow; // extra rows   
        newCtx!.drawImage(backCanvas, 0, grow);
        setInsertPos(grow-1);
        backCanvas = newCanvas;
        backCtx = backCanvas.getContext('2d',  { willReadFrequently: true });    
    }    

    const HandleMssEvent: JSX.EventHandler<Document, MSSEvent> = (event) =>{
        switch(event.detail.type)
        {              
          case "SDPStatusMessage":{
            const data = event.detail.data;
            //console.log("SDPStatusMessage");
            
            if(addSlarLine(data) >= 0)
            {
              setContentHeight(contentHeight()+1);     
              if(scrollY() != 0)
                setScrollY(scrollY()+zoom());         
              DrawCanvas();
              pick(cliPos().x,cliPos().y);
            }

            if(Date.now()-lastNavTime > 500)
            {                        
              const obj ={lat: data.gnss.latitude,
              lon: data.gnss.longitude,
              speed: data.gnss.speed,        // knots
              heading: data.fms.true_heading!.heading,        // degrees
              alt: data.gnss.altitude,           // meters
              time: new Date().toISOString()};            

              const str = JSON.stringify(obj);
              //console.log(str);    
              setNavJson( str);
              lastNavTime = Date.now();
            }

            break;        
          }
        }
      };    

      onCleanup(()=>{        
        document.removeEventListener("mssevent", HandleMssEvent as EventListener);
      });

      const hex = () => {
const [r,g,b] = rgba();
const toHex = (n:number) => n.toString(16).padStart(2,'0');
return '#' + toHex(r) + toHex(b) + toHex(g);
};


function CenterAtImg(cx:number, cy:number)
{
  CenterAtImgVert(cy);
  CenterAtImgHor(cx);
}

function CenterAtImgVert(cy:number)
{
  //console.log("centerX: " + cx + ", cH: " + contentHeight());
  const maxY = contentHeight()-divHeight();

  
  const newC = cy*zoom()-(divHeight()/2);
  const clampedY = Math.max(0, Math.min(newC, maxY));
 // console.log("newC: " + clampedY);
  setScrollY(clampedY);

  const fac = clampedY / (contentHeight()-divHeight());
  const thumbHeight = Math.max((divHeight() / contentHeight()) * divHeight(), 30);
  const maxTop = divHeight() - thumbHeight;
  const top = fac * maxTop;
  const clampedTop = Math.max(0, Math.min(top, maxTop));

  //console.log("New top: " + clampedTop + ", " + maxTop);
  setNewTop(clampedTop);    
}

function CenterAtImgHor(cx:number)
{
  //console.log("centerY: " + cx + ", cH: " + contentHeight());
  const maxX = contentWidth()-divWidth();
  
  const newC = cx*zoom()-(divWidth()/2);
  const clampedX = Math.max(0, Math.min(newC, maxX));
// console.log("newC: " + clampedX);
  setScrollX(clampedX);

  const fac = clampedX / (contentWidth()-divWidth());
  const thumbWidth = Math.max((divWidth() / contentWidth()) * divWidth(), 30);
  const maxLeft = divWidth() - thumbWidth;
  const left = fac * maxLeft;
  const clampedLeft = Math.max(0, Math.min(left, maxLeft));

  //console.log("New top: " + clampedTop + ", " + maxTop);
  setNewLeft(clampedLeft);    
}


function CenterAtVert(center:number)
{
  //console.log("centerY: " + center + "cH: " + contentHeight());
  setScrollY(center);

  const fac = center / (contentHeight()-divHeight());
  const thumbHeight = Math.max((divHeight() / contentHeight()) * divHeight(), 30);
  const maxTop = divHeight() - thumbHeight;
  const top = fac * maxTop;
  const clampedTop = Math.max(0, Math.min(top, maxTop));

  //console.log("New top: " + center + ", " + clampedTop);
  setNewTop(clampedTop);    
}

function setupLensCanvas() {
    const dpr = 1;//Math.max(1, window.devicePixelRatio || 1);
    lensCanvas.style.width = `${lensSize}px`;
    lensCanvas.style.height = `${lensSize}px`;
    lensCanvas.width = Math.round(lensSize * dpr);
    lensCanvas.height = Math.round(lensSize * dpr);
    //lensCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

function CenterAtHor(center:number)
{
  setScrollX(center);  
   const fac = center / (contentWidth()-divWidth());
    const thumbWidth = Math.max((divWidth() / contentWidth()) * divWidth(), 30);
    const maxLeft = divWidth() - thumbWidth;
    const left = fac * maxLeft;
    const clampedTop = Math.max(0, Math.min(left, maxLeft));
    
    //console.log("new top: " + clampedTop);
    setNewLeft(clampedTop);        
}


function makeSigmoidContrastLUT(
  amount = 1,
  slope = 8,
  midpoint = 0.5
): LUT {
  const a = Math.min(1, Math.max(0, amount));
  const m = Math.min(1, Math.max(0, midpoint));
  const s = Math.max(0.0001, slope);

  // Normalize the logistic so x=0 → 0 and x=1 → 1
  const sig = (x: number) => 1 / (1 + Math.exp(-s * (x - m)));
  const y0 = sig(0);
  const y1 = sig(1);
  const norm = (y: number) => (y - y0) / (y1 - y0);

  const lut = new Uint8Array(256) as LUT;
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    const y = norm(sig(x));            // pure S-curve in [0,1]
    const mix = (1 - a) * x + a * y;   // blend with identity
    lut[i] = Math.max(0, Math.min(255, Math.round(mix * 255)));
  }
  return lut;
}



  function onComMessage(event: MessageEvent)
  {
    //TODO Verify Event Data is ACTUALLY a SDPMessage!!
    const data = JSON.parse(event.data);
    console.log(data);
  }

function ConnectToPage()
{
  try {
        comWS.onopen = function() {
          console.log("Connected to page");
          comWS.addEventListener("message", onComMessage);
        };
        
        comWS.onclose = function() {
          console.log("Close page connection");
          setTimeout(function() {
            ConnectToPage();
          }, 3000);
        }
      } catch(exception) {
        alert("Error" + exception);
    }
    
}
  

let bc:any;

function step(timestamp:DOMHighResTimeStamp) {
// console.log(timestamp);
 requestAnimationFrame(step);
}  

const hexProper = () => {
  const [r,g,b] = rgba();
  const toHex = (n:number) => n.toString(16).padStart(2,'0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
};
    //let timerId:number=0;
    onMount(() => {

        //img.onload = () => {
            lensCtx = lensCanvas.getContext("2d")!;
            backCanvas.width = 2672;//img.width;
            backCanvas.height = 1;
           // backCtx!.drawImage(img, 0, 0);

            console.log("Image loaded via event.");
            setContentHeight(1);  
            setContentWidth(backCanvas.width);      

            CenterAtVert(0);
            CenterAtHor(backCanvas.width/2-divWidth()/2);
                     
            setupLensCanvas();           
            setLut(makeSigmoidContrastLUT(1, 8, 0.5)); // amount=1, slope=8, midpoint=0.5
            //DrawCanvas();
                     
            
            const url = new URL('../assets/slar/SLAR_10420003.dat', import.meta.url).href;
            //const url = new URL('../assets/slar/SLAR_104d0003.dat', import.meta.url).href;
            //tconst url = new URL('../assets/slar/SLAR_10510003.dat', import.meta.url).href;

            (async () => {
              const parsed = await readDatData(url);
              console.log('Info:', parsed.info);
              console.log('Lines:', parsed.lineCount);
              console.log('First head (last in file):', parsed.lines[10]?.head);
             // console.log('First data bytes:', parsed.lines[0]?.data);

              slarData = parsed;

              // If your parser used lines.unshift(...) (push_front), you usually want flipY=false.
              // Use flipY=true to show file order (top row = first line read).
              const imageData = linesToGrayscaleImageData(parsed, /* flipY */ false);
             

             // const canvas = document.getElementById("cv") as HTMLCanvasElement;
              //const ctx = canvasRef!.getContext("2d", { willReadFrequently: true })!;
              //canvasRef!.width = imageData.width;
              //canvasRef!.height = imageData.height;
            //backCanvas.width = imageData.width;
              backCanvas.height = imageData.height;
              setContentHeight(imageData.height);
              backCtx!.putImageData(imageData, 0, 0);
              CenterAtHor(backCanvas.width/2-divWidth()/2);
              DrawCanvas();
            })();

            const stockholm = { lat: 59.3293, lon: 18.0686 };
            const london    = { lat: 51.5074, lon: -0.1278 };

            const res = greatCircle(stockholm, london, { unit: "m" }); // nautical miles
            console.log(`Distance: ${res.distance.toFixed(1)} m`);
            console.log(`Initial bearing: ${res.initialBearing.toFixed(1)}°`);
            console.log(`Final bearing: ${res.finalBearing.toFixed(1)}°`);

    
            const id = crypto.randomUUID();
            bc = new BroadcastChannel('slar-meta');

            bc.onmessage = (e) => {
              //if (e.data?.from === id) return; // ignore self
              //console.log('Got:', e.data);
            };

            // send something
            //bc.postMessage({ from: id, text: 'hello from ' + location.pathname });

          if(canvasRef!)
          {         
            window.addEventListener("keydown", onKeyDown);
            window.addEventListener("keyup", onKeyUp);
            canvasRef.addEventListener("pointermove", onPointerMove);
            canvasRef.addEventListener("pointerdown", onPointerDown);
            canvasRef.addEventListener("pointerup", onPointerUp);
            canvasRef.addEventListener("mouseenter", onEnter);
            canvasRef.addEventListener("mouseleave", onLeave);
            
          }
      //  updateCanvasSize();
        const ro = new ResizeObserver(() => {updateCanvasSize();setupLensCanvas();DrawCanvas();});
        if (divRef) {
            ro.observe(divRef);}

        document.addEventListener("mssevent", HandleMssEvent as EventListener);  

       

    });
  
    createMemo(() => {
      let z = contentWidth();
      let w = backCanvas.width/2;
      const p = img2Cli(w, 0);
      setCliCenter(p.x);          
    });

    createMemo(() => {
      setIsTop(scrollY() == 0);
    });

    createMemo(() => {
      let offsX = 0;
      if(contentWidth() < divWidth())
         offsX = (divWidth()-contentWidth()) / 2;
      setOffsetX(offsX);
    });

    createEffect(() => {
     // if (canvasRef) {
        DrawCanvas();
        // canvasRef.style.transform = `translateY(-${scrollY()}px)`;
     // }
    });
    createEffect(() => {
     // if (canvasRef) {
        DrawOverlay();
        // canvasRef.style.transform = `translateY(-${scrollY()}px)`;
     // }
    });

   
  const lensStyle: Partial<CSSStyleDeclaration> = {
    position: "fixed",                 // follows the page cursor
    left: "0px",
    top: "0px",
    width: `${lensSize}px`,
    height: `${lensSize}px`,
    pointerEvents: "none",             // let mouse pass through
    opacity: "0%",                      // hidden until 'm' is held
    transition: "opacity 80ms linear",
    border: "2px solid rgba(255,255,255,.3)",
    boxShadow: "0 6px 20px rgba(10,10,z0,.35)",
    borderRadius: "9999px",
    overflow: "hidden",
    background: "#000",
    zIndex: "9999",
  };
  const lensCanvStyle: Partial<CSSStyleDeclaration> = {   
    pointerEvents: "none",             // let mouse pass through
 //   opacity: "50%",                      // hidden until 'm' is held
    transition: "opacity 80ms linear",
    borderRadius: "100px",    
  };


    return (
      <>
      <div class="wfSB" id="contSBArea" ref={divRef} onWheel={handleWheel}>        
        <canvas id="slarCanv" ref={canvasRef!}/>
        <canvas id="OLCanv" ref={OLCanvRef!}/>
       
        <div class="lens" ref={lensDiv} style={lensStyle}>
            <canvas ref={lensCanvas}  style={lensCanvStyle}/>
          </div>
         {/* Top overlay with an image icon; shown only on hover */}
      
      <div
        style={{
          position: "absolute",
          left: `${cliCenter()}px`,//"50%",
          top: "0px",
          transform: "translateX(-50%) scale(100%)",
          display: "flex",
         // "align-items": "center",
          gap: "8px",
          padding: "6px 10px",
          "border-radius": "8px",
          background: "rgba(0,0,0,0)",
          color: "white",
          "filter": "drop-shadow(20px 20px 2px rgba(0, 0, 0, 0.5))",
          //"box-shadow": "20px 20px 5px rgb(0, 0, 0, 1.5)",
          "pointer-events": "none",         // don’t block canvas events
          opacity: isTop() ? 1 : 0,         // show on hover
          transition: "opacity 420ms ease",
          "z-index": 10,
        }}
      >
        {/* Image icon (inline SVG). Swap for <img src="/path/icon.png" /> if you prefer */}
     
        <svg fill="#ffe400ff" stroke="#000000" stroke-width="0.2" stroke-opacity="0.85" width="80px" height="80px" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg"><path d="m24.794 16.522-.281-2.748-10.191-5.131s.091-1.742 0-4.31c-.109-1.68-.786-3.184-1.839-4.339l.005.006h-.182c-1.048 1.15-1.726 2.653-1.834 4.312l-.001.021c-.091 2.567 0 4.31 0 4.31l-10.19 5.131-.281 2.748 6.889-2.074 3.491-.582c-.02.361-.031.783-.031 1.208 0 2.051.266 4.041.764 5.935l-.036-.162-2.728 1.095v1.798l3.52-.8c.155.312.3.566.456.812l-.021-.035v.282c.032-.046.062-.096.093-.143.032.046.061.096.094.143v-.282c.135-.21.28-.464.412-.726l.023-.051 3.52.8v-1.798l-2.728-1.095c.463-1.733.728-3.723.728-5.774 0-.425-.011-.847-.034-1.266l.003.058 3.492.582 6.888 2.074z"/></svg>
      </div>
      
       
      </div>
      <ScrollbarV
        ref={scRef!}
        newTop={newTop()}
        wndHeight={divHeight()}
        contentHeight={contentHeight()}
        onScroll={(y) => setScrollY(y)}
      />
      <ScrollbarH
        ref={scHRef!}
        newLeft={newLeft()}
        wndWidth={divWidth()}
        contentWidth={contentWidth()}
        onScroll={(x) =>{ setScrollX(x);}}
      />
        
      <InfoView
          ref={infoV!}
          rgba={rgba()}
          p={imgPos()}
          meta={meta()}
          distBear={distBear()}
          //rgba = {rgba()}
        //  text = "hej2"
      />
      
      <SettingsOverlay
        onChange={({ enabled, enabledHM, value }) => {
        // apply settings to your app here
        // e.g., toggle a feature, adjust intensity from slider
        
          setEnhance(enabledHM ? 1 : enabled ? 2 : 0 );
          
          setLut(makeSigmoidContrastLUT(1, value, 0.5)); // amount=1, slope=8, midpoint=0.5
          setRGBLut(makeHeatmapRGBLUT({ gamma: value/10 }));
          //DrawCanvas();
          console.log(enabled,  value);
        }}
        initialEnabled={false}
        initialValue={10}
      />
      <NavOverlay json={navJson()} latLonFormat="dec" units={{ speed: "kn", altitude: "m" }} />
    
      </>
    );
  }

/*
  <div style={{
        position: 'absolute', left: '8px', top: '30px', padding: '6px 8px', 'border-radius': '8px',
        background: 'rgba(0,0,0,0.55)', color: '#e5e7eb', 'font-family': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        'font-size': '12px', 'pointer-events': 'none'
        }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
        <span style={{ display: 'inline-block', width: '14px', height: '14px', 'border-radius': '3px', background: hexProper(), border: '1px solid rgba(255,255,255,0.2)' }} />
        <span>{(() => { const {x,y}=imgPos(); const [r,g,b,a]=rgba(); return `(${Math.round(x)}, ${Math.round(y)}) ${hexProper()} rgba(${r},${g},${b},${a})`; })()}</span>
        </div>
      </div>
  
     <svg xmlns='http://www.w3.org/2000/svg' fill='#00FF10ff' fill-opacity='1' stroke='#007F10' stroke-opacity='0.85' stroke-linejoin='bevel' stroke-width='5' width='240' height='240'><path d='M 194.67321,2.8421709e-14 L 70.641958,53.625 C 60.259688,46.70393 36.441378,32.34961 31.736508,30.17602 C -7.7035221,11.95523 -5.2088921,44.90709 11.387258,54.78122 C 15.926428,57.48187 39.110778,71.95945 54.860708,81.15624 L 72.766958,215.09374 L 94.985708,228.24999 L 106.51696,107.31249 L 178.04821,143.99999 L 181.89196,183.21874 L 196.42321,191.84374 L 207.51696,149.43749 L 207.64196,149.49999 L 238.45446,117.96874 L 223.57946,109.96874 L 187.95446,126.87499 L 119.67321,84.43749 L 217.36071,12.25 L 194.67321,2.8421709e-14 z'/></svg>
      */

