import { createSignal, onMount, onCleanup, createEffect, JSX, Accessor } from "solid-js";
import { MSSEvent } from '../events';
import InfoView from "./InfoView";

interface ScrollbarProps {
  newTop:number;
  wndHeight: number;
  contentHeight: number;
  onScroll: (scrollY: number) => void;
}

export function Scrollbar(props: ScrollbarProps) {
  const [dragging, setDragging] = createSignal(false);
  const [thumbTop, setThumbTop] = createSignal(0);
  let trackRef: HTMLDivElement;
  let thumbRef: HTMLDivElement;

  //const thumbHeightPerc = () => Math.max((props.height / props.contentHeight), 10);
  const thumbHeight = () => Math.max((props.wndHeight / props.contentHeight) * props.wndHeight, 30);

  const updateScroll = (top: number) => {
    const maxTop = props.wndHeight - thumbHeight();
    const clampedTop = Math.max(0, Math.min(top, maxTop));
    setThumbTop(clampedTop);
    const scrollY = (clampedTop / maxTop) * (props.contentHeight - props.wndHeight);
    console.log("updateScrollY:", top, scrollY);
    props.onScroll(scrollY);
  };

 createEffect(()=> {
    //thumbRef!.innerText = props.newTop.toString();
    thumbRef!.innerText = thumbTop().toString();
    //console.log("Height: " + props.wndHeight);
    //setThumbTop(props.newTop);
 })

 createEffect(()=> {
    //thumbRef!.innerText = props.newTop.toString();
    //thumbRef!.innerText = thumbTop().toString();
    setThumbTop(props.newTop);
    //updateScroll(props.newTop);
    //console.log("contentHeight: " + props.contentHeight);
 })

createEffect(()=> {
   
    //console.log("newTop: " + props.newTop);
 })

  const handleWheel = (e: WheelEvent) => {
       // console.log("wheel:", thumbRef.offsetTop, ", ", e.deltaY);
        const startTop = thumbRef.offsetTop;
        updateScroll(startTop + e.deltaY/10);
    };

  const handleMouseDown = (e: MouseEvent) => {
    setDragging(true);
    const startY = e.clientY;
    const startTop = thumbRef.offsetTop;

   // console.log("MouseDown:", e.clientY, ", ", startTop);

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging()) return;
      const delta = e.clientY - startY;
     // console.log("updateScroll:", startTop, ", ", delta, ", ", startTop + delta);
      updateScroll(startTop + delta);
    };

    const onMouseUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <>
    
    <div
      ref={trackRef!}
      style={{
        width: "18px",
        height: "100%", //`${props.height}px`,
        background: "#f0f0f04f",
        position: "absolute",
        //float: "left",
        right: "0px"
      }}
      onWheel={handleWheel as any}
    >
      <div class="thumb"
        ref={thumbRef!}
        style={{
          left: "1px",
          width: "85%",
          height: `${thumbHeight()}px`,
          background: "#88f",
          'border-radius': "6px",
          border: "1px solid rgb(82, 87, 110)",            
          position: "absolute",
          top: `${thumbTop()}px`,
          cursor: "pointer",
          'text-align': "center"
        }}
        onMouseDown={handleMouseDown as any}
        onWheel={handleWheel as any}
      />
    </div></>
  );
}


interface ScrollbarHProps {
  newLeft:number;
  wndWidth: number;
  contentWidth: number;
  onScroll: (scrollX: number) => void;
}

