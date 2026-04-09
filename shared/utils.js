// ============================================================
//  MathAnim — 全局注册表 + 公共组件库
//
//  组件索引（按规范：新增组件必须在此登记）：
//    NumberLine      数轴，可缩放，可拖拽标记
//    GridSquare      网格正方形，可切割，可点击选中
//    FractionDisplay 分数显示，支持过渡
//    DecimalDisplay  小数显示，小数点位置可动
//    Arrow           带标注的箭头
//    ScaleIndicator  ×10 / ÷10 缩放指示器
// ============================================================

window.MathAnim = {
  _modules: {},
  register(key, mod) { this._modules[key] = mod; },
  getModule(key)     { return this._modules[key]; },
};

// ---- CSS 变量读取（统一入口，禁止在组件内硬编码颜色） ----
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ---- 工具函数 ----
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// 读 CSS 变量并解析为 [r,g,b]（CSS 变量应为 #rrggbb 格式）
function cssRgb(varName) {
  return hexToRgb(cssVar(varName));
}

MathAnim.cssVar  = cssVar;
MathAnim.cssRgb  = cssRgb;
MathAnim.hexToRgb = hexToRgb;

// ============================================================
//  NumberLine
//  数轴组件，支持：自定义范围、刻度动画、可拖拽标记
// ============================================================
class NumberLine {
  /**
   * config:
   *   x, y, width          — 位置与宽度
   *   start, end           — 显示范围（默认 0-1）
   *   ticks                — 刻度数（默认 10；0=不显示）
   *   tickAlpha            — 刻度透明度 0-255（GSAP 动画目标）
   *   showLabels           — 是否显示刻度标签
   *   labelStep            — 每隔几个刻度显示标签（1=全部，5=稀疏）
   *   markerValue          — 标记点的值（null=不显示）
   *   markerAlpha          — 标记透明度 0-255（GSAP 动画目标）
   *   isDraggable          — 是否支持拖拽
   *   onMarkerChange       — 标记值变化回调 (value) => {}
   */
  constructor(p, config = {}) {
    this.p           = p;
    this.x           = config.x          ?? 60;
    this.y           = config.y          ?? 300;
    this.width       = config.width      ?? 500;
    this.start       = config.start      ?? 0;
    this.end         = config.end        ?? 1;
    this.ticks       = config.ticks      ?? 10;
    this.tickAlpha   = config.tickAlpha  ?? 255;
    this.showLabels  = config.showLabels !== false;
    this.labelStep   = config.labelStep  ?? 1;
    this.markerValue = config.markerValue ?? null;
    this.markerAlpha = config.markerAlpha ?? 255;
    this.isDraggable = config.isDraggable ?? false;
    this.onMarkerChange = config.onMarkerChange ?? null;
    this._dragging   = false;
  }

  setMarker(v)  { this.markerValue = v; }

  // 拖拽交互（在 p.mousePressed / touchStarted 中调用）
  handlePress(mx, my) {
    if (!this.isDraggable || this.markerValue === null) return false;
    const near = Math.abs(my - this.y) < 24 && mx >= this.x - 10 && mx <= this.x + this.width + 10;
    if (near) { this._dragging = true; this._updateMarker(mx); return true; }
    return false;
  }
  handleDrag(mx) { if (this._dragging) this._updateMarker(mx); }
  handleRelease() { this._dragging = false; }

  _updateMarker(mx) {
    const t    = Math.max(0, Math.min(1, (mx - this.x) / this.width));
    const raw  = this.start + t * (this.end - this.start);
    const range = this.end - this.start;
    // 吸附精度：范围越小精度越高
    const snap = range <= 0.15 ? 0.01 : 0.1;
    const val  = Math.round(raw / snap) * snap;
    this.markerValue = Math.max(this.start, Math.min(this.end, val));
    if (this.onMarkerChange) this.onMarkerChange(this.markerValue);
  }

