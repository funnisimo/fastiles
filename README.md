# fastiles

Library for rendering colorized bitmap fonts. Very fast, suitable for applications where the whole scene needs frequent redrawing.

## Features

  - Supports up to 256 glyphs in 16x16 image
  - Updates are batched via `requestAnimationFrame`
  - Uses 4096 colors
  - Written in TypeScript
  - Can generate glyph images from font

## Speed

  - WebGL (WebGL 2, to be precise)
  - No per-render memory allocations
  - Only one GL draw call for the whole scene
  - Minimized JS data transfer (data set only for [Provoking vertices](https://www.khronos.org/opengl/wiki/Primitive#Provoking_vertex))
  - Thousands of tiles rendered at 60 fps

## Colors

Colors in Fastiles are represented by 12 bit numbers with 4 bits each for red, green, and blue values.

```js
const red = 0xF00;
const green = 0x0F0;
const blue = 0x00F;
const yellow = 0xFF0;
```

These color integers are used for both the foreground and background drawing colors.

## Glyphs

Fastiles works by using a bitmap font image that it draws from.  The image *MUST* be a 16x16 layout for the glyphs.  The size of the glyphs (or characters) inferred by the Fastiles.Scene at construction time.

```js
const glyphs = new Image();
glyphs.src = 'url | data';
await glyphs.decode();

const scene = new Fastiles.Scene({ glyphs, width: 50, height: 38 });

scene.draw(0, 0, 97, 0xF00, 0xFFF); // red 'A' on white background.
```

## Scene

The Scene class represents a Fastiles display that is wrapped around a HTTPCanvasElement.  It uses WebGL2 to draw the glyphs.

Options available at scene construction time:
- width - the number of tiles the scene contains in the X axis (default 50)
- height - the number of tiles the scene contains in the Y axis (default 25)
- glyphs - the image that has the 16x16 layout of the glyphs (will use default if not given)
- node - the HTMLCanvasElement to use (will create if not given)

Once you create a scene, you can call draw on it as much as you want.  When you do, it will automatically use requestAnimationFrame to batch the draw calls.

If you want to resize the Scene, use the `resize` method.  If you want to change the glyphs, use the `updateGlyphs` method.

## Example

```js
import { Scene } from "fastiles";

async function init() {
  const glyphs = new Image();
  glyphs.src = './font.png';
  await glyphs.decode();

  const scene = new Scene({ glyphs, width: 24, height: 18 });
  document.body.appendChild(scene.node)

  // basic drawing
  scene.draw(
  	0, 0,   // position
  	65,     // glyph index (65=A)
  	0x0D4,  // foreground color 
  	0x333   // background color 
  );
}

init();
```

## More on Glyphs

The Fastiles library includes a Glyphs class that makes it easy to create glyph bitmaps from standard fonts.  You use it like this:

The options available for the creation of the glyph are:
* tileWidth - the width of a tile in pixels
* tileHeight - the height of a tile in pixels
* fontSize - the fontsize to use when drawing the glyphs
* font - the name of the font to use when drawing glyphs (default=monospace)
* basic - A boolean to indicate that you want only the basic ascii text characters (32-127) drawn

```js
const glyphs = new Glyphs({ tileWidth: 12, tileHeight: 12, fontSize: 14, font: 'monospace' });
const scene = new Scene({ glyphs: glyphs.node, width: 30, height: 30 });
```

Once you have a glyph object, you can modify it by using the draw method in one of 2 ways:
* draw(index, char) - draws the given character using the configured font in the spot indicated by the index
* draw(index, fn) - calls your function with the following parameters:
  - ctx: CanvasRenderingContext2D - the rendering context you can use to draw into the tile
  - x, y, width, height: number - the x, y, width, height of the region to draw the glyph into

Custom draw functions are protected by a clipping region that will keep the glyphs from overwriting each other.

If you change the glyphs after the Scene is created, you will need to update it with the Scene.  Do this by calling the `updateGlyphs` method on the scene.

```js
glyphs.draw(35, '\u2302');
glyphs.draw(32, (ctx, x, y, w, h) => ctx.fillText('-', x, y) );

scene.updateGlyphs(glyphs.node);
```
