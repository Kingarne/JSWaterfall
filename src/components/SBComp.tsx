import { createSignal, onMount, onCleanup, createEffect, JSX, Accessor } from "solid-js";
import { MSSEvent } from '../events';

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
    console.log("updateScroll:", top, scrollY);
    props.onScroll(scrollY);
  };

 createEffect(()=> {
    //thumbRef!.innerText = props.newTop.toString();
    thumbRef!.innerText = thumbTop().toString();
    console.log("Height: " + props.wndHeight);
    //setThumbTop(props.newTop);
 })

 createEffect(()=> {
    //thumbRef!.innerText = props.newTop.toString();
    //thumbRef!.innerText = thumbTop().toString();
    setThumbTop(props.newTop);
    //updateScroll(props.newTop);
    console.log("contentHeight: " + props.contentHeight);
 })

createEffect(()=> {
   
    console.log("newTop: " + props.newTop);
 })

  const handleWheel = (e: WheelEvent) => {
        console.log("wheel:", thumbRef.offsetTop, ", ", e.deltaY);
        const startTop = thumbRef.offsetTop;
        updateScroll(startTop + e.deltaY/10);
    };

  const handleMouseDown = (e: MouseEvent) => {
    setDragging(true);
    const startY = e.clientY;
    const startTop = thumbRef.offsetTop;

    console.log("MouseDown:", e.clientY, ", ", startTop);

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
    console.log("updateScrollX:", left, scrollX);
    props.onScroll(scrollX);
  };

 createEffect(()=> {
    //thumbRef!.innerText = props.newTop.toString();
    thumbRef!.innerText = thumbLeft().toString();
    console.log("width: " + props.wndWidth);
    //setThumbTop(props.newTop);
 })

 createEffect(()=> {
    //thumbRef!.innerText = props.newTop.toString();
    //thumbRef!.innerText = thumbTop().toString();
    setThumbLeft(props.newLeft);
    //updateScroll(props.newTop);
    console.log("contentHeight: " + props.contentWidth);
 })

