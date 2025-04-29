import {createSignal, onMount, onCleanup} from "solid-js"
import type { Component } from 'solid-js';
import MapComponent from './ams';
import WaterfallCmp from './components/waterfall';
import SBComp from './components/SBComp';
import { MSSEvent} from "./events";
import { SDPStatusMessage } from "./mss";

import logo from './logo.svg';
//import styles from './App.module.css';

	
const App: Component = () => {

  //var sdpSocket = new WebSocket("ws://10.71.3.112:1234");
  var sdpSocket = new WebSocket("ws://localhost:1234");
  //let socket = new WebSocket("wss//stream.aisstream.io/v0/stream");
  /*let socket = new WebSocket("ws://localhost/v0/stream");
  
  socket.onopen = function (_) {
    let subscriptionMessage = {
        Apikey: "83dfbaf8d31a0efb443bda51635bddd25a78c9c8",
        BoundingBoxes: [[[65, 17], [53, 23]]],
        FilterMessageTypes: ["PositionReport"] // Optional!
    }
    socket.send(JSON.stringify(subscriptionMessage));
	};

	socket.onmessage = function (event) {
		let aisMessage = JSON.parse(event.data)
		console.log(aisMessage)
	};*/

  onMount(() => {
    sdpSocket.addEventListener("message", onSDPMessage);
  });

  
  function onSDPMessage(event: MessageEvent)
  {
    //TODO Verify Event Data is ACTUALLY a SDPMessage!!
    const data = JSON.parse(event.data) as SDPStatusMessage;
    document.dispatchEvent(new MSSEvent({
      type:"SDPStatusMessage",
      data: data
    }));
  }
  // <WaterfallCmp />   
  return (
     <div class="app" >       
     
     
      <SBComp /> 
      
    </div>
  );
};

export default App;