  draw() {
    const { p, x, y, width, start, end, ticks, tickAlpha, markerValue, markerAlpha } = this;
    const [ar, ag, ab] = cssRgb('--color-axis');
    const range = end - start;

    p.push();

    // 主轴
    p.stroke(ar, ag, ab);
    p.strokeWeight(2.5);
    p.line(x, y, x + width, y);

    // 箭头
    p.fill(ar, ag, ab);
    p.noStroke();
    p.triangle(x + width + 10, y, x + width, y - 5, x + width, y + 5);

    // 端点大刻度（始终显示）
    this._drawTick(x,         y, 12, start.toFixed(range < 0.15 ? 2 : 1), 255);
    this._drawTick(x + width, y, 12, end.toFixed(range < 0.15 ? 2 : 1),   255);

    // 内部刻度（受 tickAlpha 控制）
    if (ticks > 0 && tickAlpha > 0) {
      for (let i = 1; i < ticks; i++) {
        const tx     = x + (i / ticks) * width;
        const val    = start + (i / ticks) * range;
        const digits = range < 0.15 ? 2 : 1;
        const label  = (i % this.labelStep === 0) ? val.toFixed(digits) : null;
        this._drawTick(tx, y, 8, label, tickAlpha);
      }
    }

    // 标记点
    if (markerValue !== null && markerAlpha > 0) {
      const mx = x + ((markerValue - start) / range) * width;
      if (mx >= x - 2 && mx <= x + width + 2) {
        const [mr, mg, mb] = cssRgb('--color-marker');
        p.noStroke();
        p.fill(mr, mg, mb, markerAlpha * 0.2);
        p.circle(mx, y, 28);
        p.fill(mr, mg, mb, markerAlpha);
        p.circle(mx, y, 15);
      }
    }

    p.pop();
  }

  _drawTick(tx, ty, h, label, alpha) {
    const [ar, ag, ab] = cssRgb('--color-axis');
    this.p.stroke(ar, ag, ab, alpha);
    this.p.strokeWeight(1.5);
    this.p.line(tx, ty - h, tx, ty + h);
    if (label && alpha > 30) {
      this.p.noStroke();
      this.p.fill(ar, ag, ab, alpha);
      this.p.textAlign(this.p.CENTER, this.p.TOP);
      this.p.textSize(11);
      this.p.text(label, tx, ty + h + 4);
    }
  }
}

// ============================================================
//  GridSquare
//  网格正方形，可切割，可点击选中格子
// ============================================================
class GridSquare {
  /**
   * config:
   *   x, y, size           — 左上角坐标与边长（正方形）
   *   rows, cols           — 行列数（默认 10×1）
   *   color                — 未选中格子填充色（CSS 变量名或 #hex）
   *   selectedColor        — 选中格子填充色
   *   borderColor          — 边框与切割线颜色
   *   cutProgress          — 切割进度 0-1（GSAP 动画目标）
   *   onClick              — 点击回调 (cellIndex, selectedSet) => {}
   *   showCellLabels       — 是否在格心显示序号（百格图建议 false，避免拥挤）
   */
  constructor(p, config = {}) {
    this.p            = p;
    this.x            = config.x    ?? 50;
    this.y            = config.y    ?? 50;
    this.size         = config.size ?? 280;
    this.rows         = config.rows ?? 10;
    this.cols         = config.cols ?? 1;
    this.color        = config.color        ?? '--color-whole';
    this.selectedColor = config.selectedColor ?? '--color-highlight';
    this.borderColor  = config.borderColor  ?? '--color-whole-border';
    this.cutProgress  = config.cutProgress  ?? 0;
    this.onClick      = config.onClick      ?? null;
    this.showCellLabels = config.showCellLabels !== false;
    this.selected     = new Set();
    this._cellAlphas  = {};   // idx → alpha 0-215，供外部 GSAP 驱动选中淡入
    this._cw          = this.size / this.cols;
    this._ch          = this.size / this.rows;
  }

  /** 切换行列数（如 10×1 → 10×10），会清空选中 */
  setGrid(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.selected.clear();
    this._cellAlphas = {};
    this._cw = this.size / this.cols;
    this._ch = this.size / this.rows;
  }

  resize(x, y, size) {
    this.x = x; this.y = y; this.size = size;
    this._cw = size / this.cols;
    this._ch = size / this.rows;
  }

  getSelectedCount() { return this.selected.size; }

  // 处理点击，返回被点击的格子序号（-1=未命中）
  // 选中时把 _cellAlphas[idx] 置 0，由外部 GSAP 驱动淡入到 215
  handleClick(mx, my) {
    if (this.cutProgress < 0.95) return -1;
    if (mx < this.x || mx > this.x + this.size || my < this.y || my > this.y + this.size) return -1;
    const col = Math.min(Math.floor((mx - this.x) / this._cw), this.cols - 1);
    const row = Math.min(Math.floor((my - this.y) / this._ch), this.rows - 1);
    const idx = row * this.cols + col;
    if (this.selected.has(idx)) {
      this.selected.delete(idx);
      delete this._cellAlphas[idx];
    } else {
      this.selected.add(idx);
      this._cellAlphas[idx] = 0;   // 外部将其 tween 到 215
    }
    if (this.onClick) this.onClick(idx, this.selected);
    return idx;
  }

