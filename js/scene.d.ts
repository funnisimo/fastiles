declare type Vec2 = [number, number];
export interface Options {
    tileCount: Vec2;
    tileSize: Vec2;
    glyphs: TexImageSource;
    node?: HTMLCanvasElement;
}
export default class Scene {
    private _gl;
    private _data;
    private _buffers;
    private _attribs;
    private _uniforms;
    private _drawRequested;
    private _tileCount;
    private _glyphs;
    constructor(options: Options);
    get node(): HTMLCanvasElement | OffscreenCanvas;
    configure(options: Options): void;
    draw(x: number, y: number, glyph: number, fg: number, bg: number): void;
    _initGL(node?: HTMLCanvasElement): WebGL2RenderingContext;
    _createGeometry(size: Vec2): void;
    _createData(tileCount: number): void;
    _requestDraw(): void;
    _draw(): void;
    _uploadGlyphs(pixels: TexImageSource): void;
}
export {};
