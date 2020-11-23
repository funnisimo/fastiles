import { createProgram, createTexture, QUAD } from "./utils.js";
import * as shaders from "./shaders.js";
import Glyphs from './glyphs.js'; 


type GL = WebGL2RenderingContext;
const VERTICES_PER_TILE = 6;

export interface Options {
	width: number;
	height: number;
	glyphs?: TexImageSource;
	node?: HTMLCanvasElement|string;
}

export default class Scene {
	private _gl!: GL;
	private _data = new Uint32Array();
	private _buffers: {
		position?: WebGLBuffer;
		uv?: WebGLBuffer;
		style?: WebGLBuffer;
	} = {};
	private _attribs: Record<string, number> = {};
	private _uniforms: Record<string, WebGLUniformLocation> = {};
	private _drawRequested: boolean = false;
	private _glyphs!: WebGLTexture;
	public width:number=50;
	public height:number=25;
	public tileWidth:number=16;
	public tileHeight:number=16;

  constructor(options: Options|HTMLCanvasElement) {
		let opts = options as Options;
		if (options instanceof HTMLCanvasElement) {
			opts = { node: options } as Options;
		}
    this._gl = this._initGL(opts.node);
    this._configure(opts);
  }
  get node() { return this._gl.canvas; }
  private _configure(options: Options) {
			this.width = options.width || this.width;
			this.height = options.height || this.height;
			let glyphs = options.glyphs;
			if (!glyphs) {
				const glyphObj = new Glyphs({ tileWidth: this.tileWidth, tileHeight: this.tileHeight });	// use defaults
				glyphs = glyphObj.node;
			}
			this.updateGlyphs(glyphs);
  }

	resize(width: number, height: number) {
		this.width = width;
		this.height = height;

		const node = this.node;
		node.width = this.width * this.tileWidth;
		node.height = this.height * this.tileWidth;

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

		this.tileWidth = glyphs.width / 16;
		this.tileHeight = glyphs.height / 16;
		this.resize(this.width, this.height);

		gl.uniform2uiv(uniforms["tileSize"], [this.tileWidth, this.tileHeight]);
		this._uploadGlyphs(glyphs);
	}

  draw(x: number, y: number, glyph: number, fg: number, bg: number) {
      let index = y * this.width + x;
      index *= VERTICES_PER_TILE;
			glyph = glyph & 0xFF;
			bg = bg & 0xFFF;
			fg = fg & 0xFFF;
      const style = (glyph << 24) + (bg << 12) + fg;
      this._data[index + 2] = style;
      this._data[index + 5] = style;
      this._requestDraw();
  }
	
  _initGL(node?: HTMLCanvasElement|string) {
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
  _createGeometry() {
      const gl = this._gl;
      this._buffers.position && gl.deleteBuffer(this._buffers.position);
      this._buffers.uv && gl.deleteBuffer(this._buffers.uv);
      let buffers = createGeometry(gl, this._attribs, this.width, this.height);
      Object.assign(this._buffers, buffers);
  }
	
  _createData() {
      const gl = this._gl;
      const attribs = this._attribs;
			const tileCount = this.width * this.height;
      this._buffers.style && gl.deleteBuffer(this._buffers.style);
      this._data = new Uint32Array(tileCount * VERTICES_PER_TILE);
      const style = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, style);
      gl.vertexAttribIPointer(attribs["style"], 1, gl.UNSIGNED_INT, 0, 0);
      Object.assign(this._buffers, { style });
  }
  _requestDraw() {
      if (this._drawRequested) {
          return;
      }
      this._drawRequested = true;
      requestAnimationFrame(() => this._draw());
  }
  _draw() {
      const gl = this._gl;
      this._drawRequested = false;
      gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.style!);
      gl.bufferData(gl.ARRAY_BUFFER, this._data, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, this.width * this.height * VERTICES_PER_TILE);
  }
  _uploadGlyphs(pixels: TexImageSource) {
      const gl = this._gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._glyphs);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      this._requestDraw();
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
