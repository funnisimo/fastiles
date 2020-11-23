import { createProgram, createTexture, QUAD } from "./utils.js";
import * as shaders from "./shaders.js";
import Glyphs from './glyphs.js'; 


type GL = WebGL2RenderingContext;
const VERTICES_PER_TILE = 6;

interface Options {
	width: number;
	height: number;
	glyphs?: TexImageSource;
	node?: HTMLCanvasElement|string;
}

export default class Canvas {
	private _gl!: GL;
	private _data = new Uint32Array();
	private _buffers: {
		position?: WebGLBuffer;
		uv?: WebGLBuffer;
		style?: WebGLBuffer;
	} = {};
	private _attribs: Record<string, number> = {};
	private _uniforms: Record<string, WebGLUniformLocation> = {};
	private _renderRequested: boolean = false;
	private _glyphs!: WebGLTexture;
	private _width:number=50;
	private _height:number=25;
	private _tileWidth:number=16;
	private _tileHeight:number=16;

  constructor(options: Options|HTMLCanvasElement) {
		let opts = options as Options;
		if (options instanceof HTMLCanvasElement) {
			opts = { node: options } as Options;
		}
    this._gl = this._initGL(opts.node);
    this._configure(opts);
  }
	
  get node() { return this._gl.canvas; }
	get width() { return this._width; }
	get height() { return this._height; }
	get tileWidth() { return this._tileWidth; }
	get tileHeight() { return this._tileHeight; }
	
  private _configure(options: Options) {
			this._width = options.width || this._width;
			this._height = options.height || this._height;
			let glyphs = options.glyphs;
			if (!glyphs) {
				const glyphObj = new Glyphs({ tileWidth: this._tileWidth, tileHeight: this._tileHeight });	// use defaults
				glyphs = glyphObj.node;
			}
			this.updateGlyphs(glyphs);
  }

	resize(width: number, height: number) {
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

	updateGlyphs(glyphs: TexImageSource) {
		const gl = this._gl;
		const uniforms = this._uniforms;

		this._tileWidth = glyphs.width / 16;
		this._tileHeight = glyphs.height / 16;
		this.resize(this._width, this._height);

		gl.uniform2uiv(uniforms["tileSize"], [this._tileWidth, this._tileHeight]);
		this._uploadGlyphs(glyphs);
	}

  draw(x: number, y: number, glyph: number, fg: number, bg: number) {
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
	
  private _initGL(node?: HTMLCanvasElement|string) {
			if (typeof node === 'string') {
				node = document.getElementById(node) as HTMLCanvasElement;
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
          let info = gl.getActiveAttrib(p, i) as WebGLActiveInfo;
          this._attribs[info.name] = i;
      }
      const uniformCount = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
          let info = gl.getActiveUniform(p, i) as WebGLActiveInfo;
          this._uniforms[info.name] = gl.getUniformLocation(p, info.name) as WebGLUniformLocation;
      }
      gl.uniform1i(this._uniforms["font"], 0);
      this._glyphs = createTexture(gl);
      return gl;
  }
	
  private _createGeometry() {
      const gl = this._gl;
      this._buffers.position && gl.deleteBuffer(this._buffers.position);
      this._buffers.uv && gl.deleteBuffer(this._buffers.uv);
      let buffers = createGeometry(gl, this._attribs, this._width, this._height);
      Object.assign(this._buffers, buffers);
  }
	
  private _createData() {
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
	
  private _requestRender() {
      if (this._renderRequested) {
          return;
      }
      this._renderRequested = true;
      requestAnimationFrame(() => this._render());
  }
	
  private _render() {
      const gl = this._gl;
      this._renderRequested = false;
      gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.style!);
      gl.bufferData(gl.ARRAY_BUFFER, this._data, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, this._width * this._height * VERTICES_PER_TILE);
  }
	
  private _uploadGlyphs(pixels: TexImageSource) {
      const gl = this._gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._glyphs);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      this._requestRender();
  }
}

function createGeometry(gl: GL, attribs: Record<string, number>, width: number, height: number) {
	let tileCount = width * height;
	let positionData = new Uint16Array(tileCount * QUAD.length);
	let uvData = new Uint8Array(tileCount * QUAD.length);
	let i=0;

	for (let y=0; y<height; y++) {
		for (let x=0; x<width; x++) {
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

	return {position, uv};
}
