import WKT = require("./terraformer-wkt-parser");

console.assert(typeof WKT !== undefined);

// convert a GeoJSON Geometry to a WKT Geometry
let wktPoint = WKT.convert({
  "type": "Point",
  "coordinates": [-122.6764, 45.5165]
});

// convert a GeoJSON object into an ArcGIS geometry
let geoJsonPoint = WKT.parse(wktPoint);
