import { createSignal, onMount, onCleanup, createEffect, JSX, Accessor, createMemo } from "solid-js";

interface ScrollbarProps {
  newTop:number;
  wndHeight: number;
  contentHeight: number;
  onScroll: (scrollY: number) => void;
}

export default function Scrollbar(props: ScrollbarProps) {
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

