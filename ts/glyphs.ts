

type CTX = CanvasRenderingContext2D;
type DrawFunction = (ctx: CTX, x: number, y: number, width: number, height: number) => void;
type DrawType = string|DrawFunction;
type CustomGlyphs = Record<number, DrawType>;

interface GlyphOptions {
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
  public node!: HTMLCanvasElement;
  public ctx!: CanvasRenderingContext2D;
  public width: number=16;
  public height: number=16;
  public tileWidth: number=12;
  public tileHeight: number=16;
  private _map: Record<string,number>={};
  
	constructor(opts: Partial<GlyphOptions>={}) {
		opts.font = opts.font || 'monospace';
    opts.basic = opts.basic || false;
    
		this._configure(opts as GlyphOptions);
    this._initGlyphs(opts.glyphs, opts.basic);
  }
  
  private _configure(opts: GlyphOptions) {
		this.node = opts.node || document.createElement('canvas');
    this.tileWidth = opts.tileWidth || opts.width || this.tileWidth;
    this.tileHeight = opts.tileHeight || opts.height || this.tileHeight;
    
    this.node.width = this.width * this.tileWidth;
    this.node.height = this.height * this.tileHeight;

    this.ctx = this.node.getContext('2d') as CanvasRenderingContext2D;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.pxWidth, this.pxHeight);
    
    const size = opts.fontSize || opts.size || Math.max(this.tileWidth, this.tileHeight);
    this.ctx.font = '' + size + 'px ' + opts.font;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = 'white';
	}
  
  draw(n: number, ch: DrawType) {
  	const x = (n % this.width) * this.tileWidth;
    const y = Math.floor(n / this.width) * this.tileHeight;
    const cx = x + Math.floor(this.tileWidth/2);
    const cy = y + Math.floor(this.tileHeight/2);

		this.ctx.save(); // save the context

		this.ctx.beginPath();
    this.ctx.rect(x, y, this.tileWidth, this.tileHeight);
    this.ctx.clip();

		if (typeof ch === 'function') {
    	ch(this.ctx, x, y, this.tileWidth, this.tileHeight);
    }
    else {
    	this._map[ch] = n;
	    this.ctx.fillText(ch, cx, cy);
    }

		this.ctx.restore(); // restore the context
	}
  
  _initGlyphs(glyphs: Record<number,DrawType>={}, basicOnly=false) {

    for(let i = 32; i < 127; ++i) {
      this.draw(i, glyphs[i] || String.fromCharCode(i));
    }

		if (basicOnly) {
    	if (Array.isArray(glyphs)) {
      	glyphs.forEach( (ch, i) => this.draw(i, ch) );
      }
      else {
      	Object.entries(glyphs).forEach( ([i,ch]) => this.draw(Number.parseInt(i), ch) );
      }
   	}
    else {

      [' ', '\u263a', '\u263b', '\u2665', '\u2666', '\u2663', '\u2660', '\u263c', 
      '\u2600', '\u2605', '\u2606', '\u2642', '\u2640', '\u266a', '\u266b', '\u2638',
      '\u25b6', '\u25c0', '\u2195', '\u203c', '\u204b', '\u262f', '\u2318', '\u2616',
      '\u2191', '\u2193', '\u2192', '\u2190', '\u2126', '\u2194', '\u25b2', '\u25bc',
      ].forEach( (ch, i) => {
        this.draw(i, glyphs[i] || ch);
      });

      [
      '\u2302',
      '\u2b09', '\u272a', '\u2718', '\u2610', '\u2611', '\u25ef', '\u25ce', '\u2690',
      '\u2691', '\u2598', '\u2596', '\u259d', '\u2597', '\u2744', '\u272d', '\u2727',
      '\u25e3', '\u25e4', '\u25e2', '\u25e5', '\u25a8', '\u25a7', '\u259a', '\u265f',
      '\u265c', '\u265e', '\u265d', '\u265b', '\u265a', '\u301c', '\u2694', '\u2692',
      '\u25b6', '\u25bc', '\u25c0', '\u25b2', '\u25a4', '\u25a5', '\u25a6', '\u257a',
      '\u257b', '\u2578', '\u2579', '\u2581', '\u2594', '\u258f', '\u2595', '\u272d',
      '\u2591', '\u2592', '\u2593', '\u2503', '\u252b', '\u2561', '\u2562', '\u2556',
      '\u2555', '\u2563', '\u2551', '\u2557', '\u255d', '\u255c', '\u255b', '\u2513',
      '\u2517', '\u253b', '\u2533', '\u2523', '\u2501', '\u254b', '\u255e', '\u255f',
      '\u255a', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256c', '\u2567',
      '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256b',
      '\u256a', '\u251b', '\u250f', '\u2588', '\u2585', '\u258c', '\u2590', '\u2580',
      '\u03b1', '\u03b2', '\u0393', '\u03c0', '\u03a3', '\u03c3', '\u03bc', '\u03c4',
      '\u03a6', '\u03b8', '\u03a9', '\u03b4', '\u221e', '\u03b8', '\u03b5', '\u03b7',
      '\u039e', '\u00b1', '\u2265', '\u2264', '\u2234', '\u2237', '\u00f7', '\u2248',
      '\u22c4', '\u22c5', '\u2217', '\u27b5', '\u2620', '\u2625', '\u25fc', '\u25fb'
      ].forEach( (ch, i) => {
        this.draw(i + 127, glyphs[i] || ch); 
      });

    }
  
  }
  
  toIndex(ch: string) { return this._map[ch] || -1; }
  
  get pxWidth() { return this.node.width; }
  get pxHeight() { return this.node.height; }
}
