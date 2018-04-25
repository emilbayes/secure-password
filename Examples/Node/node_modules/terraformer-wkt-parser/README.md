# Terraformer Well-Known Text Parser

[![Build Status](https://travis-ci.org/Esri/terraformer-wkt-parser.svg?branch=master)](https://travis-ci.org/Esri/terraformer-wkt-parser)

> Two way conversion between [GeoJSON](http://geojson.org/geojson-spec.html) and WKT. Part of the [Terraformer](http://terraformer.io) project.

## Installing

### Node.js

    $ npm install terraformer-wkt-parser

### Browser

In the browser, Terraformer is required to be used as well.

    $ bower install terraformer-wkt-parser

## Documentation

For full documentation check out the [offical website](http://terraformer.io/wkt-parser/).

```js
var wkt = require('terraformer-wkt-parser');

// parse a WKT file, convert it into a terraformer primitive
var primitive = wkt.parse('LINESTRING (30 10, 10 30, 40 40)');

// take a terraformer primitive and convert it into a WKT representation
var polygon = wkt.convert(
  {
    "type": "Polygon",
    "coordinates": [
      [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
      [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
    ]
  }
);
```

```html
    <!-- Load the main Terraformer library -->
    <script src="terraformer.min.js" type="text/javascript"></script>

    <!-- Load the WKT Parser -->
    <script src="terraformer-wkt-parser.min.js" type="text/javascript"></script>

    <!-- Use it! -->
    <script>
      var primitive = Terraformer.WKT.parse('LINESTRING (30 10, 10 30, 40 40)');
    </script>
```

## Resources

* [Terraformer Website](http://terraformer.io)
* [twitter@EsriPDX](http://twitter.com/esripdx)

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

[](Esri Tags: Terraformer GeoJSON WKT Well-Known-Text)
[](Esri Language: JavaScript)
