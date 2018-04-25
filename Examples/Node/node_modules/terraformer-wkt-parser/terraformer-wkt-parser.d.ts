declare namespace Terraformer {
    namespace WKT {
        function parse(wkt: string): GeoJSON.GeometryObject;
        function convert(geoJSON: GeoJSON.GeometryObject): string;
    }
}

export = Terraformer.WKT;