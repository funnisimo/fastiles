import { createProgram, createTexture, QUAD } from "./utils.js";
import * as shaders from "./shaders.js";
import Glyphs from './glyphs.js';
const VERTICES_PER_TILE = 6;
export default class Canvas {
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
        node.height = this._height * this._tileWidth;
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
        const p = createProgram(gl, shaders.VS, shaders.FS);
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
