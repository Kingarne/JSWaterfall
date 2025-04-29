import { batch, createEffect, createMemo, createSignal, onCleanup, onMount, untrack, Accessor} from 'solid-js';
import { JSX } from 'solid-js';

import 'ol/ol.css';
import { Map, Feature, View } from 'ol';
import { MultiPolygon, Polygon } from 'ol/geom';
import { GeoJSON } from 'ol/format';
import { AnimationOptions } from 'ol/View';
import TileLayer from "ol/layer/Tile"
import {OSM, Vector} from "ol/source"
import { defaults, DragPan, MouseWheelZoom } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle.js';
import { Projection, transform, useGeographic } from 'ol/proj';

import { MSSEvent } from './events';
import { Coordinate } from 'ol/coordinate';
import { toLonLat, fromLonLat } from 'ol/proj';
import Point from 'ol/geom/Point.js';
import Icon from 'ol/style/Icon.js';
import VectorSource from 'ol/source/Vector.js';
import XYZ from 'ol/source/XYZ.js';

import ImageLayer from 'ol/layer/Image';
import GeoTIFF from 'ol/source/GeoTIFF';
import WebGLTileLayer from 'ol/layer/WebGLTile.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import ImageCanvasSource from 'ol/source/ImageCanvas';
import InfoView from './components/InfoView';

// DECK
import {Deck} from '@deck.gl/core';
import {GeoJsonLayer, ArcLayer} from '@deck.gl/layers';

const airplaneIconPath = new URL('./assets/plane-blue.png', import.meta.url).href
const testIconPath = new URL('./assets/test2.png', import.meta.url).href
const imgPath = new URL('./assets/plane-blue.png', import.meta.url).href//'./assets/plane-blue.png';
const tiffTest = new URL('./assets/warped.tif', import.meta.url).href

import { get as getProjection } from 'ol/proj';
import { getWidth, getHeight } from 'ol/extent';

// Define extent in EPSG:3857 (Web Mercator)
const extent = [0, 0, 1000000, 1000000];


type Geotransform = [number, number, number, number, number, number];

function GeotransformParsePixelToCoord(geo:Geotransform, x:number, y:number): Coordinate
{
  const geoX:number = geo[0] + x*geo[1] + y*geo[2];
  const geoY:number = geo[3] + x*geo[4] + y*geo[5];
  return [geoX,geoY];
}



let svg = "<svg xmlns='http://www.w3.org/2000/svg' fill='#00FF10' fill-opacity='0.85' stroke='#007F10' stroke-opacity='0.85' stroke-linejoin='bevel' stroke-width='5' width='240' height='240'><path d='M 194.67321,2.8421709e-14 L 70.641958,53.625 C 60.259688,46.70393 36.441378,32.34961 31.736508,30.17602 C -7.7035221,11.95523 -5.2088921,44.90709 11.387258,54.78122 C 15.926428,57.48187 39.110778,71.95945 54.860708,81.15624 L 72.766958,215.09374 L 94.985708,228.24999 L 106.51696,107.31249 L 178.04821,143.99999 L 181.89196,183.21874 L 196.42321,191.84374 L 207.51696,149.43749 L 207.64196,149.49999 L 238.45446,117.96874 L 223.57946,109.96874 L 187.95446,126.87499 L 119.67321,84.43749 L 217.36071,12.25 L 194.67321,2.8421709e-14 z'/></svg>";
let acicon = 'data:image/svg+xml;base64,' + btoa(svg);