  reset() { this.selected.clear(); this._cellAlphas = {}; this.cutProgress = 0; }

  draw() {
    const { p, x, y, size, rows, cols, cutProgress } = this;
    const cw = this._cw, ch = this._ch;
    const [br, bg, bb] = this._clr(this.borderColor);
    const [fr, fg, fb] = this._clr(this.color);
    const [sr, sg, sb] = this._clr(this.selectedColor);

    p.push();

    // --- 格子填充 ---
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const cx  = x + c * cw;
        const cy  = y + r * ch;
        p.noStroke();
        if (this.selected.has(idx)) {
          // 使用 _cellAlphas 驱动淡入效果，默认 215
          p.fill(sr, sg, sb, Math.round(this._cellAlphas[idx] ?? 215));
        } else {
          p.fill(fr, fg, fb);
        }
        p.rect(cx + 1, cy + 1, cw - 2, ch - 2, 2);
      }
    }

    // --- 切割线（从左向右生长，刀切动画） ---
    if (cutProgress > 0) {
      p.stroke(br, bg, bb, 170);
      p.strokeWeight(1.5);
      // 水平分隔线
      for (let r = 1; r < rows; r++) {
        const ly = y + r * ch;
        p.line(x, ly, x + size * cutProgress, ly);
      }
      // 垂直分隔线
      for (let c = 1; c < cols; c++) {
        const lx = x + c * cw;
        p.line(lx, y, lx, y + size * cutProgress);
      }
    }

    // --- 外框 ---
    p.noFill();
    p.stroke(br, bg, bb);
    p.strokeWeight(3);
    p.rect(x, y, size, size, 3);

    // --- 切割前：正中央显示 "1" ---
    if (cutProgress < 0.05) {
      p.noStroke();
      p.fill(br, bg, bb, 200);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(size * 0.22);
      p.textStyle(p.BOLD);
      p.text('1', x + size / 2, y + size / 2);
      p.textStyle(p.NORMAL);
    }

    // --- 切割后：格子序号（百格图可关闭以保清晰） ---
    if (cutProgress > 0.95 && this.showCellLabels) {
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.max(10, Math.min(14, cw * 0.4, ch * 0.4)));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          p.noStroke();
          p.fill(this.selected.has(idx) ? [255, 255, 255, 220] : [br, bg, bb, 120]);
          p.text(idx + 1, x + c * cw + cw / 2, y + r * ch + ch / 2);
        }
      }
    }

    p.pop();
  }

  // 解析颜色：支持 '--css-var' 或 '#hex'
  _clr(val) {
    if (val.startsWith('--')) return cssRgb(val);
    return hexToRgb(val);
  }
}

// ============================================================
//  FractionDisplay
//  分数显示（竖式分数）
// ============================================================
class FractionDisplay {
  /**
   * config:
   *   x, y              — 中心坐标
   *   numerator         — 分子
   *   denominator       — 分母
   *   color             — CSS 变量名或 #hex
   *   size              — 缩放系数（1=默认）
   *   alpha             — 透明度 0-255
   */
  constructor(p, config = {}) {
    this.p           = p;
    this.x           = config.x           ?? 200;
    this.y           = config.y           ?? 200;
    this.numerator   = config.numerator   ?? 0;
    this.denominator = config.denominator ?? 10;
    this.color       = config.color       ?? '--color-fraction';
    this.size        = config.size        ?? 1;
    this.alpha       = config.alpha       ?? 255;
  }

  draw() {
    const { p, size, alpha } = this;
    const [r, g, b] = this._clr();
    const numSz = Math.round(30 * size);
    const barW  = Math.round(48 * size);

    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    p.fill(r, g, b, alpha);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(numSz);
    p.text(this.numerator, 0, -4);
    p.stroke(r, g, b, alpha);
    p.strokeWeight(2.5);
    p.line(-barW / 2, 0, barW / 2, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.text(this.denominator, 0, 4);
    p.textStyle(p.NORMAL);
    p.pop();
  }

  _clr() {
    return this.color.startsWith('--') ? cssRgb(this.color) : hexToRgb(this.color);
  }
}

// ============================================================
//  DecimalDisplay
//  小数显示，支持动画高亮特定小数位
// ============================================================
class DecimalDisplay {
  /**
   * config:
   *   x, y              — 中心坐标
   *   value             — 小数值
   *   highlightDigit    — 高亮第几位（1=十分位，2=百分位，null=不高亮）
   *   color             — CSS 变量名或 #hex
   *   size              — 缩放系数
   *   alpha             — 透明度 0-255
   */
  constructor(p, config = {}) {
    this.p              = p;
    this.x              = config.x              ?? 350;
    this.y              = config.y              ?? 200;
    this.value          = config.value          ?? 0;
    this.highlightDigit = config.highlightDigit ?? null;
    this.color          = config.color          ?? '--color-decimal';
    this.size           = config.size           ?? 1;
    this.alpha          = config.alpha          ?? 255;
  }

