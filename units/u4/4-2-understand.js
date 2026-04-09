// ============================================================
//  4-2 小数核心动画（理解）
//  阶段：切 10 份 -> 再切 1 份成 10 个 0.01 并合并 -> 命名数位
// ============================================================

MathAnim.register('u4/4-2', {
  sketch: null,

  init(canvasEl, controlsEl, descEl) {
    function bindTap(el, handler) {
      if (!el) return;
      let lastTouchTs = 0;
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        lastTouchTs = Date.now();
        handler(e);
      }, { passive: false });
      el.addEventListener('click', (e) => {
        if (Date.now() - lastTouchTs < 500) return;
        handler(e);
      });
    }

    const state = {
      phase: 'idle', // idle -> cut10 -> cut100 -> naming
      splitLines: 0, // 0..9
      gap: 0,
      selectedTenths: -1,

      drawerOpen: 0,
      hundredLit: 0,
      mergeCompress: 0,
      mergeRebound: 0,
      mergeLift: 0,
      mergeFlash: 0,
      mergeImpact: 0,
      mergeMsgAlpha: 0,
      merging: false,

      axisSlide: 0,
      axisAlpha: 0,
      axisStep: 0,
      nameAlphaTenths: 0,
      nameAlphaHundredths: 0,
    };

    let pRef = null;
    let CW = 720;
    let CH = 460;
    let mobile = false;
    let bx = 80;
    let by = 90;
    let bw = 560;
    let bh = 90;

    function computeLayout() {
      const w = canvasEl.clientWidth || 720;
      CW = Math.min(w - 16, 760);
      mobile = CW < 560;
      CH = mobile ? 540 : 460;

      const pad = mobile ? 24 : 40;
      bw = CW - pad * 2;
      bh = mobile ? 74 : 90;
      bx = pad;
      by = mobile ? 86 : 92;
    }

    controlsEl.innerHTML = `
      <div class="controls-card">
        <div class="module-controls">
          <button class="btn btn-primary" id="btn-split10">✂️ 切成 10 份</button>
          <button class="btn btn-primary hidden" id="btn-split100">🧩 再切这 1 份</button>
          <button class="btn btn-secondary hidden" id="btn-naming">🏷️ 这些位置叫什么？</button>
          <button class="btn btn-secondary" id="btn-reset">↺ 重置</button>
        </div>
      </div>
    `;

    const btnSplit10 = controlsEl.querySelector('#btn-split10');
    const btnSplit100 = controlsEl.querySelector('#btn-split100');
    const btnNaming = controlsEl.querySelector('#btn-naming');
    const btnReset = controlsEl.querySelector('#btn-reset');

    function updateDesc() {
      if (state.phase === 'idle') {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 阶段一：切开这个 1</h3>
          <p>先把完整的 <strong>1</strong> 切成 10 份。切完后点击任意一格，观察
          <code>几/10</code> 与小数 <code>0.x</code> 一起变化。</p>
        </div>`;
        return;
      }
      if (state.phase === 'cut10') {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 阶段二：再切，感受进位</h3>
          <p>请先选中第 1 个大格（<code>1/10</code>），再点「再切这 1 份」。
          下方会出现 10 个 <code>0.01</code> 小格，点亮到第 10 个时会发生合并动画。</p>
        </div>`;
        return;
      }
      if (state.phase === 'cut100') {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 阶段三：给位置起名字</h3>
          <p>你已经看到了：<strong>10 个 0.01 合并成 1 个 0.1</strong>。现在可以点
          「这些位置叫什么？」把数位名称和刚才切出来的位置对应起来。</p>
        </div>`;
        return;
      }
      descEl.innerHTML = `<div class="desc-box">
        <h3>📖 数位是“长出来”的</h3>
        <p>十分位对应上方的大格，百分位对应下方的小格。名称不是凭空记忆，而是从切割体验中长出来的。</p>
      </div>`;
    }

    function resetAll() {
      gsap.killTweensOf(state);
      Object.assign(state, {
        phase: 'idle',
        splitLines: 0,
        gap: 0,
        selectedTenths: -1,
        drawerOpen: 0,
        hundredLit: 0,
        mergeCompress: 0,
        mergeRebound: 0,
        mergeLift: 0,
        mergeFlash: 0,
        mergeImpact: 0,
        mergeMsgAlpha: 0,
        merging: false,
        axisSlide: 0,
        axisAlpha: 0,
        axisStep: 0,
        nameAlphaTenths: 0,
        nameAlphaHundredths: 0,
      });
      btnSplit10.disabled = false;
      btnSplit100.disabled = false;
      btnSplit100.classList.add('hidden');
      btnNaming.disabled = false;
      btnNaming.classList.add('hidden');
      updateDesc();
    }

    bindTap(btnSplit10, () => {
      if (state.phase !== 'idle') return;
      btnSplit10.disabled = true;

      const tl = gsap.timeline({
        onComplete: () => {
          state.phase = 'cut10';
          state.selectedTenths = 0;
          btnSplit100.classList.remove('hidden');
          updateDesc();
        },
      });
      tl.to(state, { splitLines: 9, duration: 1.05, ease: 'none' });
      tl.to(state, { gap: 6, duration: 0.22, ease: 'back.out(2.2)' }, '-=0.04');
    });

    bindTap(btnSplit100, () => {
      if (state.phase !== 'cut10') return;
      if (state.selectedTenths !== 0) return;
      if (state.drawerOpen > 0.98 || state.merging) return;

      btnSplit100.disabled = true;
      gsap.to(state, { drawerOpen: 1, duration: 0.45, ease: 'power2.out' });
    });

    bindTap(btnNaming, () => {
      if (state.phase !== 'cut100' || state.axisAlpha > 0.99) return;
      btnNaming.disabled = true;
      state.phase = 'naming';

      const tl = gsap.timeline();
      tl.to(state, { axisAlpha: 1, axisSlide: 1, duration: 0.55, ease: 'power2.out' });
      tl.to(state, { axisStep: 1, duration: 0.26, ease: 'power1.inOut' });
      tl.to(state, { axisStep: 2, duration: 0.26, ease: 'power1.inOut' });
      tl.to(state, { axisStep: 3, duration: 0.26, ease: 'power1.inOut' });
      tl.to(state, { axisStep: 4, duration: 0.26, ease: 'power1.inOut' });
      tl.to(state, { nameAlphaTenths: 1, duration: 0.35, ease: 'power2.out' }, '-=0.16');
      tl.to(state, { nameAlphaHundredths: 1, duration: 0.35, ease: 'power2.out' }, '-=0.16');
      updateDesc();
    });

    bindTap(btnReset, resetAll);

    function runMergeAnimation() {
      if (state.merging) return;
      state.merging = true;

      const tl = gsap.timeline({
        onComplete: () => {
          state.hundredLit = 0;
          state.drawerOpen = 0;
          state.mergeCompress = 0;
          state.mergeRebound = 0;
          state.mergeLift = 0;
          state.mergeFlash = 0;
          state.mergeImpact = 0;
          state.merging = false;

          state.selectedTenths = 1;
          state.phase = 'cut100';
          btnSplit100.classList.add('hidden');
          btnNaming.classList.remove('hidden');
          updateDesc();
        },
      });

      tl.to({}, { duration: 0.34 }); // 核心停顿：让孩子看到“满了”
      tl.to(state, { mergeMsgAlpha: 1, duration: 0.22, ease: 'power1.out' }, '-=0.08');
      tl.to(state, { mergeCompress: 1, duration: 0.5, ease: 'power3.in' }); // 收拢更慢更重
      tl.to(state, { mergeRebound: 1, duration: 0.2, ease: 'power1.out' }); // 预弹
      tl.to(state, { mergeLift: 1, duration: 0.62, ease: 'back.inOut(1.35)' }); // 合并上抬
      tl.to(state, { mergeFlash: 1, duration: 0.12, ease: 'power1.out' }, '-=0.2');
      tl.to(state, { mergeImpact: 1, duration: 0.16, ease: 'power2.out' }, '-=0.1');
      tl.to(state, { mergeFlash: 0, duration: 0.26, ease: 'power1.in' });
      tl.to(state, { mergeImpact: 0, duration: 0.3, ease: 'power1.out' }, '<');
      tl.to(state, { mergeMsgAlpha: 0, duration: 0.3, ease: 'power1.in' }, '-=0.1');
    }

    this.sketch = new p5((p) => {
      pRef = p;

      p.setup = () => {
        computeLayout();
        const cv = p.createCanvas(CW, CH);
        cv.elt.style.display = 'block';
        p.textFont('system-ui, "PingFang SC", "Microsoft YaHei", sans-serif');
        updateDesc();
      };

      function fmtFractionAndDecimal() {
        const t = Math.max(0, state.selectedTenths);
        const tenthsNum = t + 1;
        if (state.drawerOpen > 0.98) {
          const h = state.hundredLit;
          if (h > 0) return { frac: `${h}/100`, dec: (h / 100).toFixed(2), msg: `点亮了 ${h} 份 0.01` };
        }
        return { frac: `${tenthsNum}/10`, dec: `0.${tenthsNum}`, msg: `这 ${tenthsNum} 份，就是 0.${tenthsNum}` };
      }

      function drawTopBar() {
        const lineCount = Math.floor(state.splitLines + 0.001);
        const cellW = (bw - state.gap * 9) / 10;
        const flashAlpha = Math.round(150 * state.mergeFlash);
        const impact = state.mergeImpact;

        // 主体 10 格
        for (let i = 0; i < 10; i++) {
          const x = bx + i * (cellW + state.gap);
          const y = by;
          const selected = i === state.selectedTenths;
          const isSoft = state.selectedTenths >= 0 && !selected;

          p.noStroke();
          if (selected) p.fill(95, 186, 255);
          else if (isSoft) p.fill(186, 223, 247);
          else p.fill(146, 204, 244);
          p.rect(x, y, cellW, bh, 6);

          if (flashAlpha > 0 && i === state.selectedTenths) {
            p.fill(255, 245, 170, flashAlpha);
            p.rect(x, y, cellW, bh, 6);
          }
        }

        if (impact > 0.01 && state.selectedTenths >= 0) {
          const x = bx + state.selectedTenths * (cellW + state.gap);
          const cx = x + cellW / 2;
          const cy = by + bh / 2;
          const ringR = (mobile ? 34 : 40) + impact * (mobile ? 58 : 72);
          p.noFill();
          p.stroke(255, 226, 138, Math.round(180 * impact));
          p.strokeWeight(4 - 2 * impact);
          p.ellipse(cx, cy, ringR, ringR * 0.72);
        }

        // 外框
        p.noFill();
        p.stroke(73, 124, 169);
        p.strokeWeight(2.4);
        p.rect(bx, by, bw, bh, 6);

        // 逐条出现的分割线
        for (let i = 1; i <= lineCount; i++) {
          const lx = bx + i * cellW + (i - 0.5) * state.gap;
          p.stroke(73, 124, 169, 180);
          p.strokeWeight(2);
          p.line(lx, by + 4, lx, by + bh - 4);
        }

        if (state.splitLines < 0.2) {
          p.noStroke();
          p.fill(61, 95, 130, 180);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(mobile ? 34 : 42);
          p.textStyle(p.BOLD);
          p.text('1', bx + bw / 2, by + bh / 2);
          p.textStyle(p.NORMAL);
        }
      }

      function drawInfoPanel() {
        if (state.phase === 'idle') return;
        const obj = fmtFractionAndDecimal();
        const cx = CW / 2;
        const y = by + bh + (mobile ? 62 : 72);

        p.noStroke();
        p.fill(255, 255, 255, 210);
        p.rect(cx - 180, y - 36, 360, 80, 12);

        p.fill(57, 110, 154);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(28);
        p.textStyle(p.BOLD);
        p.text(obj.frac, cx - 80, y);

        p.fill(90, 90, 90);
        p.textSize(24);
        p.text('=', cx, y);

        p.fill(243, 92, 73);
        p.textSize(34);
        p.text(obj.dec, cx + 92, y);
        p.textStyle(p.NORMAL);

        p.fill(92, 92, 92);
        p.textSize(13);
        p.text(obj.msg, cx, y + 30);
      }

      function drawDrawer() {
        if (state.drawerOpen <= 0.001 && !state.merging) return;
        const cellW = (bw - state.gap * 9) / 10;
        const topX = bx;
        const topY = by + bh + 8;
        const open = state.drawerOpen;
        const h = (mobile ? 60 : 72) * open;
        if (h <= 0.5) return;

        let pack = state.mergeCompress;
        const rebound = state.mergeRebound;
        let lift = state.mergeLift;

        const scaleX = 1 - 0.65 * pack;
        const offsetX = (cellW * (1 - scaleX)) * pack;
        const offsetY = -bh * (0.1 * rebound + 0.55 * lift);
        const trailAlpha = Math.round(95 * lift);

        p.push();
        p.translate(offsetX, offsetY);

        p.noStroke();
        p.fill(237, 246, 255, 235);
        p.rect(topX, topY, cellW, h, 8);

        const smallW = cellW / 10;
        const lit = state.hundredLit;
        for (let i = 0; i < 10; i++) {
          const x = topX + i * smallW;
          const on = i < lit;
          p.noStroke();
          p.fill(on ? [106, 198, 255, 255] : [197, 217, 236, 210]);
          p.rect(x + 1, topY + 1, smallW - 2, h - 2, 3);
        }

        p.stroke(108, 146, 178, 170);
        p.strokeWeight(1.4);
        for (let i = 1; i < 10; i++) {
          const lx = topX + i * smallW;
          p.line(lx, topY + 3, lx, topY + h - 3);
        }
        p.noFill();
        p.stroke(108, 146, 178, 190);
        p.strokeWeight(1.8);
        p.rect(topX, topY, cellW, h, 8);

        // 轻量拖影：增强“上抬并并入”的重量感
        if (trailAlpha > 5) {
          p.noStroke();
          p.fill(130, 187, 230, trailAlpha);
          p.rect(topX + cellW * 0.16, topY + h - 3, cellW * 0.68, (mobile ? 18 : 24) * lift, 6);
        }
        p.pop();

        const mA = Math.round(255 * state.mergeMsgAlpha);
        if (mA > 5) {
          p.noStroke();
          p.fill(248, 148, 55, mA);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(mobile ? 14 : 16);
          p.textStyle(p.BOLD);
          p.text('10 个 0.01，合并成了 1 个 0.1', CW / 2, topY + h + 28);
          p.textStyle(p.NORMAL);
        }
      }

      function drawNamingAxis() {
        if (state.axisAlpha <= 0.001) return;
        const a = Math.round(255 * state.axisAlpha);
        const axisY = 38 - 26 * (1 - state.axisSlide);
        const labels = ['个位', '小数点', '十分位', '百分位'];
        const xs = [
          CW * 0.26,
          CW * 0.41,
          CW * 0.57,
          CW * 0.74,
        ];

        p.noStroke();
        p.fill(255, 255, 255, Math.min(220, a));
        p.rect(CW * 0.14, axisY - 18, CW * 0.72, 42, 12);

        for (let i = 0; i < 4; i++) {
          const on = state.axisStep >= i + 1;
          p.noStroke();
          p.fill(on ? [114, 203, 138, a] : [205, 214, 224, a * 0.8]);
          p.rect(xs[i] - 34, axisY - 10, 68, 24, 8);

          p.fill(45, 71, 91, a);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(13);
          p.text(labels[i], xs[i], axisY + 2);
        }

        if (state.nameAlphaTenths > 0.01) {
          const aa = Math.round(255 * state.nameAlphaTenths);
          const tx = xs[2];
          const ty = by + bh / 2;
          p.stroke(74, 129, 176, aa);
          p.drawingContext.setLineDash([6, 6]);
          p.strokeWeight(2);
          p.line(tx, axisY + 16, bx + bw * 0.05, ty);
          p.drawingContext.setLineDash([]);
          p.noStroke();
          p.fill(74, 129, 176, aa);
          p.textSize(12);
          p.text('十分位', tx + 34, (axisY + ty) / 2);
        }

        if (state.nameAlphaHundredths > 0.01) {
          const aa = Math.round(255 * state.nameAlphaHundredths);
          const tx = xs[3];
          const smallTargetX = bx + ((bw - state.gap * 9) / 10) * 0.5;
          const smallTargetY = by + bh + 48;
          p.stroke(74, 129, 176, aa);
          p.drawingContext.setLineDash([6, 6]);
          p.strokeWeight(2);
          p.line(tx, axisY + 16, smallTargetX, smallTargetY);
          p.drawingContext.setLineDash([]);
          p.noStroke();
          p.fill(74, 129, 176, aa);
          p.textSize(12);
          p.text('百分位', tx + 34, (axisY + smallTargetY) / 2);
        }
      }

      p.draw = () => {
        p.background(248, 247, 255);
        drawTopBar();
        drawDrawer();
        drawInfoPanel();
        drawNamingAxis();

        if (state.phase === 'idle') {
          p.noStroke();
          p.fill(96, 96, 96);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(13);
          p.text('点击「切成 10 份」开始探索', CW / 2, by + bh + 18);
        } else if (state.phase === 'cut10' && state.drawerOpen < 0.95) {
          p.noStroke();
          p.fill(112, 112, 112);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(12);
          const txt = state.selectedTenths === 0
            ? '你选中了第 1 份，可以点「再切这 1 份」'
            : '请先点第 1 个大格，再继续下一步';
          p.text(txt, CW / 2, by + bh + (mobile ? 130 : 124));
        } else if (state.phase === 'cut100' && state.axisAlpha < 0.1) {
          p.noStroke();
          p.fill(112, 112, 112);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(12);
          p.text('点击「这些位置叫什么？」进入命名阶段', CW / 2, by + bh + (mobile ? 124 : 118));
        }
      };

      function clickTenths(mx, my) {
        if (state.splitLines < 8.95) return false;
        if (my < by || my > by + bh || mx < bx || mx > bx + bw) return false;
        const cellW = (bw - state.gap * 9) / 10;
        for (let i = 0; i < 10; i++) {
          const x = bx + i * (cellW + state.gap);
          if (mx >= x && mx <= x + cellW) {
            state.selectedTenths = i;
            return true;
          }
        }
        return false;
      }

      function clickHundredths(mx, my) {
        if (state.drawerOpen < 0.95 || state.merging) return false;
        if (state.selectedTenths !== 0) return false;

        const cellW = (bw - state.gap * 9) / 10;
        const x0 = bx;
        const y0 = by + bh + 8;
        const h = mobile ? 60 : 72;
        if (mx < x0 || mx > x0 + cellW || my < y0 || my > y0 + h) return false;

        const sw = cellW / 10;
        const idx = Math.floor((mx - x0) / sw);
        if (idx !== state.hundredLit) return true;

        state.hundredLit += 1;
        if (state.hundredLit >= 10) runMergeAnimation();
        return true;
      }

      p.mousePressed = () => {
        if (clickHundredths(p.mouseX, p.mouseY)) return;
        clickTenths(p.mouseX, p.mouseY);
      };

      p.touchStarted = () => {
        if (clickHundredths(p.mouseX, p.mouseY)) return false;
        clickTenths(p.mouseX, p.mouseY);
        return false;
      };

      p.windowResized = () => {
        computeLayout();
        p.resizeCanvas(CW, CH);
      };
    }, canvasEl);

    updateDesc();
  },

  destroy() {
    if (this.sketch) {
      this.sketch.remove();
      this.sketch = null;
    }
  },
});