export function ScrollbarH(props: ScrollbarHProps) {
  const [dragging, setDragging] = createSignal(false);
  const [thumbLeft, setThumbLeft] = createSignal(0);
  let trackRef: HTMLDivElement;
  let thumbRef: HTMLDivElement;

  //const thumbHeightPerc = () => Math.max((props.height / props.contentHeight), 10);
  const thumbWidth = () => Math.max((props.wndWidth / props.contentWidth) * props.wndWidth, 30);

  const updateScroll = (left: number) => {
    const maxLeft = props.wndWidth - thumbWidth();
    const clampedLeft = Math.max(0, Math.min(left, maxLeft));
    setThumbLeft(clampedLeft);
    const scrollX = (clampedLeft / maxLeft) * (props.contentWidth - props.wndWidth);
   // console.log("updateScrollX:", left, scrollX);
    props.onScroll(scrollX);
  };

 createEffect(()=> {
    //thumbRef!.innerText = props.newTop.toString();
    thumbRef!.innerText = thumbLeft().toString();
  //  console.log("width: " + props.wndWidth);
    //setThumbTop(props.newTop);
 })

 createEffect(()=> {
    //thumbRef!.innerText = props.newTop.toString();
    //thumbRef!.innerText = thumbTop().toString();
    setThumbLeft(props.newLeft);
    //updateScroll(props.newTop);
   // console.log("contentHeight: " + props.contentWidth);
 })

createEffect(()=> {
   
    //console.log("newTop: " + props.newLeft);
 })

  const handleWheel = (e: WheelEvent) => {
      //  console.log("wheelH:", thumbRef.offsetLeft, ", ", e.deltaY);
        const startLeft = thumbRef.offsetLeft;
        updateScroll(startLeft - e.deltaY/10);
    };

  const handleMouseDown = (e: MouseEvent) => {
    setDragging(true);
    const startX = e.clientX;
    const startLeft = thumbRef.offsetLeft;

    console.log("MouseDownH:", e.clientX, ", ", startLeft);

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging()) return;
      const delta = e.clientX - startX;
     // console.log("updateScroll:", startTop, ", ", delta, ", ", startTop + delta);
      updateScroll(startLeft + delta);
    };

    const onMouseUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };


return (
  <>
    <div
      ref={trackRef!}
      style={{
        width: "100%",
        height: "18px",
        background: "#f0f0f04f",
        position: "absolute",
        "margin-top": "8px",   // push it below the parent content
        clear: "both",          // ensure it clears any floated content above
        bottom: "0px"
      }}
      onWheel={handleWheel as any}
    >
      <div
        class="thumb"
        ref={thumbRef!}
        style={{
          top: "1px",
          height: "85%",
          width: `${thumbWidth()}px`,
          background: "#88f",
          "border-radius": "6px",
          border: "1px solid rgb(82, 87, 110)",
          position: "absolute",
          left: `${thumbLeft()}px`,
          cursor: "pointer",
          "text-align": "center"
        }}
        onMouseDown={handleMouseDown as any}
        onWheel={handleWheel as any}
      />
    </div>
  </>
);
}

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