  draw() {
    const { p, size, alpha } = this;
    const [r, g, b] = this._clr();

    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    p.fill(r, g, b, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(Math.round(44 * size));
    p.textStyle(p.BOLD);
    p.text(this.value.toFixed(this.highlightDigit === 2 ? 2 : 1), 0, 0);
    p.textStyle(p.NORMAL);
    p.pop();
  }

  _clr() {
    return this.color.startsWith('--') ? cssRgb(this.color) : hexToRgb(this.color);
  }
}

// ============================================================
//  Arrow
//  带标注的箭头
// ============================================================
class Arrow {
  /**
   * from, to  — {x, y}
   * label     — 字符串
   * config:
   *   color, headSize, strokeW, labelOffset, alpha
   */
  constructor(p, from, to, label = '', config = {}) {
    this.p      = p;
    this.from   = from;
    this.to     = to;
    this.label  = label;
    this.color  = config.color  ?? '--color-axis';
    this.headSize    = config.headSize    ?? 8;
    this.strokeW     = config.strokeW     ?? 2;
    this.labelOffset = config.labelOffset ?? { x: 0, y: -14 };
    this.alpha  = config.alpha  ?? 255;
  }

  draw() {
    const { p, from, to, label, alpha } = this;
    const [r, g, b] = this.color.startsWith('--') ? cssRgb(this.color) : hexToRgb(this.color);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const h = this.headSize;

    p.push();
    p.stroke(r, g, b, alpha);
    p.strokeWeight(this.strokeW);
    p.line(from.x, from.y, to.x, to.y);

    p.fill(r, g, b, alpha);
    p.noStroke();
    p.push();
    p.translate(to.x, to.y);
    p.rotate(angle);
    p.triangle(0, 0, -h, -h / 2, -h, h / 2);
    p.pop();

    if (label) {
      const mx = (from.x + to.x) / 2 + this.labelOffset.x;
      const my = (from.y + to.y) / 2 + this.labelOffset.y;
      p.noStroke();
      p.fill(r, g, b, alpha);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text(label, mx, my);
    }
    p.pop();
  }
}

// ============================================================
//  ScaleIndicator
//  ×10 / ÷10 放大缩小徽章
// ============================================================
class ScaleIndicator {
  /**
   * config:
   *   x, y          — 中心坐标
   *   multiplier    — 10 = ×10，0.1 = ÷10，100 = ×100
   *   alpha         — 透明度 0-255
   *   visible       — boolean
   */
  constructor(p, config = {}) {
    this.p          = p;
    this.x          = config.x          ?? 200;
    this.y          = config.y          ?? 100;
    this.multiplier = config.multiplier ?? 10;
    this.alpha      = config.alpha      ?? 255;
    this.visible    = config.visible    !== false;
  }

  draw() {
    if (!this.visible || this.alpha <= 0) return;
    const { p, x, y, multiplier, alpha } = this;
    const label = multiplier >= 1 ? `×${multiplier}` : `÷${Math.round(1 / multiplier)}`;
    const [r, g, b] = cssRgb('--color-marker');

    p.push();
    p.noStroke();
    p.fill(r, g, b, alpha * 0.15);
    p.rect(x - 34, y - 18, 68, 36, 8);
    p.fill(r, g, b, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(17);
    p.textStyle(p.BOLD);
    p.text(label, x, y);
    p.textStyle(p.NORMAL);
    p.pop();
  }
}

// ---- 挂载到 MathAnim 命名空间 ----
MathAnim.NumberLine      = NumberLine;
MathAnim.GridSquare      = GridSquare;
MathAnim.FractionDisplay = FractionDisplay;
MathAnim.DecimalDisplay  = DecimalDisplay;
MathAnim.Arrow           = Arrow;
MathAnim.ScaleIndicator  = ScaleIndicator;
