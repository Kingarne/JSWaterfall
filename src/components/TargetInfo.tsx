import { createSignal, onMount, onCleanup, createEffect, JSX, Accessor, createMemo } from "solid-js";
import type { Target } from "./SBComp";

interface Props  {
    idx:number,
    target?:Target,
    ref?: (el: HTMLDivElement) => void;
}

export default function TargetInfo(props:Props )
{



    const targetInfoStyle: Partial<CSSStyleDeclaration> = {
    position: "fixed",                 // follows the page cursor
    left: "0px",
    top: "0px",
    width: `150px`,
    height: `150px`,
    "pointer-events": "none",             // let mouse pass through
    opacity: "0%",                      // hidden until 'm' is held
    transition: "opacity 80ms linear",
    border: "2px solid rgba(255,255,255,.3)",
    boxShadow: "0 6px 20px rgba(10,10,z0,.35)",
    //"borderRadius": "5px",//"9999px",
    "border-radius": "10px",
    overflow: "hidden",
    background: "#000",
    zIndex: "9999",
  };
function Row(props: { label: string; value: string }) {
  return (
    <tr>
      <th
        style={{
          color: "#22c55e",           // green
          "text-align": "left",
          "font-weight": 600,
          padding: "2px 8px 2px 5px",
          "white-space": "nowrap",
          "vertical-align": "top",
          width: "1%",
        }}
      >
        {props.label}
      </th>
      <td
        style={{
          color: "#facc15",           // yellow
          "text-align": "left",
          padding: "2px 0",
        }}
      >
        {props.value}
      </td>
    </tr>
  );
}

    return (
        <div ref={props.ref} id="targetinfo" style={targetInfoStyle}>
           <Show when={props.target}>  
            <h1>Target</h1>    
           <table>
          <tbody>
            <Row label="x" value={String(props.target!.img.x)} />
            <Row label="y" value={String(props.target!.img.y)} />           
            <Row label="Lat" value={String(props.target!.geo.lat.toFixed(5))} />
            <Row label="Lon" value={String(props.target!.geo.lon.toFixed(5))} />
            <tr><th>selected</th><td>{String(props.target!.meta.selected)}</td></tr>
          </tbody>
        </table>
           </Show>
        </div>
    );
}