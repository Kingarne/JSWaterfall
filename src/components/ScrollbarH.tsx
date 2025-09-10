import { createSignal, onMount, onCleanup, createEffect, JSX, Accessor, createMemo } from "solid-js";

interface ScrollbarHProps {
  newLeft:number;
  wndWidth: number;
  contentWidth: number;
  onScroll: (scrollX: number) => void;
}

export default function ScrollbarH(props: ScrollbarHProps) {
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