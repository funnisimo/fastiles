(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Fastiles = {}));
}(this, (function (exports) { 'use strict';

    const QUAD = [
        0, 0, 1, 0, 0, 1,
        0, 1, 1, 0, 1, 1
    ];
    function createProgram(gl, ...sources) {
        const p = gl.createProgram();
        [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, index) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, sources[index]);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(shader));
            }
            gl.attachShader(p, shader);
        });
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(p));
        }
        return p;
    }
    function createTexture(gl) {
        let t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        return t;
    }

    const VS = `
#version 300 es
in uvec2 position;
in uvec2 uv;
in uint style;
out vec2 fsUv;
flat out uint fsStyle;
uniform highp uvec2 tileSize;
uniform uvec2 viewportSize;
void main() {
	ivec2 positionPx = ivec2(position * tileSize);
	vec2 positionNdc = (vec2(positionPx * 2) / vec2(viewportSize))-1.0;
	positionNdc.y *= -1.0;
	gl_Position = vec4(positionNdc, 0.0, 1.0);
	fsUv = vec2(uv);
	fsStyle = style;
}`.trim();
    const FS = `
#version 300 es
precision highp float;
in vec2 fsUv;
flat in uint fsStyle;
out vec4 fragColor;
uniform sampler2D font;
uniform highp uvec2 tileSize;
void main() {
	uvec2 fontTiles = uvec2(textureSize(font, 0)) / tileSize;

	uint glyph = (fsStyle & uint(0xFF000000)) >> 24;
	uint glyphX = (glyph & uint(0xF));
	uint glyphY = (glyph >> 4);
	uvec2 fontPosition = uvec2(glyphX, glyphY);

	uvec2 fontPx = (tileSize * fontPosition) + uvec2(vec2(tileSize) * fsUv);
	vec3 texel = texelFetch(font, ivec2(fontPx), 0).rgb;

	float s = 15.0;
	uint fr = (fsStyle & uint(0xF00)) >> 8;
	uint fg = (fsStyle & uint(0x0F0)) >> 4;
	uint fb = (fsStyle & uint(0x00F)) >> 0;
	vec3 fgRgb = vec3(fr, fg, fb) / s;
  
	uint br = (fsStyle & uint(0xF00000)) >> 20;
	uint bg = (fsStyle & uint(0x0F0000)) >> 26;
	uint bb = (fsStyle & uint(0x00F000)) >> 12;
	vec3 bgRgb = vec3(br, bg, bb) / s;
  
	fragColor = vec4(mix(bgRgb, fgRgb, texel), 1.0);
}`.trim();

    class Glyphs {
        constructor(opts = {}) {
            this.width = 16;
            this.height = 16;
            this.tileWidth = 12;
            this.tileHeight = 16;
            this._map = {};
            opts.font = opts.font || 'monospace';
            opts.basic = opts.basic || false;
            this._configure(opts);
            this._initGlyphs(opts.glyphs, opts.basic);
        }
        _configure(opts) {
            this.node = opts.node || document.createElement('canvas');
            this.tileWidth = opts.tileWidth || opts.width || this.tileWidth;
            this.tileHeight = opts.tileHeight || opts.height || this.tileHeight;
            this.node.width = this.width * this.tileWidth;
            this.node.height = this.height * this.tileHeight;
            this.ctx = this.node.getContext('2d');
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.pxWidth, this.pxHeight);
            const size = opts.fontSize || opts.size || Math.max(this.tileWidth, this.tileHeight);
            this.ctx.font = '' + size + 'px ' + opts.font;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = 'white';
        }
        draw(n, ch) {
            const x = (n % this.width) * this.tileWidth;
            const y = Math.floor(n / this.width) * this.tileHeight;
            const cx = x + Math.floor(this.tileWidth / 2);
            const cy = y + Math.floor(this.tileHeight / 2);
            this.ctx.save(); // save the context
            this.ctx.beginPath();
            this.ctx.rect(x, y, this.tileWidth, this.tileHeight);
            this.ctx.clip();
            if (typeof ch === 'function') {
                ch(this.ctx, x, y, this.tileWidth, this.tileHeight);
            }
            else {
                this._map[ch] = n;
                this.ctx.fillText(ch, cx, cy);
            }
            this.ctx.restore(); // restore the context
        }
        _initGlyphs(glyphs = {}, basicOnly = false) {
            for (let i = 32; i < 127; ++i) {
                this.draw(i, glyphs[i] || String.fromCharCode(i));
            }
            if (basicOnly) {
                if (Array.isArray(glyphs)) {
                    glyphs.forEach((ch, i) => this.draw(i, ch));
                }
                else {
                    Object.entries(glyphs).forEach(([i, ch]) => this.draw(Number.parseInt(i), ch));
                }
            }
            else {
                [' ', '\u263a', '\u263b', '\u2665', '\u2666', '\u2663', '\u2660', '\u263c',
                    '\u2600', '\u2605', '\u2606', '\u2642', '\u2640', '\u266a', '\u266b', '\u2638',
                    '\u25b6', '\u25c0', '\u2195', '\u203c', '\u204b', '\u262f', '\u2318', '\u2616',
                    '\u2191', '\u2193', '\u2192', '\u2190', '\u2126', '\u2194', '\u25b2', '\u25bc',
                ].forEach((ch, i) => {
                    this.draw(i, glyphs[i] || ch);
                });
                [
                    '\u2302',
                    '\u2b09', '\u272a', '\u2718', '\u2610', '\u2611', '\u25ef', '\u25ce', '\u2690',
                    '\u2691', '\u2598', '\u2596', '\u259d', '\u2597', '\u2744', '\u272d', '\u2727',
                    '\u25e3', '\u25e4', '\u25e2', '\u25e5', '\u25a8', '\u25a7', '\u259a', '\u265f',
                    '\u265c', '\u265e', '\u265d', '\u265b', '\u265a', '\u301c', '\u2694', '\u2692',
                    '\u25b6', '\u25bc', '\u25c0', '\u25b2', '\u25a4', '\u25a5', '\u25a6', '\u257a',
                    '\u257b', '\u2578', '\u2579', '\u2581', '\u2594', '\u258f', '\u2595', '\u272d',
                    '\u2591', '\u2592', '\u2593', '\u2503', '\u252b', '\u2561', '\u2562', '\u2556',
                    '\u2555', '\u2563', '\u2551', '\u2557', '\u255d', '\u255c', '\u255b', '\u2513',
                    '\u2517', '\u253b', '\u2533', '\u2523', '\u2501', '\u254b', '\u255e', '\u255f',
                    '\u255a', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256c', '\u2567',
                    '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256b',
                    '\u256a', '\u251b', '\u250f', '\u2588', '\u2585', '\u258c', '\u2590', '\u2580',
                    '\u03b1', '\u03b2', '\u0393', '\u03c0', '\u03a3', '\u03c3', '\u03bc', '\u03c4',
                    '\u03a6', '\u03b8', '\u03a9', '\u03b4', '\u221e', '\u03b8', '\u03b5', '\u03b7',
                    '\u039e', '\u00b1', '\u2265', '\u2264', '\u2234', '\u2237', '\u00f7', '\u2248',
                    '\u22c4', '\u22c5', '\u2217', '\u27b5', '\u2620', '\u2625', '\u25fc', '\u25fb'
                ].forEach((ch, i) => {
                    this.draw(i + 127, glyphs[i] || ch);
                });
            }
        }
        toIndex(ch) { return this._map[ch] || -1; }
        get pxWidth() { return this.node.width; }
        get pxHeight() { return this.node.height; }
    }

    const VERTICES_PER_TILE = 6;
    class Canvas {
        constructor(options) {
            this._data = new Uint32Array();
            this._buffers = {};
            this._attribs = {};
            this._uniforms = {};
            this._renderRequested = false;
            this._width = 50;
            this._height = 25;
            this._tileWidth = 16;
            this._tileHeight = 16;
            let opts = options;
            if (options instanceof HTMLCanvasElement) {
                opts = { node: options };
            }
            this._gl = this._initGL(opts.node);
            this._configure(opts);
        }
        get node() { return this._gl.canvas; }
        get width() { return this._width; }
        get height() { return this._height; }
        get tileWidth() { return this._tileWidth; }
        get tileHeight() { return this._tileHeight; }
        _configure(options) {
            this._width = options.width || this._width;
            this._height = options.height || this._height;
            let glyphs = options.glyphs;
            if (!glyphs) {
                const glyphObj = new Glyphs({ tileWidth: this._tileWidth, tileHeight: this._tileHeight }); // use defaults
                glyphs = glyphObj.node;
            }
            this.updateGlyphs(glyphs);
        }
        resize(width, height) {
            this._width = width;
            this._height = height;
            const node = this.node;
            node.width = this._width * this._tileWidth;
            node.height = this._height * this._tileHeight;
            const gl = this._gl;
            const uniforms = this._uniforms;
            gl.viewport(0, 0, node.width, node.height);
            gl.uniform2ui(uniforms["viewportSize"], node.width, node.height);
            this._createGeometry();
            this._createData();
        }
        updateGlyphs(glyphs) {
            const gl = this._gl;
            const uniforms = this._uniforms;
            this._tileWidth = glyphs.width / 16;
            this._tileHeight = glyphs.height / 16;
            this.resize(this._width, this._height);
            gl.uniform2uiv(uniforms["tileSize"], [this._tileWidth, this._tileHeight]);
            this._uploadGlyphs(glyphs);
        }
        draw(x, y, glyph, fg, bg) {
            let index = y * this._width + x;
            index *= VERTICES_PER_TILE;
            glyph = glyph & 0xFF;
            bg = bg & 0xFFF;
            fg = fg & 0xFFF;
            const style = (glyph << 24) + (bg << 12) + fg;
            this._data[index + 2] = style;
            this._data[index + 5] = style;
            this._requestRender();
        }
        _initGL(node) {
            if (typeof node === 'string') {
                node = document.getElementById(node);
            }
            else if (!node) {
                node = document.createElement("canvas");
            }
            let gl = node.getContext("webgl2");
            if (!gl) {
                throw new Error("WebGL 2 not supported");
            }
            const p = createProgram(gl, VS, FS);
            gl.useProgram(p);
            const attributeCount = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
            for (let i = 0; i < attributeCount; i++) {
                gl.enableVertexAttribArray(i);
                let info = gl.getActiveAttrib(p, i);
                this._attribs[info.name] = i;
            }
            const uniformCount = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                let info = gl.getActiveUniform(p, i);
                this._uniforms[info.name] = gl.getUniformLocation(p, info.name);
            }
            gl.uniform1i(this._uniforms["font"], 0);
            this._glyphs = createTexture(gl);
            return gl;
        }
        _createGeometry() {
            const gl = this._gl;
            this._buffers.position && gl.deleteBuffer(this._buffers.position);
            this._buffers.uv && gl.deleteBuffer(this._buffers.uv);
            let buffers = createGeometry(gl, this._attribs, this._width, this._height);
            Object.assign(this._buffers, buffers);
        }
        _createData() {
            const gl = this._gl;
            const attribs = this._attribs;
            const tileCount = this._width * this._height;
            this._buffers.style && gl.deleteBuffer(this._buffers.style);
            this._data = new Uint32Array(tileCount * VERTICES_PER_TILE);
            const style = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, style);
            gl.vertexAttribIPointer(attribs["style"], 1, gl.UNSIGNED_INT, 0, 0);
            Object.assign(this._buffers, { style });
        }
        _requestRender() {
            if (this._renderRequested) {
                return;
            }
            this._renderRequested = true;
            requestAnimationFrame(() => this._render());
        }
        _render() {
            const gl = this._gl;
            this._renderRequested = false;
            gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.style);
            gl.bufferData(gl.ARRAY_BUFFER, this._data, gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.TRIANGLES, 0, this._width * this._height * VERTICES_PER_TILE);
        }
        _uploadGlyphs(pixels) {
            const gl = this._gl;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._glyphs);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            this._requestRender();
        }
    }
    function createGeometry(gl, attribs, width, height) {
        let tileCount = width * height;
        let positionData = new Uint16Array(tileCount * QUAD.length);
        let uvData = new Uint8Array(tileCount * QUAD.length);
        let i = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                QUAD.forEach(value => {
                    positionData[i] = (i % 2 ? y : x) + value;
                    uvData[i] = value;
                    i++;
                });
            }
        }
        const position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, position);
        gl.vertexAttribIPointer(attribs["position"], 2, gl.UNSIGNED_SHORT, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
        const uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uv);
        gl.vertexAttribIPointer(attribs["uv"], 2, gl.UNSIGNED_BYTE, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.STATIC_DRAW);
        return { position, uv };
    }

    exports.Canvas = Canvas;
    exports.Glyphs = Glyphs;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
