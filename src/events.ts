import { SDPStatusMessage } from "./mss";

interface AMSCMDBase{
    type: "AMSCommand"
}

interface AMSSetLive extends AMSCMDBase
{
    command: "SetLive";
    data: boolean;
}

interface AMSDraw extends AMSCMDBase
{
    command: "Draw";
    mode: "Polygon" | "Point" |"LineString";
}

type AMSCommand = AMSSetLive | AMSDraw;


interface ServerEventBase{
    type: "ServerMessage";
}


interface SDPStatusEvent
{
    type: "SDPStatusMessage";
    data: SDPStatusMessage;
}

type MSSEventData = AMSCommand | SDPStatusEvent;

export class MSSEvent extends CustomEvent<MSSEventData>
{
    constructor(obj: MSSEventData)
    {
        super("mssevent", {detail: obj, bubbles:true});
    }
}

interface dblPressData{
    key: string,
    code: string,
    ctrlKey: boolean,
    shiftKey: boolean,
    altKey: boolean,
    metaKey: boolean,
    repeat: boolean,
}

export class KeyDoubleClicked extends CustomEvent<dblPressData>
{
    constructor(inDat: dblPressData){
        KeyboardEvent
        super("keydblpressed", {detail:inDat, bubbles:true});
    }
}