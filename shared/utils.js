// ============================================================
//  MathAnim — Global registry + shared component library
// ============================================================

window.MathAnim = {
  _modules: {},

  register(key, module) { this._modules[key] = module; },
  getModule(key)        { return this._modules[key]; },
};

// ---- Color palette (shared across all animations) ----------
MathAnim.Colors = {
  // UI
  primary:      '#3498db',
  primaryDark:  '#2176ae',
  primaryLight: '#aed6f1',
  accent:       '#e74c3c',
  accentLight:  '#f5b7b1',
  success:      '#27ae60',
  warning:      '#f39c12',
  // Canvas
  wholeFill:    '#ddeeff',
  wholeBorder:  '#1565C0',
  highlight:    '#FF7043',
  highlightFg:  '#ffffff',
  numberLine:   '#2c3e50',
  markerFill:   '#e74c3c',
  fractionClr:  '#1565C0',
  decimalClr:   '#c0392b',
  textDark:     '#2d3748',
  textMuted:    '#718096',
};

// ============================================================
//  NumberLine
//  Draws a 0→1 number line with optional tick labels and
//  an animated value marker.
// ============================================================
class NumberLine {
  /**
   * @param {p5}     p
   * @param {object} opts
   *   x, y        — left anchor
   *   width       — total pixel width
   *   min, max    — value range (default 0–1)
   *   ticks       — number of subdivisions (default 10)
   *   showLabels  — boolean (default true)
   *   labelStep   — show a label every N ticks (default 1 = all; 5 = 0, 0.5, 1 only)
   *   markerValue — null or number
   */
  constructor(p, opts = {}) {
    this.p     = p;
    this.x     = opts.x     ?? 60;
    this.y     = opts.y     ?? 320;
    this.width = opts.width ?? 500;
    this.min   = opts.min   ?? 0;
    this.max   = opts.max   ?? 1;
    this.ticks = opts.ticks ?? 10;
    this.showLabels  = opts.showLabels  !== false;
    this.labelStep   = opts.labelStep   ?? 1;
    this.markerValue = opts.markerValue ?? null;
  }

  setMarker(v) { this.markerValue = v; }

  draw() {
    const { p, x, y, width, min, max, ticks } = this;
    const range = max - min;

    // Main axis
    p.push();
    p.strokeWeight(2.5);
    p.stroke(50);
    p.line(x, y, x + width, y);

    // Arrowhead
    p.fill(50);
    p.noStroke();
    p.triangle(x + width + 10, y,
               x + width - 2,  y - 5,
               x + width - 2,  y + 5);

    // Ticks & labels
    for (let i = 0; i <= ticks; i++) {
      const tx    = x + (i / ticks) * width;
      const big   = (i === 0 || i === ticks);
      const tickH = big ? 11 : 7;
      const showLabel = this.showLabels && (i % this.labelStep === 0 || i === ticks);

      p.stroke(70);
      p.strokeWeight(big ? 2 : 1.2);
      p.line(tx, y - tickH, tx, y + tickH);

      if (showLabel) {
        p.noStroke();
        p.fill(90);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(11);
        const label = i === 0 ? '0' : i === ticks ? '1' : `0.${i}`;
        p.text(label, tx, y + 14);
      }
    }

    // Marker
    if (this.markerValue !== null) {
      const mx = x + ((this.markerValue - min) / range) * width;

      // Glow ring
      p.noStroke();
      p.fill(231, 76, 60, 50);
      p.circle(mx, y, 26);

      // Dot
      p.fill(231, 76, 60);
      p.circle(mx, y, 14);

      // Value label above
      p.fill(192, 57, 43);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(15);
      p.textStyle(p.BOLD);
      p.text(this.markerValue.toFixed(1), mx, y - 16);
      p.textStyle(p.NORMAL);
    }

    p.pop();
  }
}

