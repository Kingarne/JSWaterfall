//const WebSocket = require('ws');
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream")

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
};