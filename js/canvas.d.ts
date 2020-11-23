import Glyphs from './glyphs.js';
export interface Options {
    width: number;
    height: number;
    tileWidth?: number;
    tileHeight?: number;
    glyphs?: HTMLImageElement | Glyphs | string;
    node?: HTMLCanvasElement | string;
    render?: boolean;
}
export default class Canvas {
    private _gl;
    private _data;
    private _buffers;
    private _attribs;
    private _uniforms;
    private _renderRequested;
    private _texture;
    private _glyphs;
    private _autoRender;
    private _width;
    private _height;
    private _tileWidth;
    private _tileHeight;
    constructor(options: Options | HTMLCanvasElement | string);
    get node(): HTMLCanvasElement | OffscreenCanvas;
    get width(): number;
    get height(): number;
    get tileWidth(): number;
    get tileHeight(): number;
    get pxWidth(): number;
    get pxHeight(): number;
    private _configure;
    resize(width: number, height: number): void;
    get glyphs(): Glyphs | HTMLImageElement | string;
    set glyphs(glyphs: Glyphs | HTMLImageElement | string);
    draw(x: number, y: number, glyph: number, fg: number, bg: number): void;
    private _initGL;
    private _createGeometry;
    private _createData;
    private _requestRender;
    private _render;
    private _uploadGlyphs;
}
