"use strict";
var Terraformer = require("./terraformer");
console.assert(typeof Terraformer == string);
var point = new Terraformer.Primitive({
    type: "Point",
    coordinates: [1, 2]
});
console.assert(point instanceof Terraformer.Point); // -> true
console.assert(point instanceof Terraformer.Primitive); // -> true
// point.within(polygon); // -> true or false
var point1 = new Terraformer.Point({
    type: "Point",
    coordinates: [1, 2]
});
var point2 = new Terraformer.Point(1, 2);
var point3 = new Terraformer.Point([1, 2]);
var linestring = new Terraformer.LineString({
    type: "LineString",
    coordinates: [[1, 2], [2, 1]]
});
linestring = new Terraformer.LineString([[1, 2], [2, 1]]);
var multilinestring = new Terraformer.MultiLineString({
    type: "MultiLineString",
    coordinates: [[[1, 2], [2, 1]]]
});
multilinestring = new Terraformer.MultiLineString([[[1, 1], [2, 2], [3, 4]], [[0, 1], [0, 2], [0, 3]]]);
var polygon1 = new Terraformer.Polygon({
    "type": "Polygon",
    "coordinates": [
        [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
        [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
    ]
});
var polygon2 = new Terraformer.Polygon([
    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
]);
var multipolygon1 = new Terraformer.MultiPolygon({
    "type": "MultiPolygon",
    "coordinates": [[
            [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
            [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
        ]]
});
var multipolygon2 = new Terraformer.MultiPolygon([
    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
]);
var feature1 = new Terraformer.Feature({
    "type": "Feature",
    "properties": null,
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
            [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
        ]
    }
});
var feature2 = new Terraformer.Feature({
    "type": "Polygon",
    "coordinates": [
        [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
        [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
    ]
});
var featurecollection1 = new Terraformer.FeatureCollection({
    "type": "FeatureCollection",
    "features": [feature1, feature2]
});
var featurecollection2 = new Terraformer.FeatureCollection([feature1, feature2]);
var geometrycollection1 = new Terraformer.GeometryCollection({
    "type": "GeometryCollection",
    "geometries": [point2, polygon1]
});
var geometrycollection2 = new Terraformer.GeometryCollection([point2, polygon1]);
var circle = new Terraformer.Circle([45.65, -122.27], 500, 64);
circle.contains(point1);
var pt = [-111.467285, 40.75766];
var pt2 = [-111.873779, 40.647303];
var polygon = {
    "type": "Polygon",
    "coordinates": [[
            [-112.074279, 40.52215],
            [-112.074279, 40.853293],
            [-111.610107, 40.853293],
            [-111.610107, 40.52215],
            [-112.074279, 40.52215]
        ]]
};
var polygonGeometry = polygon.coordinates;
Terraformer.Tools.polygonContainsPoint(polygonGeometry, pt);
// returns false
Terraformer.Tools.polygonContainsPoint(polygonGeometry, pt2);
// returns true
