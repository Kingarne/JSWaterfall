import { createSignal, onMount, onCleanup, createEffect, JSX, Accessor, Setter } from "solid-js";
import { createMemo } from "solid-js";

type RGBA = [number, number, number, number];
type Point = { x: number; y: number };

//type InfoWindowProps = {
 // rgba: Accessor<RGBA>;
  //setRgba: Setter<RGBA>;
//};

interface InfoProps{
    p:Point;
    rgba:RGBA;

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


    onMount(() =>
    {

      //  infoDiv.innerText= props.text;
    })

    return (
        <>
             <div ref={infoDiv!} class="info"style={{
        position: 'absolute', width:'200px', height:'100px', left: '8px', top: '20px', padding: '6px 8px', 'border-radius': '8px',
        background: 'rgba(0, 0, 0, 0.45)', color: '#ffe400', 'font-family': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        'font-size': '14px', 'pointer-events': 'none' 
        }}> 
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>  
        <span class="jek" style={{ display: 'inline-block', width: '14px', height: '14px', 'border-radius': '3px', background: hexProper(), border: '1px solid rgba(255,255,255,0.2)' }} />
        <span>{(() => { const {x,y}=props.p; const [r,g,b,a]=props.rgba; return `(${pt()}), (${Math.round(x)}, ${Math.round(y)}) `; })()}</span>
        </div>
        </div>
            
        
        </>
    )
}
//'rgba(255,255,255,0.2)'

    //<div class="info" id="infoCont" ref={infoDiv} style={{position:"absolute", width:"10vw", height:"10vh", "z-index":5, top:"15px", left:"20px", "background-color":"#fff"}}> </div>