export default function MapComponent() {
  let mapRef!: HTMLDivElement;
  let infoRef!: HTMLDivElement;

  let vectorSource = new Vector<Feature<Polygon>>();
  let multiPoly = new MultiPolygon([]);
  
  const [infoText, setInfoText] = createSignal("Hej2");

  let view = new View({
    center: fromLonLat([18, 59.5]),
    zoom: 10,
    //projection: 'EPSG:4326',
  });

  let amsMap: Map;

  const[panningOptions, setPanningOptions] = createSignal<AnimationOptions|undefined>();
  
  const[features, setFeatures] = createSignal<Array<Feature<Polygon>>>([]);

  // Example airplane position (longitude, latitude)
  const airplaneStyle = new Style({
    image: new Icon({
      src: airplaneIconPath, //airplaneIconPath,//,
      scale: 0.5,
      anchor: [0.4, 0.0],         // X and Y in [0, 1]
      anchorXUnits: 'fraction',   // or 'pixels'
      anchorYUnits: 'fraction',   // or 'pixels'
      rotation: Math.PI / 4, // 45 degrees
      rotateWithView: true // stays aligned with map rotation
    })
  });
  
  let aircraftFeature = new Feature({
    geometry: new Point([18, 59.4]),    
  });
  
  let planeLayer = new VectorLayer({
    source: new Vector({
      features: [aircraftFeature],
    }),
  });

  
  const tileSource = new XYZ({
    //url: 'http://172.26.71.157:7010/{z}/{x}/{y}',//?t=' + new Date().getTime(), // Replace with your actual TileServer URL
    url: '/ams/vis/{x}/{-y}/{z}.png',//?t=' + new Date().getTime(), // Replace with your actual TileServer URL
    tileSize: 256,       
    maxZoom: 17,
    crossOrigin: 'anonymous',
    transition: 0,
   // tileLoadFunction: function (tile, src) {
    //  tile.getImage().src = src + '?t=' + new Date().getTime(); // Prevent browser cache
   // }
  });
  
  var amsTileLayer = new TileLayer({
    source: tileSource,
    visible: true,
    opacity: 1.0  // Make it semi-transparent     
  });

  const geoTiffSource = new GeoTIFF({
    sources: [
      {
        url: tiffTest,
      },
    ],
    //projection: 'EPSG:4326',
  });
  
  // Create an image layer using the GeoTIFF source.
  const geoTiffLayer = new WebGLTileLayer({
    source: geoTiffSource,
  });
  
  function GetFeatureIndexById(id: number|undefined): number|undefined
  {
    return untrack(features).findIndex((val)=>{return val.getId() === id });
  }

  function GetFeatureIndex(feature: Feature<Polygon>): number
  {
    let index = GetFeatureIndexById(feature.getId() as number|undefined);
    if(!index)
      index = -1;
    return index;
  }
  
  function AddFeatures(feats: Feature<Polygon>[]):boolean
  {
    let added:boolean = false;
    let copy:Array<Feature<Polygon>> = [...features()];

    feats.forEach((feat)=>{
      //TODO Check if vectorSource Contains the feature already.
      if(!feat.getGeometry())
        return;
      added = true;
      vectorSource.addFeature(feat);
      multiPoly.appendPolygon(feat.getGeometry()!)
      copy.push(feat);
    });
    if(added)
      setFeatures(copy);
    return added;
  }

  
  //Pan to Panning Target
  createEffect(()=>{
    const opt = panningOptions();
    if(!opt)
      return;
    view.animate(opt);
  });
  
 
  const scalelineControl = new ScaleLine({
    minWidth: 64,
    units: 'metric',
    bar: true
});


// The real-world pixel size in meters per pixel (adjust as needed).
const pixelSize = 2; // e.g., 2 m/pixel

// Create an offscreen canvas and get its drawing context.
const offscreenCanvas = document.createElement('canvas');
const offscreenContext = offscreenCanvas.getContext('2d')!;

// Load your base image (could be a georeferenced image).
const baseImage = new Image();
baseImage.src = testIconPath; // Replace with your image URL

// Create an ImageCanvasSource with a canvas function.
const canvasSource = new ImageCanvasSource({
  canvasFunction: (extent, resolution, pixelRatio, size, projection) => {
    console.log(extent);
    let extX = extent[2]-extent[0];
    let extY = extent[3]-extent[1];
    console.log("res:" + resolution);
    
    console.log("Sz: " + size);
    console.log("ExtX: " + extX + ", ExtY: " + extY);
    console.log("m/unit:" + projection.getMetersPerUnit());
    console.log("Ratio: " + pixelRatio);
    
    // Set the canvas dimensions.
    offscreenCanvas.width = size[0];
    offscreenCanvas.height = size[1];

    // Clear the canvas.
    offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Draw the base image.
    // Here we assume the image should fill the entire canvas.
    // In a real scenario you might compute the proper scaling based on the georeferenced extent.
   // offscreenContext.rotate(20*Math.PI/180);
   offscreenContext.globalAlpha = 0.8;
    offscreenContext.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height, 110,110,offscreenCanvas.width/2, offscreenCanvas.height/2);
    offscreenContext.globalAlpha = 1;

    // Now draw one or more lines on top.
   /* offscreenContext.strokeStyle = 'red';
    offscreenContext.lineWidth = 2;
    offscreenContext.beginPath();
    // Example: a diagonal line from the top-left to bottom-right of the canvas.
    offscreenContext.moveTo(10, 10);
    offscreenContext.lineTo(offscreenCanvas.width-10, offscreenCanvas.height-10);
    offscreenContext.stroke();*/

    // Optionally, add text to indicate the pixel size (m/pixel).
    offscreenContext.fillStyle = 'black';
    offscreenContext.font = '16px sans-serif';
    offscreenContext.fillText(`Pixel Size: ${pixelSize} m/px`, 10, 500);

    // Return the offscreen canvas as the image for the layer.
    return offscreenCanvas;
  },
  projection: 'EPSG:3857', // Ensure this matches your map's projection or the image's projection
  //projection: 'EPSG:4326', // Ensure this matches your map's projection or the image's projection
  ratio: 1,
});