// ============================================================
//  FractionDisplay
//  Renders  n / d  as a proper stacked fraction.
// ============================================================
class FractionDisplay {
  constructor(p, opts = {}) {
    this.p           = p;
    this.x           = opts.x           ?? 120;
    this.y           = opts.y           ?? 240;
    this.numerator   = opts.numerator   ?? 1;
    this.denominator = opts.denominator ?? 10;
    this.size        = opts.size        ?? 1;
    this.color       = opts.color       ?? MathAnim.Colors.fractionClr;
    this.alpha       = opts.alpha       ?? 255;
  }

  draw() {
    const { p, size, alpha } = this;
    const [r, g, b] = hexToRgb(this.color);
    const numSz = 32 * size;
    const lineW = 52 * size;

    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    p.fill(r, g, b, alpha);
    p.textStyle(p.BOLD);

    // Numerator
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(numSz);
    p.text(this.numerator, 0, -5);

    // Bar
    p.stroke(r, g, b, alpha);
    p.strokeWeight(2.5);
    p.line(-lineW / 2, 0, lineW / 2, 0);

    // Denominator
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(numSz);
    p.text(this.denominator, 0, 5);

    p.textStyle(p.NORMAL);
    p.pop();
  }
}

// ============================================================
//  DecimalDisplay
//  Renders a decimal value, large and optionally with a label.
// ============================================================
class DecimalDisplay {
  constructor(p, opts = {}) {
    this.p      = p;
    this.x      = opts.x     ?? 400;
    this.y      = opts.y     ?? 240;
    this.value  = opts.value ?? 0;
    this.size   = opts.size  ?? 1;
    this.color  = opts.color ?? MathAnim.Colors.decimalClr;
    this.label  = opts.label ?? null;
    this.alpha  = opts.alpha ?? 255;
  }

  draw() {
    const { p, size, alpha } = this;
    const [r, g, b] = hexToRgb(this.color);

    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    p.fill(r, g, b, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(42 * size);
    p.textStyle(p.BOLD);
    p.text(this.value.toFixed(1), 0, 0);
    p.textStyle(p.NORMAL);

    if (this.label) {
      p.fill(r, g, b, alpha * 0.65);
      p.textSize(13 * size);
      p.text(this.label, 0, 28 * size);
    }
    p.pop();
  }
}

// ============================================================
//  Grid
//  Draws a coordinate grid on the canvas.
// ============================================================
class Grid {
  constructor(p, opts = {}) {
    this.p        = p;
    this.x        = opts.x        ?? 0;
    this.y        = opts.y        ?? 0;
    this.width    = opts.width    ?? 400;
    this.height   = opts.height   ?? 400;
    this.cellSize = opts.cellSize ?? 40;
    this.color    = opts.color    ?? '#cccccc';
    this.axes     = opts.axes     !== false;
  }

  draw() {
    const { p, x, y, width, height, cellSize } = this;
    const [r, g, b] = hexToRgb(this.color);

    p.push();
    p.stroke(r, g, b);
    p.strokeWeight(1);

    // Vertical lines
    for (let cx = x; cx <= x + width; cx += cellSize) {
      p.line(cx, y, cx, y + height);
    }
    // Horizontal lines
    for (let cy = y; cy <= y + height; cy += cellSize) {
      p.line(x, cy, x + width, cy);
    }

    // Axes
    if (this.axes) {
      const ox = x + width / 2;
      const oy = y + height / 2;
      p.stroke(80);
      p.strokeWeight(2);
      p.line(x, oy, x + width, oy);
      p.line(ox, y, ox, y + height);
    }

    p.pop();
  }
}

// ---- Helper ------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Export to MathAnim namespace
MathAnim.NumberLine     = NumberLine;
MathAnim.FractionDisplay = FractionDisplay;
MathAnim.DecimalDisplay  = DecimalDisplay;
MathAnim.Grid            = Grid;
MathAnim.hexToRgb        = hexToRgb;
