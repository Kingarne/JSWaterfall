import { batch, createEffect, createMemo, createSignal, onCleanup, onMount, untrack, Accessor} from 'solid-js';
import { JSX } from 'solid-js';
 
import ScrollbarArea from './ScrollbarArea';

export default function ScrollContCmp()
{
    let wfDiv: HTMLDivElement | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let scrollbarRef!: HTMLInputElement;
    
    const imgTif = new URL('./assets/test2.tif', import.meta.url).href
    const imgBmp = new URL('../assets/SLAR.bmp', import.meta.url).href
    const imgTest = new URL('../assets/test3.png', import.meta.url).href
    const img = new Image();
    // Optionally handle cross-origin images (if needed).
    // img.crossOrigin = "anonymous";
    img.src = imgBmp;
    let y=0;

    
    const[accScrollbarText, setScrollbarText] = createSignal<string>("---");
    const[scrollbarIndex, setScrollbarIndex] = createSignal<number>(0);
  
    const[selectedIndex, setSelectedIndex] = createSignal<number|undefined>();
        
    const scrollbarLength: Accessor<number> = createMemo(()=>{
      return 100;
    });

    const drawImage = () => {
        if(!canvas)
            return;
        
        const ctx = canvas.getContext("2d");
          if (ctx) {

       // ctx.clearRect(0, 0, canvas.width, canvas.height);
        let fac:number = img.width/img.height;
        ctx.drawImage(img, 0,0, img.width,img.height, 0, 0, canvas.width, canvas.height/fac);
        console.log("Image drawn to canvas.");
          }
      };

    const updateCanvasSize = () => {
        if (wfDiv && canvas) {
          // Get the parent element's current size.
          const { clientWidth, clientHeight } = wfDiv;
          // Update the canvas's drawing buffer size.
          canvas.width = clientWidth;
          canvas.height = clientHeight;
  
          // Optionally, you can redraw or clear the canvas here.
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ddd";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "#f00";
            ctx.lineWidth = 2;
            const offset = ctx.lineWidth / 2;
            ctx.strokeRect(offset, offset, canvas.width - ctx.lineWidth, canvas.height - ctx.lineWidth);

            ctx.strokeStyle = "#f00"; // Red color.
            ctx.lineWidth = 1;
    
            // Begin drawing the line.
            ctx.beginPath();
            // Start at the top-left corner.
            ctx.moveTo(0, canvas.height/2);
            // Draw a line to the bottom-right corner.
            ctx.lineTo(canvas.width, canvas.height/2);
            ctx.moveTo(canvas.width/2, 0);
            // Draw a line to the bottom-right corner.
            ctx.lineTo(canvas.width/2, canvas.height);
    
    
            // Draw (stroke) the line on the canvas.
            ctx.stroke();
            if (img.complete) {
                // Sometimes, an image marked as complete may not have loaded correctly.
                if (img.naturalWidth !== 0) {
                  console.log("Image is already loaded.");
                  drawImage();
                }
            }
          }
          console.log("Updated canvas size:", clientWidth, clientHeight);
        }
      };

    onMount(() => {
        console.log("ScrollContCmp");

        

        img.onload = () => {
            console.log("Image loaded via event.");
            drawImage();
           
          };
      
          img.onerror = (error) => {
            console.error("Error loading image:", error);
          };

        if (canvas) {
            // Now you have access to the canvas element.
             // Initial size update.
            updateCanvasSize();
            const ctx = canvas.getContext("2d");
            if(ctx==null)
                return;

            console.log("Canvas 2D context:", canvas.width, canvas.height)
            const rect = canvas.getBoundingClientRect();
            console.log("Canvas width (rendered):", rect.width);
            console.log("Canvas height (rendered):", rect.height);
          

            // You can now perform canvas drawing operations here.
          } else {
            console.error("Canvas element not available");
          }
           // Create a ResizeObserver to detect changes in the parent's size.
        const ro = new ResizeObserver(() => {
        updateCanvasSize();
      });
      if (wfDiv) {
        ro.observe(wfDiv);
      }
  
      // Clean up the observer on component unmount.
      onCleanup(() => {
        ro.disconnect();
      });

      scrollbarRef.addEventListener("change", ()=>{
        setSelectedIndex(parseInt(scrollbarRef.value));
      });
    })

    return (
        <>
        <div ref={wfDiv} class="wf">
        <canvas ref={canvas} class="canv"/>
        <ScrollbarArea></ScrollbarArea>
        
        </div> 
       
       
      
        </>
        );
}