export default function SBComp() 
{
    let divRef: HTMLDivElement | undefined;        
    let scRef: HTMLDivElement;        
    let scHRef: HTMLDivElement;        
    let infoV: HTMLDivElement;        
    let canvasRef: HTMLCanvasElement;
    let overlay!: HTMLDivElement;
    let ro: ResizeObserver | undefined;

    const props:ZoomLensProps = {src:"", width:50, height:50, zoom:3.0, lensSize:250, round:true};
    const lensSize = props.lensSize ?? 250;
    const makeRound = props.round ?? true;

    let lensCanvas!: HTMLCanvasElement; // canvas inside the lens
    let lensDiv!: HTMLDivElement;       // floating lens container
    let lensCtx!: CanvasRenderingContext2D;

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
    const [zHeld, setZHeld] = createSignal(false);

    const css = () => {
    const [r, g, b, a] = rgba();
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  };

  const updateOverlayPos = () => {
    if (!canvasRef) return;
    const r = canvasRef.getBoundingClientRect();
    setOvPos({ left: Math.round(r.left + 8), top: Math.round(r.top + 8) });
  };


    const imgBmp = new URL('../assets/SLAR-mark.bmp', import.meta.url).href
    //const imgBmp = new URL('../assets/SLAR-large.bmp', import.meta.url).href
    const img = new Image();
    // Optionally handle cross-origin images (if needed).
    // img.crossOrigin = "anonymous";
    img.src = imgBmp;
    
    let backCanvas = document.createElement('canvas');
    let backCtx = backCanvas.getContext('2d', { willReadFrequently: true } );     
    let wfInsertPos:number=-1;

    //const canvasHeight = 1200;
    //let viewportHeight = 600;

    const updateCanvasSize = () => {
        if (divRef && canvasRef) {
          // Get the parent element's current size.
          const { clientWidth, clientHeight } = divRef;
          // Update the canvas's drawing buffer size.
          canvasRef.width = clientWidth;
          canvasRef.height = clientHeight;
          setDivHeight(clientHeight);
          setDivWidth(clientWidth);
          
          //console.log("hej:", canvasRef.width, canvasRef.height);
        }
    }

    const toLocal = (e: MouseEvent) => {
    const r = canvasRef.getBoundingClientRect();
    return { x: (e.clientX - r.left), y: (e.clientY - r.top) };
  };



  const img2Cli = (imgX: number, imgY: number) => {
  if (!canvasRef)
    return { x: 0, y: 0 };

  // image → device pixels inside the canvas
  // (apply zoom, then remove scroll)
  let dx = imgX * zoom() - scrollX();
  let dy = imgY * zoom() - scrollY();

  // clamp to the canvas backing-store (device px)
  dx = Math.min(canvasRef.width - 1, Math.max(0, Math.floor(dx)));
  dy = Math.min(canvasRef.height - 1, Math.max(0, Math.floor(dy)));

  // device px → client (CSS) px
  const cliX = dx / dpr();
  const cliY = dy / dpr();

  return { x: cliX, y: cliY };
};
  
  const cli2Img = (cliX: number, cliY: number) => {
    if(!canvasRef)
      return { x: (0), y: (0) };

    let ix = scrollX() + Math.min(canvasRef.width - 1, Math.max(0, Math.floor(cliX * dpr())));
    let iy = scrollY() + Math.min(canvasRef.height - 1, Math.max(0, Math.floor(cliY * dpr())));

    ix = ix/zoom();
    iy = iy/zoom();
    
  //console.log("p:" + ix + "," + iy);

    return { x: (ix), y: (iy) };
  
  }


  const pick = (clientX: number, clientY: number) => {
    if(!canvasRef)
      return;

    const p = cli2Img(clientX, clientY);
    setCliPos({x:clientX, y:clientY});
   
    const data = backCtx!.getImageData(p.x, p.y, 1, 1).data;
    setImgPos({x:p.x, y:p.y});
    setRgba([data[0], data[1], data[2], data[3]]);

  };

function drawLensAt(clientX: number, clientY: number) {
    if (!zHeld()) return;

    // Position lens near the cursor
    const pad = 5; // offset from cursor
    let left = clientX + pad;
    let top = clientY + pad;

    // Keep lens within viewport if it would spill off-screen
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (left + lensSize > vw) left = clientX - lensSize - pad;
    if (top + lensSize > vh) top = clientY - lensSize - pad;

    console.log("cli: " + clientX + ", " + clientY);
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

    lensCtx.drawImage(backCanvas, sx, sy, srcW, srcH, 0, 0, lensSize, lensSize);
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
  const onMove = (e: MouseEvent) => {
    const p = toLocal(e);
    pick(e.clientX, e.clientY);
    
    if (hover() && zHeld()) {
        lensDiv.style.opacity = "1";
        drawLensAt(e.clientX, e.clientY);
      }
    //setPos(p);
   // updateOverlayPos();
   // DrawCanvas();
  };
  const onMouseDown = (e: MouseEvent) => {
     //CenterAtImgVert( imgPos().y);
     CenterAtImg(imgPos().x, imgPos().y);     

    console.log("down:", imgPos().y)
  };
  
  const onEnter = (e: MouseEvent) => { 
    console.log("onEnter");
    setHover(true); 
    if (zHeld()) lensDiv.style.opacity = "1";  
    pick(e.clientX, e.clientY); 
    DrawCanvas(); 
  };

   // Hold 'm' to show lens
    const onKeyDown = (e: KeyboardEvent) => {
      
      if (e.key.toLowerCase() === "z") {
        if (!zHeld()) {
          setZHeld(true);        
          if (hover()) {
            console.log("onKeyDown");
            lensDiv.style.opacity = "1";
            const m = cliPos();
            drawLensAt(m.x, m.y);
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "z") {
        console.log("onKeyUp");
        setZHeld(false);
        lensDiv.style.opacity = "0";
      }
    };

  const onLeave = () => { setHover(false); DrawCanvas(); };
const dpr = () => 1 ;// Math.max(1, window.devicePixelRatio || 1);

    const DrawCanvas = () => {
        if(!canvasRef)
            return;

        //console.log("DrawCanvas");
        const ctx = canvasRef.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.fillStyle = "#93b0f1";
        ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);

       // ctx.fillStyle = "#8080fb";
       // ctx.fillRect(0, scrollY(), canvasRef.width, viewHeight());
        let scrX = scrollX();
        let scrY = scrollY();
        if (img.complete && backCtx ) {
            // Sometimes, an image marked as complete may not have loaded correctly.
            if (img.naturalWidth !== 0) {
              //console.log("Image is already loaded.");
             // ctx.drawImage(backCanvas, 0, wfInsertPos+scrollY(), backCanvas.width, canvasRef.height, 0, 0, canvasRef.width, canvasRef.height);
          //   const zoom = 1.0; 
             ctx.drawImage(backCanvas, scrX/zoom(), wfInsertPos+scrY/zoom(), canvasRef.width/zoom(), canvasRef.height/zoom(), 0, 0, canvasRef.width, canvasRef.height);
            //  console.log("draw canvas");
            }
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
        console.log("newz: " + newz + ", " + backCanvas.height*zoom());

        return;
      }

      if (!e.shiftKey) {  
        let y = scrollY() + e.deltaY/2;                      
        console.log("canvas wheel: " + y);
        const maxY = contentHeight()-divHeight();
        const clampedY = Math.max(0, Math.min(y, maxY));
        CenterAtVert(clampedY);
      }
      else
      {
       
        let x = scrollX() + e.deltaY/2;
      //  console.log("canvas wheel: " + x);
        const maxX = contentWidth()-divWidth();
        const clampedX = Math.max(0, Math.min(x, maxX));
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

function addSlarLine(slar:any) : number
{	
	if (!slar || !backCtx) {
		return -1;
	}
	
    if (!slar.data) {
		return -1;
	}
    if (!slar.data.pixels) {
		return -1;
	}
    console.log("length: ", slar.data.pixels);
	
    if(wfInsertPos < 0)
        GrowCanvas(60*5); 

	var line = atob(slar.data.line);	
    var img = backCtx.createImageData(line.length, 1);
	var data = img.data;
	for (let i = 0; i < line.length; i++) {
		var value = line.charCodeAt(i);
		data[4 * i] = value;
		data[4 * i + 1] = value;
		data[4 * i + 2] = value;
		data[4 * i + 3] = 255;
	}
	for (let i = 1332; i < 1335; i++) {
			data[4 * i] = 127;
			data[4 * i + 1] = 255;
			data[4 * i + 2] = 127;
			data[4 * i + 3] = 224;		
	}
	backCtx.putImageData(img, 0, wfInsertPos);
    wfInsertPos--;
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
        wfInsertPos = grow-1;
        backCanvas = newCanvas;
        backCtx = backCanvas.getContext('2d',  { willReadFrequently: true });    
    }    

    const HandleMssEvent: JSX.EventHandler<Document, MSSEvent> = (event) =>{
        switch(event.detail.type)
        {              
          case "SDPStatusMessage":{
            const data = event.detail.data;
            //console.log("SDPStatusMessage");
            
            if(addSlarLine(data.slar) >= 0)
              DrawCanvas();
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
  console.log("centerY: " + cy + "cH: " + contentHeight());
  const maxY = contentHeight()-divHeight();

  
  const newC = cy*zoom()-(divHeight()/2);
  const clampedY = Math.max(0, Math.min(newC, maxY));
  console.log("newC: " + clampedY);
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
  console.log("centerY: " + cx + "cH: " + contentHeight());
  const maxX = contentWidth()-divWidth();
  
  const newC = cx*zoom()-(divWidth()/2);
  const clampedX = Math.max(0, Math.min(newC, maxX));
  console.log("newC: " + clampedX);
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
  console.log("centerY: " + center + "cH: " + contentHeight());
  setScrollY(center);

  const fac = center / (contentHeight()-divHeight());
  const thumbHeight = Math.max((divHeight() / contentHeight()) * divHeight(), 30);
  const maxTop = divHeight() - thumbHeight;
  const top = fac * maxTop;
  const clampedTop = Math.max(0, Math.min(top, maxTop));

  //console.log("New top: " + clampedTop + ", " + maxTop);
  setNewTop(clampedTop);    
}

function setupLensCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
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

const hexProper = () => {
  const [r,g,b] = rgba();
  const toHex = (n:number) => n.toString(16).padStart(2,'0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
};
    //let timerId:number=0;
    onMount(() => {
        img.onload = () => {
            lensCtx = lensCanvas.getContext("2d")!;
            backCanvas.width = img.width;
            backCanvas.height = img.height;
            backCtx!.drawImage(img, 0, 0);

            console.log("Image loaded via event.");
            setContentHeight(img.height);  
            setContentWidth(img.width);      

            CenterAtVert(0);
            CenterAtHor(img.width/2-divWidth()/2);
                     
            setupLensCanvas();           
            DrawCanvas();
                     
          };
     
          if(canvasRef!)
          {         
            window.addEventListener("keydown", onKeyDown);
            window.addEventListener("keyup", onKeyUp);
            canvasRef.addEventListener("mousemove", onMove);
            canvasRef.addEventListener("mousedown", onMouseDown);
            canvasRef.addEventListener("mouseenter", onEnter);
            canvasRef.addEventListener("mouseleave", onLeave);
            
          }
        updateCanvasSize();
        //  DrawCanvas();
        const ro = new ResizeObserver(() => {updateCanvasSize();setupLensCanvas();DrawCanvas();});
        if (divRef) {
            ro.observe(divRef);}

        document.addEventListener("mssevent", HandleMssEvent as EventListener);  
    });
  
    createEffect(() => {
     // if (canvasRef) {
        DrawCanvas();
        // canvasRef.style.transform = `translateY(-${scrollY()}px)`;
     // }
    });
  
  const lensStyle: Partial<CSSStyleDeclaration> = {
    position: "fixed",                 // follows the page cursor
    left: "10px",
    top: "10px",
    width: `${lensSize}px`,
    height: `${lensSize}px`,
    pointerEvents: "none",             // let mouse pass through
    opacity: "50%",                      // hidden until 'm' is held
    transition: "opacity 80ms linear",
    border: "1px solid rgba(255,255,255,.3)",
    boxShadow: "0 6px 20px rgba(0,0,0,.35)",
    borderRadius: "100px",
    overflow: "hidden",
    background: "#000",
    zIndex: "9999",
  };

    return (
      <>
      <div class="wfSB" id="contSBArea" ref={divRef} onWheel={handleWheel}>
        <canvas class="testCanv" ref={canvasRef!}/>
        <div ref={lensDiv} style={lensStyle}>
            <canvas ref={lensCanvas} />
          </div>
  
      
       
      </div>
      <Scrollbar
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
          //rgba = {rgba()}
        //  text = "hej2"
        />
       
    
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
  */