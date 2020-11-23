export interface Options {
    width: number;
    height: number;
    glyphs?: TexImageSource;
    node?: HTMLCanvasElement | string;
}
export default class Canvas {
    private _gl;
    private _data;
    private _buffers;
    private _attribs;
    private _uniforms;
    private _renderRequested;
    private _glyphs;
    private _width;
    private _height;
    private _tileWidth;
    private _tileHeight;
    constructor(options: Options | HTMLCanvasElement);
    get node(): HTMLCanvasElement | OffscreenCanvas;
    get width(): number;
    get height(): number;
    get tileWidth(): number;
    get tileHeight(): number;
    private _configure;
    resize(width: number, height: number): void;
    updateGlyphs(glyphs: TexImageSource): void;
    draw(x: number, y: number, glyph: number, fg: number, bg: number): void;
    private _initGL;
    private _createGeometry;
    private _createData;
    private _requestRender;
    private _render;
    private _uploadGlyphs;
}
