import { Feature, Geometry, Polygon, Point } from "geojson";

export type ObjectSource = "system" | "vis" | "ir" | "uv" | "fms";

export type ObjectType = "target" | "event" | "graphical aid";



export type ObjectSubType = "none" | "image" | "vessel" | "tiff";

interface ImageData
{
    image_id:number|undefined
    width: number
    height: number
    file_path: string
}

interface TiffData extends ImageData
{
    geotransform: [number,number,number,number,number,number]
}

interface ObjProps
{
    mission_id: number;
    name:string;
    timestamp:Date;
    type: ObjectType;
    subtype: ObjectSubType;
    source: ObjectSource;
}

interface ImageProps extends ObjProps
{
    type: "event"
    subtype: "image"
    data: ImageData
}

interface TiffProps extends ObjProps
{
    type: "event"
    subtype: "tiff"
    data:TiffData
}

interface ObjBase<G extends Geometry = Geometry, P extends ObjProps = ObjProps>  extends Feature<G, P>
{
    id:number;
}

export type TiffImage = ObjBase<Polygon, TiffProps>

export type  Image = ObjBase<Point|Polygon, ImageProps>

export type Object = TiffImage|Image

interface SDPTimeStamp
{
    sec:number,
    usec:number,
}


//TODO Template-ify these, since they have the same structure just different prop name
interface SDPTimePos
{
    latitude: number;
    longitude: number;
    time: SDPTimeStamp;
}

interface SDPFMSAltitude
{
    altitude: number;
    time: SDPTimeStamp;
}

interface SDPFMSHeading
{
    heading: number;
    time: SDPTimeStamp;
}



interface SDPFMSStatus
{
    altitude: SDPFMSAltitude;
    true_heading: SDPFMSHeading|undefined;
    magnetic_heading: SDPFMSHeading|undefined;
    position: SDPTimePos;
}

interface SDPGPSStatus extends SDPTimePos
{
    altitude: number;
    course: number|undefined;
    hdop: number;
    magnetic_variation: number;
    rms_deviation: number;
    satellites: number;
    speed: number;
    status: number;
    vdop: number;
}

export interface SDPStatusMessage
{
    ais: any;
    df: any;
    eoir: any;
    fms: SDPFMSStatus;
    gnss: SDPGPSStatus
    slar: any;
    time: any;
}