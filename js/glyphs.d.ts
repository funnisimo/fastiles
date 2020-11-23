declare type CTX = CanvasRenderingContext2D;
declare type DrawFunction = (ctx: CTX, x: number, y: number, width: number, height: number) => void;
declare type DrawType = string | DrawFunction;
declare type CustomGlyphs = Record<number, DrawType>;
interface GlyphOptions {
    font: string;
    fontSize?: number;
    tileSize: number[];
    glyphs?: CustomGlyphs;
    basic: boolean;
    node?: HTMLCanvasElement;
}
export default class Glyphs {
    node: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    private _map;
    constructor(opts?: Partial<GlyphOptions>);
    private _configure;
    draw(n: number, ch: DrawType): void;
    _initGlyphs(glyphs?: Record<number, DrawType>, basicOnly?: boolean): void;
    toIndex(ch: string): number;
    get pxWidth(): number;
    get pxHeight(): number;
}
export {};
