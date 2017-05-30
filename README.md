# veldt-js

> High performance on-demand tile-based rendering library

[![npm version](https://badge.fury.io/js/veldt.svg)](http://badge.fury.io/js/veldt)
[![Bower version](https://badge.fury.io/bo/veldt.svg)](http://badge.fury.io/bo/veldt)
[![Build Status](https://travis-ci.org/unchartedsoftware/veldt-js.svg?branch=master)](https://travis-ci.org/unchartedsoftware/veldt-js)
[![Dependency Status](https://david-dm.org/unchartedsoftware/veldt-js/status.svg)](https://david-dm.org/unchartedsoftware/veldt-js)

## Installation

Requires (either):

- [NodeJS](http://nodejs.org/) JavaScript runtime.
- [Bower](http://bower.io/) package manager (npm install bower -g).

```bash
npm install veldt
```

or

```bash
bower install veldt
```

## Example

```javascript
// Open WebSocket connection for requesting tiles.
const requestor = new veldt.Requestor('tile', err => {
	// Check error
	if (err) {
		console.error(err);
		return;
	}

	// Create the central map object.
	const map = new veldt.Map('#map', {
		zoom: 3
	});

	// Create a CARTO base layer using a REST proxy tile.
	const carto = new veldt.Layer.Rest();
	carto.setPipeline('rest');
	carto.setURI('dark_nolabels');
	carto.setScheme('http');
	carto.setEndpoint('a.basemaps.cartocdn.com');
	carto.setExt('png');
	carto.useXYZ();
	carto.setRequestor(requestor);

	// Create a Macro point layer.
	const macro = new veldt.Layer.Macro();
	macro.setPipeline('elastic');
	macro.setURI('twitter-index');
	macro.setLOD(4);
	macro.setResolution(256);
	macro.setXField('pixel.x');
	macro.setYField('pixel.y');
	macro.setBounds(0, Math.pow(2, 32), 0, Math.pow(2, 32));
	macro.setRequestor(requestor);
	macro.setRenderer(new veldt.Renderer.WebGL.Macro({
		radius: 4,
		color: [ 0.4, 0.8, 0.2, 0.8 ]
	}));

	// Add layers to the map.
	map.add(carto);
	map.add(macro);
});
```
