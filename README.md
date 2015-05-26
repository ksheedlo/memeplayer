# MemePlayer.js
MemePlayer.js turns a regular canvas into a full featured meme editor.

### Installation

**Bower**

```
$ bower install memeplayer.js
```

You will need polyfills for HTML5 Fetch and ES6 Promises. I recommend Github's [fetch polyfill](https://github.com/github/fetch) and Jake Archibald's [promise polyfill](https://github.com/jakearchibald/es6-promise). Additionally, if you need to run in IE9, you need a polyfill for [WindowBase64](https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64) for converting images to and from base 64.

**Browserify**

```
$ npm install memeplayer.js
```

Like with the Bower installation, you'll need to polyfill Fetch and Promises before you can start using MemePlayer, as well as WindowBase64 if IE9 support is required.

```js
require('es6-promise').polyfill();
require('whatwg-fetch');

var MemePlayer = require('memeplayer');
```

**Node with node-canvas**

MemePlayer will include all necessary polyfills. Just `require` it and you're good to go. Instead of initializing it with an `HTMLCanvasElement` from the DOM, you initialize it with a `Canvas` instance from [node-canvas](https://github.com/Automattic/node-canvas).

```js
var MemePlayer = require('memeplayer'),
  Canvas = require('canvas');

var player = new MemePlayer(new Canvas(500, 500), 500, 500);
```

### Stuff It Can Do

- Draw text over an image macro.
- Export base64 image data for further processing.
- Works with JPG, PNG and animated GIF (!)

For all the gritty details, refer to the
[API docs](http://ksheedlo.github.io/MemePlayer.js/MemePlayer.html).
