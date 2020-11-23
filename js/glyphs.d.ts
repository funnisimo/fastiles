declare type CTX = CanvasRenderingContext2D;
declare type DrawFunction = (ctx: CTX, x: number, y: number, width: number, height: number) => void;
declare type DrawType = string | DrawFunction;
declare type CustomGlyphs = Record<number, DrawType>;
export interface Options {
    font: string;
    fontSize: number;
    size: number;
    width: number;
    tileWidth: number;
    height: number;
    tileHeight: number;
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
    constructor(opts?: Partial<Options>);
    private _configure;
    draw(n: number, ch: DrawType): void;
    _initGlyphs(glyphs?: Record<number, DrawType>, basicOnly?: boolean): void;
    toIndex(ch: string): number;
    get pxWidth(): number;
    get pxHeight(): number;
}
export {};