createEffect(()=> {
   
    console.log("newTop: " + props.newLeft);
 })

  const handleWheel = (e: WheelEvent) => {
        console.log("wheelH:", thumbRef.offsetLeft, ", ", e.deltaY);
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



export default function SBComp() 
{
    let divRef: HTMLDivElement | undefined;        
    let scRef: HTMLDivElement;        
    let scHRef: HTMLDivElement;        
    let canvasRef: HTMLCanvasElement;
    let overlay!: HTMLDivElement;
    let ro: ResizeObserver | undefined;

    const [newTop, setNewTop] = createSignal(0);
    const [newLeft, setNewLeft] = createSignal(0);
    const [scrollY, setScrollY] = createSignal(0);
    const [scrollX, setScrollX] = createSignal(0);
    const [divHeight, setDivHeight] = createSignal(600);
    const [contentHeight, setContentHeight] = createSignal(800);
    const [divWidth, setDivWidth] = createSignal(600);
    const [contentWidth, setContentWidth] = createSignal(800);
    const [pos, setPos] = createSignal({ x: 0, y: 0 });
    const [hover, setHover] = createSignal(false);
    const [ovPos, setOvPos] = createSignal({ left: 8, top: 8 });
    const [rgba, setRgba] = createSignal<[number,number,number,number]>([0,0,0,255]);

  const updateOverlayPos = () => {
    if (!canvasRef) return;
    const r = canvasRef.getBoundingClientRect();
    setOvPos({ left: Math.round(r.left + 8), top: Math.round(r.top + 8) });
  };


    const imgBmp = new URL('../assets/SLAR.bmp', import.meta.url).href
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

  const pick = (clientX: number, clientY: number) => {
    if(!canvasRef)
      return;

    const rect = canvasRef.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setPos({ x, y });

    const xf =backCanvas.width / canvasRef.width;
    
    const xb = x*xf;
    //console.log(xf, xb);
    const ix = Math.min(canvasRef.width - 1, Math.max(0, Math.floor(x * dpr())));
    const iy = Math.min(canvasRef.height - 1, Math.max(0, Math.floor(y * dpr())));
    //const ctx = canvasRef.getContext("2d", { willReadFrequently: true });
    //const data = ctx!.getImageData(0, 0, 1, 1).data;

    const data = backCtx!.getImageData(ix, iy, 1, 1).data;
    
    setRgba([data[0], data[1], data[2], data[3]]);
   // DrawCanvas();
  };
  // --- Event listeners on the <canvas> ---
  const onMove = (e: MouseEvent) => {
    const p = toLocal(e);
    pick(e.clientX, e.clientY);
    //setPos(p);
    updateOverlayPos();
   // DrawCanvas();
  };
  const onEnter = (e: MouseEvent) => { setHover(true); pick(e.clientX, e.clientY); DrawCanvas(); };
  const onLeave = () => { setHover(false); DrawCanvas(); };
const dpr = () => 1 ;// Math.max(1, window.devicePixelRatio || 1);

    const DrawCanvas = () => {
        if(!canvasRef)
            return;

        const ctx = canvasRef.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
      //  ctx.fillStyle = "#f0f0f0";
      //  ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);

       // ctx.fillStyle = "#8080fb";
       // ctx.fillRect(0, scrollY(), canvasRef.width, viewHeight());

        if (img.complete && backCtx ) {
            // Sometimes, an image marked as complete may not have loaded correctly.
            if (img.naturalWidth !== 0) {
              //console.log("Image is already loaded.");
             // ctx.drawImage(backCanvas, 0, wfInsertPos+scrollY(), backCanvas.width, canvasRef.height, 0, 0, canvasRef.width, canvasRef.height);
             const zoom = 1.0; 
             ctx.drawImage(backCanvas, scrollX(), wfInsertPos+scrollY(), canvasRef.width/zoom, canvasRef.height/zoom, 0, 0, canvasRef.width, canvasRef.height);
             // console.log(backCanvas.width + "," + canvasRef.height + ", " + canvasRef.width + ", " + canvasRef.height);
            }
        }

         // Crosshair at mouse
    if (hover()) {
      const { x, y } = pos();
      const X = x;// * dpr(), 
      const Y = y;// * dpr();
      ctx.strokeStyle = "#ff2d3a99";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, Y); ctx.lineTo(canvasRef.width, Y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X, canvasRef.height); ctx.stroke();

      ctx.fillStyle = "#4f46e5"; // dot
      ctx.beginPath(); ctx.arc(X, Y, 5 /* dpr()*/, 0, Math.PI * 2); ctx.fill();

      // Position label
      ctx.fillStyle = "#e5e7eb";
      ctx.font = `${12 * dpr()}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      const label = `(${Math.round(x)}, ${Math.round(y)})`;
      ctx.fillText(label, X + 8 * dpr(), Y - 8 * dpr());
    }
      
      
    }

    const handleWheel = (e: WheelEvent) => {       
        //scRef!.innerText = "hej";
        console.log("canvas wheel bef: " + scrollY());
        let y = scrollY() + e.deltaY/2;
        console.log("canvas wheel: " + y);
        const maxY = contentHeight()-divHeight();
        const clampedY = Math.max(0, Math.min(y, maxY));

        setScrollY(clampedY);

        const fac = y / (contentHeight()-divHeight());
        const thumbHeight = Math.max((divHeight() / contentHeight()) * divHeight(), 30);
        const maxTop = divHeight() - thumbHeight;
        const top = fac * maxTop;
        const clampedTop = Math.max(0, Math.min(top, maxTop));
        
        console.log("new top: " + clampedTop);
        setNewTop(clampedTop);        
        //const scrollY = (clampedTop / maxTop) * (props.contentHeight - props.wndHeight);

       // 
        //const startTop = thumbRef.offsetTop;
      //  updateScroll(startTop + e.deltaY/10);
    };

    function addSlarLine(slar:any)
    {	
	if (!slar || !backCtx) {
		return;
	}
	
    if (!slar.data) {
		return;
	}
    if (!slar.data.pixels) {
		return;
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
    }

    function addLine() {
       
        if(backCtx == null)
            return;

        const imageData = backCtx.createImageData(backCanvas.width, 1);
        for (let x = 0; x < backCanvas.width; x++) {
            const value = x%255;//Math.floor((x / (backCanvas.width - 1)) * 255); // Ramp from 0 to 255
        
            // Set pixel at position x
            const index = x * 4;
            imageData.data[index] = value;      // Red
            imageData.data[index + 1] = value;  // Green
            imageData.data[index + 2] = value;  // Blue
            imageData.data[index + 3] = 255;    // Alpha (fully opaque)
          }
        if(wfInsertPos < 0)
            GrowCanvas(10);    
        // Put the image data back into the canvas
        backCtx.putImageData(imageData, 0, wfInsertPos);
        wfInsertPos--;
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
            addSlarLine(data.slar);
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


const hexProper = () => {
const [r,g,b] = rgba();
const toHex = (n:number) => n.toString(16).padStart(2,'0');
return '#' + toHex(r) + toHex(g) + toHex(b);
};
    let timerId:number=0;
    onMount(() => {
        img.onload = () => {
            backCanvas.width = img.width;
            backCanvas.height = img.height;
            backCtx!.drawImage(img, 0, 0);

            console.log("Image loaded via event.");
            setContentHeight(img.height);  
            setContentWidth(img.width);            
            DrawCanvas();
           
            /*if(timerId ==0 )
            {
                timerId = setInterval(() => {
                addLine();
                DrawCanvas()
              }, 1000);
            }*/

          };
     
          if(canvasRef)
          {         
            canvasRef.addEventListener("mousemove", onMove);
            canvasRef.addEventListener("mouseenter", onEnter);
            canvasRef.addEventListener("mouseleave", onLeave);
          }
        updateCanvasSize();
        //  DrawCanvas();
        const ro = new ResizeObserver(() => {updateCanvasSize();DrawCanvas();});
        if (divRef) {
            ro.observe(divRef);}

        document.addEventListener("mssevent", HandleMssEvent as EventListener);  
    });
  
    createEffect(() => {
      if (canvasRef) {
        DrawCanvas();
        // canvasRef.style.transform = `translateY(-${scrollY()}px)`;
      }
    });
  
    //<div style={{ display: "flex", width: "812px" }}></div>
    /*style={{
        //display: "block",
        width: "100%",//"800px",
        height: `${viewportHeight}px`,
      }}*/
    return (
      <>
      <div class="wfSB" id="contSBArea" ref={divRef} onWheel={handleWheel}>
        <canvas class="testCanv"
          ref={canvasRef!}
          
         // width={210}
         // height={500}
         
        />
   
  
  <div
  
        ref={el => (overlay = el)}
        style={{
          position: "fixed",
          left: `${ovPos().left}px`,
          top: `${ovPos().top}px`,"font-family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          "font-size": "12px",
          color: "#e5e7eb",
          background: "rgba(17,19,24,.5)",
          padding: "4px 6px",
          "border-radius": "4px",
          "pointer-events": "none",
          "user-select": "none",
          opacity: hover() ? 1 : 0.2
        }}
      >
        {Math.round(pos().x)}, {Math.round(pos().y)}
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
        onScroll={(x) => setScrollX(x)}
        />
        
 <div style={{
position: 'absolute', left: '8px', top: '30px', padding: '6px 8px', 'border-radius': '8px',
background: 'rgba(0,0,0,0.55)', color: '#e5e7eb', 'font-family': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
'font-size': '12px', 'pointer-events': 'none'
}}>
<div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
<span style={{ display: 'inline-block', width: '14px', height: '14px', 'border-radius': '3px', background: hexProper(), border: '1px solid rgba(255,255,255,0.2)' }} />
<span>{(() => { const {x,y}=pos(); const [r,g,b,a]=rgba(); return `(${Math.round(x)}, ${Math.round(y)}) ${hexProper()} rgba(${r},${g},${b},${a})`; })()}</span>
</div></div>
      </>
    );
  }

  