export interface Options {
    width: number;
    height: number;
    glyphs?: TexImageSource;
    node?: HTMLCanvasElement;
}
export default class Scene {
    private _gl;
    private _data;
    private _buffers;
    private _attribs;
    private _uniforms;
    private _drawRequested;
    private _glyphs;
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    constructor(options: Options);
    get node(): HTMLCanvasElement | OffscreenCanvas;
    private _configure;
    resize(width: number, height: number): void;
    updateGlyphs(glyphs: TexImageSource): void;
    draw(x: number, y: number, glyph: number, fg: number, bg: number): void;
    _initGL(node?: HTMLCanvasElement): WebGL2RenderingContext;
    _createGeometry(): void;
    _createData(): void;
    _requestDraw(): void;
    _draw(): void;
    _uploadGlyphs(pixels: TexImageSource): void;
}
