import Palette from "./palette.js";
declare type Vec2 = [number, number];
export interface Options {
    tileCount: Vec2;
    tileSize: Vec2;
    font: TexImageSource;
    render: boolean;
}
export default class Scene {
    private _gl;
    private _tileCount;
    private _palette;
    private _data;
    private _buffers;
    private _textures;
    private _attribs;
    private _uniforms;
    private _drawRequested;
    private _externalRender;
    constructor(options: Options, palette?: Palette);
    get node(): HTMLCanvasElement;
    configure(options: Partial<Options>): void;
    get palette(): Palette;
    set palette(palette: Palette);
    draw(position: Vec2, glyph: number, fg: number, bg: number): void;
    uploadPaletteData(data: HTMLCanvasElement): void;
    private _initGL;
    private _createGeometry;
    private _createData;
    private _requestRender;
    render(): boolean;
    private _uploadFont;
}
export {};