// Create an ImageLayer using the canvas source.
const canvLayer = new ImageLayer({
  source: canvasSource,
});

const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';
/*
const deck = new Deck({
  initialViewState: {longitude: 0, latitude: 0, zoom: 1},
  controller: false,
  parent: document.getElementById('map') ,
  style: {pointerEvents: 'none', 'z-index': 1},
  layers: [
    new GeoJsonLayer({
      id: 'airports',
      data: AIR_PORTS,
      // Styles
      filled: true,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 2000,
      getPointRadius: f => 11 - f.properties.scalerank,
      getFillColor: [200, 0, 80, 180],
      // Interactive props
      pickable: true,
      autoHighlight: true,
      onClick: info =>
        // eslint-disable-next-line
        info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
    }),
    /*new ArcLayer({
      id: 'arcs',
      data: AIR_PORTS,
      dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
      // Styles
      getSourcePosition: f => [-0.4531566, 51.4709959], // London
      getTargetPosition: f => f.geometry.coordinates,
      getSourceColor: [0, 128, 200],
      getTargetColor: [200, 0, 80],
      getWidth: 1
    })
  ]
});

// Sync deck view with OL view
const deckLayer = new Layer({
  render({size, viewState}) {
    const [width, height] = size;
    const [longitude, latitude] = toLonLat(viewState.center);
    const zoom = viewState.zoom - 1;
    const bearing = (-viewState.rotation * 180) / Math.PI;
    const deckViewState = {bearing, longitude, latitude, zoom};
    deck.setProps({width, height, viewState: deckViewState});
    deck.redraw();
  }
});*/

