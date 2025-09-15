import { createSignal, onMount, onCleanup, createEffect, JSX, Accessor, Setter } from "solid-js";
import { createMemo } from "solid-js";
import { LineDataHead } from "./DatParser";

type RGBA = [number, number, number, number];
type Point = { x: number; y: number };

//type InfoWindowProps = {
 // rgba: Accessor<RGBA>;
  //setRgba: Setter<RGBA>;
//};

interface InfoProps{
    p:Point;
    rgba:RGBA;
    meta:LineDataHead;

    //   rgba: Accessor<RGBA>;
  //  text: string;
};

export default function InfoView(props:InfoProps) 
{
    let infoDiv:HTMLDivElement ;

    const css = createMemo(() => {
        let x = 0;//props.xpos;
        //const [r, g, b, a] = props.rgba();
        return `rgba(${x}, ${x}, ${x}, ${255 / 255})`;
    });
    
    const css2 = createMemo(() => {
        let x = 0;//props.xpos;
        //const [r, g, b, a] = props.rgba();
        //return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    });

    const pt = createMemo(() => {        
        const p = props.rgba;
        return `${p[0]}`;
    });


    //createEffect( () => {infoDiv.innerText = props.xpos.toFixed(2)})

    const hexProper = () => {
  const val = props.rgba;
  const toHex = (n:number) => n.toString(16).padStart(2,'0');
  return '#' + toHex(val[0]) + toHex(val[0]) + toHex(val[0]);
  //return '#' + 'ffffff';
};

   /* const hexProper = () => {
    const [r,g,b] = () -> //rgba();
    const toHex = (n:number) => n.toString(16).padStart(2,'0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
    };*/

const arrowStyle: JSX.CSSProperties = {
    width: `36px`,
    height: `36px`,
    "transform-origin": "50% 50%",
    //transform: `rotate(${props.meta.fHeading} deg)`,
    transform: `rotate(${props.meta.fHeading}deg)`,
    "pointer-events": "none",
  };
    onMount(() =>
    {

      //  infoDiv.innerText= props.text;
    })

    return (
        <>
             <div ref={infoDiv!} class="info"style={{
        position: 'absolute', width:'220px',  display: "flow-root", height:'170px', left: '8px', top: '20px', padding: '6px 8px', 'border-radius': '8px',
        background: 'rgba(0, 0, 0, 0.55)', color: '#ffe400', 'font-family': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        'font-size': '14px', 'pointer-events': 'none' 
        }}> 
        <div style={{ display: 'flex', 'align-items': 'left', "flex-direction": "column", gap: '6px' }}>  
        <span class="jek" style={{ display: 'inline-block', width: '20px', height: '16px', 'border-radius': '3px', background: hexProper(), border: '1px solid rgba(255,255,255,0.2)' }} />
        <span>{(() => { const {x,y}=props.p; const [r,g,b,a]=props.rgba; return `${pt()}, [${Math.round(x)}, ${Math.round(y)}] `; })()}</span>        
        <span><span class="head">Lat: </span><span>{(() => { const v= props.meta.fLa.toFixed(5); return `${v}`; })()}</span><span class="head"> Lon: </span><span>{(() => { const v= props.meta.fLo.toFixed(5); return `${v}`; })()}</span></span>
        <span><span class="head">Alt: </span><span>{(() => { const h= props.meta.fAlt.toFixed(1); return `${h}`; })()}</span></span>        
        <span><span class="head">Speed: </span><span>{(() => { const h= props.meta.fSpeed.toFixed(1); return `${h}`; })()}</span></span>
        <span><span class="head">Heading: </span><span>{(() => { const h= props.meta.fHeading.toFixed(1); return `${h}`; })()}</span></span>
          <svg viewBox="0 0 24 24" role="img" aria-label={`${props.meta.fHeading} degrees`} style={{width: `30px`, "transform": `rotate(${props.meta.fHeading}deg)`}}>
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.5" />
        {/* stem pointing up by default */}
        <path d="M12 12 L12 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        {/* arrowhead */}
        <polygon points="12,2 9,6 15,6" fill="currentColor" />
      </svg>        
        </div>
        </div>
            
        
        </>
    )
}
//'rgba(255,255,255,0.2)'

    //<div class="info" id="infoCont" ref={infoDiv} style={{position:"absolute", width:"10vw", height:"10vh", "z-index":5, top:"15px", left:"20px", "background-color":"#fff"}}> </div>