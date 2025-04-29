import { createMemo, createEffect, Accessor, Component, untrack } from "solid-js"
import type {JSX, Setter} from "solid-js"

interface ScrollbarProps {
    length: Accessor<number>;
    index: Accessor<number>;
    setIndex: Setter<number>;
    
    infoText?: Accessor<string>;
    
    scrollbarElem: (el:HTMLInputElement)=>void;
    delay:number;
    inverted: boolean|undefined;
  }


export default function Scrollbar(props: ScrollbarProps): JSX.Element
{
    let infoRef!: HTMLDivElement;
    let timeout: number|undefined;
    let scrollRef: HTMLInputElement;

    const infoY = createMemo<number>(() => {
        //TODO FIXIT Calculate the info-label position better, needs to also take the range "thumb" into account
            //https://stackoverflow.com/questions/48880523/how-to-precisely-find-thumb-position-of-input-type-range

        const max = props.length()-1;
        const ratio = props.index() / max;
        return ratio;
    });

    if(props.infoText)
    {
        createEffect(()=>{
            infoRef.innerText=props.infoText!();
        });
    }

    createEffect(()=>{
        const index = props.index();
        if(index >= 0 && index < untrack(props.length))
            scrollRef.value=`${index}`;
    });
    
    const onInputEvent: JSX.ChangeEventHandler<HTMLInputElement, Event> = () => {
        const index = parseInt(scrollRef.value);
        if(isNaN(index))
            return;
        props.setIndex(index);
    }

    const onMouseWheel: JSX.EventHandler<HTMLInputElement, WheelEvent> = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const index = parseInt(scrollRef.value);
        const size = parseInt(scrollRef.max)
        if(size < 2 || isNaN(index) || isNaN(size))
            return;
        const nModify = Math.round(-1*(event.deltaY/100));
        let newInd = index + nModify;
        if(newInd < 0)
            newInd = 0;
        else if(newInd >= size)
            newInd = size;        
        scrollRef.value = `${newInd}`
        scrollRef.dispatchEvent(new InputEvent("input"));
        clearTimeout(timeout);
        timeout = setTimeout(()=>{scrollRef.dispatchEvent(new InputEvent("change"));}, props.delay);
    }

    const scrollbar: Component<ScrollbarProps> = (props) => {
        let inverted = (typeof props.inverted === "undefined")? false : props.inverted;
        return(
            <div class="scrollContainer"
            style={{"pointer-events": "none",}}>
                <div 
                    class="info"
                    ref={infoRef}
                    style={{
                        top: inverted ? `calc(2% + (96%*${infoY()}) -12.5px)` : `calc(98% - (96%*${infoY()}) - 12.5px)`,
                        width: "75%",
                        height: "25px"}}/>
                <input 
                    ref={(el) => { props.scrollbarElem(el); scrollRef = el; }}
                    type={"range"}
                    max={props.length()-1}
                    min={0}
                    style={{
                        position:"absolute",
                        "pointer-events":"auto",
                        top:"2%",
                        height:"96%",
                        right: "0.5%",
                        "writing-mode": "vertical-lr",
                        direction: inverted? "ltr" : "rtl",
                    }}
                    on:wheel={onMouseWheel}
                    on:input={onInputEvent}/>
            </div>
    );};

    return scrollbar(props);
}