const source = new GeoTIFF({
  sources: [
    {
      url: 'https://openlayers.org/data/raster/no-overviews.tif',
      overviews: ['https://openlayers.org/data/raster/no-overviews.tif.ovr'],
    },
  ],
});
// Create an ImageLayer using the canvas source.
const tLayer = new WebGLTileLayer({
  source: source
})

  onMount(() => {
 
    
    amsMap = new Map({
      controls: [scalelineControl],
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
       // amsTileLayer,        
     //  deckLayer, 
      // canvLayer,
      //  planeLayer,
       // tLayer,
       // geoTiffLayer,
        

      ],
      //interactions:[],
      target: 'map',
      view,
     // controls:[],
    });

    aircraftFeature.setStyle(airplaneStyle);
    
    useGeographic();

    document.addEventListener("mssevent", HandleMssEvent as EventListener);

    amsMap.on("movestart", ()=>{
      //console.log("pointermove");
    });

    amsMap.on("pointermove", (event)=>{
      //console.log("pointermove" + event.pixel);
      const coord = amsMap.getCoordinateFromPixelInternal(event.pixel);
      const lonLat = toLonLat(coord);
      const coords3857 = fromLonLat(lonLat);

      infoRef.innerText = event.pixel[0].toString() + ", " + event.pixel[1].toString() + '\n' + lonLat[0].toFixed(6) + ", " +  lonLat[1].toFixed(6) +"\n" + coords3857[0].toFixed(2) + ", " +  coords3857[1].toFixed(2);
      

      if(event.dragging)
      {
      }
    });
/*
    amsMap.on("moveend", ()=>{
      const coords = view.getCenter();
      if(!coords)
        return;
      if(multiPoly.containsXY(coords[0], coords[1]))
        return;
      if(multiPoly.getPolygons().length == 0)
        return;
      const newCoord = multiPoly.getClosestPoint(coords);
      setPanningOptions({
        duration:550,
        center: newCoord,
      });
    });
    const interactions = defaults({ doubleClickZoom: false, mouseWheelZoom: false, dragPan: false });
    interactions.forEach(interaction => amsMap.addInteraction(interaction));
    amsMap.addInteraction(new MouseWheelZoom({
      condition: (ev) => {return ev.originalEvent.ctrlKey;},
      useAnchor:false, 
      constrainResolution:false
    }));
    amsMap.addInteraction(new DragPan());
    document.addEventListener("mssevent", HandleMssEvent as EventListener);

  
    mapRef.addEventListener("wheel", HandleWheel as EventListener);
    mapRef.addEventListener("pointerdown", HandlePointerDown as EventListener);
*/
  });

  onCleanup(()=>{
    amsMap.setTarget(undefined);
    document.removeEventListener("mssevent", HandleMssEvent as EventListener);
  });

  const HandleMssEvent: JSX.EventHandler<Document, MSSEvent> = (event) =>{
    switch(event.detail.type)
    {
      case "AMSCommand":{
        switch(event.detail.command)
        {
          
        
        }
        break;
      }
    
      case "SDPStatusMessage":{
        const data = event.detail.data;
        const p = new Point([data.gnss.longitude, data.gnss.latitude]);
        aircraftFeature.setGeometry(p);
        const style = aircraftFeature.getStyle() as Style|undefined;
        if(typeof style === "undefined")
          return;
        const img = style.getImage();
        if(img == null)
          return;
        //FIXIT Properly check for different headings!
        img.setRotation(data.fms.true_heading?.heading! * (Math.PI / 180));

        //planeLayer.changed();
        break;        
      }
    }
  };

  const HandleWheel: JSX.EventHandler<HTMLDivElement, WheelEvent> = (event) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
    if(event.ctrlKey)
      return;
    const newEvent = new WheelEvent('wheel', {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaZ: event.deltaZ,
        deltaMode: event.deltaMode,
        bubbles: true,
        cancelable: true,
        composed: true,
        ctrlKey:true,
      });
   
  };

  const HandlePointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (event) =>{
    if(event.button != 0)
      return;
    
    const tileProj = new Projection({code:"EPSG:4326"});
   
    /*
    const coordinate = amsMap.getCoordinateFromPixel([event.clientX, event.clientY]);
    tileLayer.UpdateTileAtCoord(Math.round(view.getZoom()!), coordinate, new Projection({code:"EPSG:4326"}));*/
  };

  ////<InfoView text={infoText()}/>
  return (
    <>
    { <div ref={infoRef} class={"info"} style={{width:"20vw", height:"12vh", "z-index":1, top:"15px", left:"20px"}}></div>  }
  
    <div id="map" class="map" ref={mapRef}/>    
    
   
    </>);
}


