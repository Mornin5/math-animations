// ============================================================
//  4-1 小数的意义
//  模块一：切割模型 — 10 条（十分位）→ 可选百格图（百分位）
//  模块二：数轴定位 — ×10 → ×100 → ×1000（千分位）
// ============================================================

MathAnim.register('u4/4-1', {
  sketch: null,

  init(canvasEl, controlsEl, descEl) {

    let activeTab = 0;
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

    // ── 模块一：tenths → hundredths（百格） ─────────────────
    const m1 = {
      cutProgress: 0,
      isCut:       false,
      infoAlpha:   0,
    };
    let m1HundredMode = false;   // false=10×1 十分，true=10×10 百分
    let m1PrevN       = 0;
    let m1DisplayN    = 0;
    let grid = null;

    // ── 模块二：zoomLevel 0 整段 / 1 十分 / 2 百分 / 3 千分 ─
    const m2 = {
      rangeStart:  0,
      rangeEnd:    1,
      tickAlpha:   0,
      markerValue: 0,
      markerAlpha: 0,
      zoomLevel:   0,
    };
    let nlDragging = false;

    let CW, CH, mobile;
    let GX, GY, GS;
    let NLX, NLY, NLW;
    let InfoX, InfoY;

    function computeLayout() {
      const w = canvasEl.clientWidth || 700;
      CW      = Math.min(w - 16, 720);
      mobile  = CW < 520;
      CH      = mobile ? 480 : 450;

      const maxG  = mobile ? Math.min(CW - 40, 260) : Math.min((CW - 120) / 2, 280);
      GS = Math.round(maxG);
      GX = mobile ? Math.round((CW - GS) / 2) : 40;
      GY = mobile ? 16 : Math.round((CH - GS) / 2);

      InfoX = mobile ? CW / 2 : GX + GS + Math.round((CW - GX - GS - 20) / 2);
      InfoY = mobile ? GY + GS + 72 : CH / 2;

      NLX = 50;
      NLW = CW - 100;
      NLY = Math.round(CH * 0.62);
    }

    controlsEl.innerHTML = `
      <div class="controls-card">
        <div class="module-tabs">
          <button class="tab-btn active" data-tab="0">🔲 切割模型</button>
          <button class="tab-btn"        data-tab="1">📏 数轴定位</button>
        </div>
        <div class="module-controls" id="mc-0">
          <button class="btn btn-primary"   id="btn-cut">✂️ 切成 10 份</button>
          <button class="btn btn-primary hidden" id="btn-hundred">🔲 变成百格（100 份）</button>
          <button class="btn btn-secondary" id="btn-reset-m1">↺ 重置</button>
        </div>
        <div class="module-controls hidden" id="mc-1">
          <button class="btn btn-primary"   id="btn-zoom1">🔍 放大 ×10</button>
          <button class="btn btn-secondary hidden" id="btn-zoom2">🔍 再放大（百分之一）</button>
          <button class="btn btn-secondary hidden" id="btn-zoom3">🔍 再放大（千分之一）</button>
          <button class="btn btn-secondary" id="btn-reset-m2">↺ 重置</button>
        </div>
      </div>
    `;

    controlsEl.querySelectorAll('.tab-btn').forEach(btn => {
      bindTap(btn, () => switchTab(parseInt(btn.dataset.tab)));
    });

    function switchTab(tab) {
      activeTab = tab;
      controlsEl.querySelectorAll('.tab-btn').forEach(b =>
        b.classList.toggle('active', parseInt(b.dataset.tab) === tab));
      document.getElementById('mc-0').classList.toggle('hidden', tab !== 0);
      document.getElementById('mc-1').classList.toggle('hidden', tab !== 1);
      updateDesc(tab);
    }

    const btnCut     = document.getElementById('btn-cut');
    const btnHundred = document.getElementById('btn-hundred');

    bindTap(btnCut, () => {
      if (m1.isCut || m1HundredMode) return;
      btnCut.disabled = true;
      gsap.to(m1, {
        cutProgress: 1,
        duration: 0.7,
        ease: 'power2.inOut',
        onComplete: () => {
          m1.isCut = true;
          btnHundred.classList.remove('hidden');
        },
      });
    });

    bindTap(btnHundred, () => {
      if (!m1.isCut || m1HundredMode) return;
      gsap.killTweensOf(m1);
      if (grid) {
        gsap.killTweensOf(grid._cellAlphas);
        grid.setGrid(10, 10);
        grid.showCellLabels = false;
        grid.cutProgress = 0;
      }
      m1HundredMode = true;
      m1.isCut      = false;
      m1PrevN       = 0;
      m1DisplayN    = 0;
      m1.cutProgress = 0;
      gsap.killTweensOf(m1, 'infoAlpha');
      m1.infoAlpha = 0;

      btnHundred.disabled = true;
      btnHundred.classList.add('hidden');

      gsap.to(m1, {
        cutProgress: 1,
        duration: 0.85,
        ease: 'power2.inOut',
        onComplete: () => { m1.isCut = true; },
      });
      updateDesc(0);
    });

    bindTap(document.getElementById('btn-reset-m1'), () => {
      gsap.killTweensOf(m1);
      if (grid) {
        gsap.killTweensOf(grid._cellAlphas);
        grid.setGrid(10, 1);
        grid.showCellLabels = true;
        grid.cutProgress = 0;
      }
      m1HundredMode = false;
      m1PrevN       = 0;
      m1DisplayN    = 0;
      m1.cutProgress = 0;
      m1.infoAlpha   = 0;

      gsap.to(m1, {
        cutProgress: 0,
        infoAlpha:   0,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => {
          m1.isCut = false;
          btnCut.disabled = false;
          btnHundred.disabled = false;
          btnHundred.classList.add('hidden');
        },
      });
      updateDesc(0);
    });

    const btnZoom1 = document.getElementById('btn-zoom1');
    const btnZoom2 = document.getElementById('btn-zoom2');
    const btnZoom3 = document.getElementById('btn-zoom3');

    bindTap(btnZoom1, () => {
      if (m2.zoomLevel > 0) return;
      m2.zoomLevel   = 1;
      m2.markerValue = 0.5;
      gsap.to(m2, { tickAlpha: 255, markerAlpha: 255, duration: 0.7, ease: 'power2.out' });
      btnZoom1.disabled = true;
      btnZoom2.classList.remove('hidden');
    });

    bindTap(btnZoom2, () => {
      if (m2.zoomLevel !== 1) return;
      nlDragging = false;
      gsap.killTweensOf(m2, 'markerValue');

      m2.zoomLevel = 2;
      const mv = m2.markerValue;
      const lo = Math.floor(mv * 10) / 10;
      const hi = lo + 0.1;
      gsap.to(m2, { rangeStart: lo, rangeEnd: hi, duration: 0.8, ease: 'power2.inOut' });
      gsap.to(m2, { markerValue: lo + 0.05,       duration: 0.8, ease: 'power2.inOut' });
      btnZoom2.disabled = true;
      btnZoom3.classList.remove('hidden');
      updateDesc(1);
    });

    bindTap(btnZoom3, () => {
      if (m2.zoomLevel !== 2) return;
      nlDragging = false;
      gsap.killTweensOf(m2, 'markerValue');

      m2.zoomLevel = 3;
      const mv = m2.markerValue;
      const lo = Math.floor(mv * 100) / 100;
      const hi = lo + 0.01;
      gsap.to(m2, { rangeStart: lo, rangeEnd: hi, duration: 0.8, ease: 'power2.inOut' });
      gsap.to(m2, { markerValue: lo + 0.005,      duration: 0.8, ease: 'power2.inOut' });
      btnZoom3.disabled = true;
      updateDesc(1);
    });

    bindTap(document.getElementById('btn-reset-m2'), () => {
      nlDragging = false;
      gsap.killTweensOf(m2);
      Object.assign(m2, { rangeStart: 0, rangeEnd: 1, tickAlpha: 0, markerAlpha: 0,
                          markerValue: 0, zoomLevel: 0 });
      btnZoom1.disabled = false;
      btnZoom2.classList.add('hidden');
      btnZoom2.disabled = false;
      btnZoom3.classList.add('hidden');
      btnZoom3.disabled = false;
      updateDesc(1);
    });

    /** 中文读法：n/100 对应两位小数 */
    function readHundredthsChinese(n) {
      const DIG = ['零','一','二','三','四','五','六','七','八','九'];
      if (n <= 0) return '';
      if (n >= 100) return '一（整体）';
      const hi = Math.floor(n / 10);
      const lo = n % 10;
      if (hi === 0) return `零点零${DIG[lo]}`;
      return `零点${DIG[hi]}${DIG[lo]}`;
    }

    /** 中文读法：三位小数（千分位），n 为分子 /1000 */
    function readThousandthsChinese(n) {
      const DIG = ['零','一','二','三','四','五','六','七','八','九'];
      if (n <= 0) return '';
      if (n >= 1000) return '一（整体）';
      const a = Math.floor(n / 100);
      const b = Math.floor((n % 100) / 10);
      const c = n % 10;
      return `零点${DIG[a]}${DIG[b]}${DIG[c]}`;
    }

    function updateDesc(tab) {
      if (tab === 0) {
        if (m1HundredMode) {
          descEl.innerHTML = `<div class="desc-box">
            <h3>📖 百格图：100 份</h3>
            <p>整个正方形现在被分成 <strong>10×10 = 100</strong> 个小格，每一格是 <strong>百分之一</strong>。<br>
               点击小格选中（可多选），右侧会显示 <code>n/100</code> 和两位小数。<br>
               <code>0.01 = 1/100</code>，读作「零点零一」。</p>
          </div>`;
        } else {
          descEl.innerHTML = `<div class="desc-box">
            <h3>📖 模块一：切割模型</h3>
            <p>先点击「✂️ 切成 10 份」——每一长条是 <strong>十分之一</strong>。<br>
               选好后，可再点「🔲 变成百格」：在同样大的正方形里出现 <strong>100 个小格</strong>，体会 10×10 与百分之一的关系。</p>
          </div>`;
        }
      } else if (m2.zoomLevel === 0) {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 模块二：数轴定位</h3>
          <p>0 和 1 之间藏着很多数。点击「🔍 放大 ×10」看看 <strong>十分之一</strong>！<br>
             放大后可以拖动红点，对应分数和小数。</p>
        </div>`;
      } else if (m2.zoomLevel === 1) {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 再放大一次</h3>
          <p>在十分位之间再放大 10 倍，会出现 <strong>百分之一</strong>（两位小数）。<br>
             试试拖动红点！</p>
        </div>`;
      } else if (m2.zoomLevel === 2) {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 百分之一</h3>
          <p>当前这一小段是 0.1 里再细分。点「🔍 再放大（千分之一）」——在 <strong>0.01 这么长</strong> 的一段里再切 10 份，就是 <strong>千分之一</strong>！<br>
             <code>0.001 = 1/1000</code></p>
        </div>`;
      } else {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 千分之一</h3>
          <p>现在数轴上每一小格是 <strong>0.001</strong>，分数形式是 <strong>千分之几</strong>。<br>
             拖动红点，看三位小数和 <code>n/1000</code> 怎么一起变。</p>
        </div>`;
      }
    }

    this.sketch = new p5((p) => {

      p.setup = () => {
        computeLayout();
        const cv = p.createCanvas(CW, CH);
        cv.elt.style.display = 'block';
        p.textFont('system-ui, "PingFang SC", "Microsoft YaHei", sans-serif');
        grid = new MathAnim.GridSquare(p, {
          x: GX, y: GY, size: GS,
          rows: 10, cols: 1,
        });
        switchTab(0);
      };

      let bgR = 250, bgG = 247, bgB = 255;
      const bgStr = getComputedStyle(document.documentElement)
                      .getPropertyValue('--bg').trim();
      if (bgStr && bgStr.startsWith('#') && bgStr.length === 7) {
        bgR = parseInt(bgStr.slice(1, 3), 16);
        bgG = parseInt(bgStr.slice(3, 5), 16);
        bgB = parseInt(bgStr.slice(5, 7), 16);
      }

      p.draw = () => {
        p.background(bgR, bgG, bgB);
        if (activeTab === 0) drawM1();
        else                 drawM2();
      };

      function drawM1() {
        grid.cutProgress = m1.cutProgress;
        grid.draw();

        const n = grid.getSelectedCount();
        if (n > 0) m1DisplayN = n;

        if (n !== m1PrevN) {
          if (n > 0 && m1PrevN === 0) {
            gsap.killTweensOf(m1, 'infoAlpha');
            gsap.to(m1, { infoAlpha: 255, duration: 0.3, ease: 'power2.out' });
          } else if (n === 0 && m1PrevN > 0) {
            gsap.killTweensOf(m1, 'infoAlpha');
            gsap.to(m1, { infoAlpha: 0, duration: 0.25, ease: 'power2.in' });
          }
          m1PrevN = n;
        }

        if (!m1.isCut) {
          if (m1.cutProgress < 0.05) {
            p.noStroke();
            p.fill(110);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            const hint = m1HundredMode
              ? '百格正在切开…'
              : '点击「✂️ 切成 10 份」开始';
            p.text(hint, GX + GS / 2, GY + GS + 10);
          }
          return;
        }

        if (n === 0 && m1.infoAlpha < 10) {
          p.noStroke();
          p.fill(110);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(12);
          const hint2 = m1HundredMode
            ? '点击小格选中（可多选），体会 1/100'
            : '点击长条选中；想认识 1/100 可点「变成百格」';
          p.text(hint2, GX + GS / 2, GY + GS + 10);
        }

        if (m1.infoAlpha > 0) {
          drawInfoPanel(m1DisplayN, m1.infoAlpha);
        }
      }

      function drawInfoPanel(n, alpha) {
        if (n <= 0) return;
        const a   = Math.round(alpha);
        const den = grid.rows * grid.cols;
        const x   = InfoX, y = InfoY;
        const [cr, cg, cb] = MathAnim.cssRgb('--color-count');
        const [fr, fg, fb] = MathAnim.cssRgb('--color-fraction');
        const [dr, dg, db] = MathAnim.cssRgb('--color-decimal');

        p.noStroke();
        p.fill(cr, cg, cb, a);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(mobile ? 14 : 16);
        p.textStyle(p.BOLD);
        p.text(`选中：${n} 格`, x, y - (mobile ? 54 : 64));
        p.textStyle(p.NORMAL);

        const numSz = mobile ? (den >= 100 ? 20 : 24) : (den >= 100 ? 24 : 28);
        const barW  = mobile ? (den >= 100 ? 34 : 40) : (den >= 100 ? 40 : 48);
        const gap   = mobile ? (den >= 100 ? 50 : 44) : (den >= 100 ? 62 : 58);

        const fx = x - gap;
        p.noStroke();
        p.fill(fr, fg, fb, a);
        p.textStyle(p.BOLD);
        p.textSize(numSz);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(n, fx, y - 4);
        p.stroke(fr, fg, fb, a);
        p.strokeWeight(2.5);
        p.line(fx - barW / 2, y, fx + barW / 2, y);
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(den >= 100 ? Math.min(numSz, 16) : numSz);
        p.text(String(den), fx, y + 4);
        p.textStyle(p.NORMAL);

        p.fill(100, 100, 100, a);
        p.textSize(mobile ? 18 : 22);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('=', x, y);

        const decVal = n / den;
        const decStr = den >= 100 ? decVal.toFixed(2) : decVal.toFixed(1);
        p.fill(dr, dg, db, a);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(mobile ? (den >= 100 ? 28 : 34) : (den >= 100 ? 36 : 42));
        p.textStyle(p.BOLD);
        p.text(decStr, x + gap, y);
        p.textStyle(p.NORMAL);

        if (CW >= 340) {
          p.fill(130, 130, 130, a);
          p.textSize(10);
          p.textAlign(p.CENTER, p.TOP);
          const read = den >= 100
            ? readHundredthsChinese(n)
            : (['','零点一','零点二','零点三','零点四','零点五','零点六','零点七','零点八','零点九','一（整体）'][n] || '');
          p.text(`读作："${read}"`, x + gap, y + (mobile ? 24 : 30));
        }
      }

      function drawM2() {
        const { rangeStart: rs, rangeEnd: re, tickAlpha, markerValue: mv, markerAlpha, zoomLevel } = m2;
        const [ar, ag, ab] = MathAnim.cssRgb('--color-axis');
        const [mr, mg, mb] = MathAnim.cssRgb('--color-marker');
        const [fr, fg, fb] = MathAnim.cssRgb('--color-fraction');
        const [dr, dg, db] = MathAnim.cssRgb('--color-decimal');

        const range  = re - rs;
        const digits = range <= 0.012 ? 3 : range <= 0.15 ? 2 : range <= 1.5 ? 1 : 0;

        // 缩略提示：当前窗口在整条 0~1 上的位置（直观「放大镜」）
        if (zoomLevel >= 1 && range < 1) {
          const barLeft = NLX;
          const barWMap = NLW;
          const span = 1;
          p.noStroke();
          p.fill(ar, ag, ab, 40);
          p.rect(barLeft, 8, barWMap, 6, 3);
          const wWin = (range / span) * barWMap;
          const xWin = barLeft + (rs / span) * barWMap;
          p.fill(mr, mg, mb, 180);
          p.rect(xWin, 7, Math.max(wWin, 4), 8, 2);
          p.fill(ar, ag, ab, 200);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(10);
          p.text('下面粗轴是当前放大的那一小段 ↑', CW / 2, 20);
        }

        if (markerAlpha > 0 && mv > rs) {
          const mx2 = valToX(mv);
          const [hr, hg, hb] = MathAnim.cssRgb('--color-highlight');
          p.stroke(hr, hg, hb, markerAlpha * 0.85);
          p.strokeWeight(6);
          p.line(NLX, NLY, mx2, NLY);
        }

        p.stroke(ar, ag, ab);
        p.strokeWeight(2.5);
        p.line(NLX, NLY, NLX + NLW, NLY);
        p.fill(ar, ag, ab);
        p.noStroke();
        p.triangle(NLX + NLW + 10, NLY, NLX + NLW, NLY - 5, NLX + NLW, NLY + 5);

        drawTick(rs, 12, rs.toFixed(digits), 255, ar, ag, ab);
        drawTick(re, 12, re.toFixed(digits), 255, ar, ag, ab);

        if (tickAlpha > 0) {
          const step = range / 10;
          for (let i = 1; i <= 9; i++) {
            const v = rs + i * step;
            drawTick(v, 7, v.toFixed(digits), tickAlpha, ar, ag, ab);
          }
        }

        if (markerAlpha > 0 && mv >= rs && mv <= re) {
          const mx2 = valToX(mv);
          p.noStroke();
          p.fill(mr, mg, mb, markerAlpha * 0.2);
          p.circle(mx2, NLY, 30);
          p.fill(mr, mg, mb, markerAlpha);
          p.circle(mx2, NLY, 16);

          let fracN, fracD;
          if (zoomLevel >= 3) {
            fracN = Math.round(mv * 1000);
            fracD = 1000;
          } else if (zoomLevel >= 2) {
            fracN = Math.round(mv * 100);
            fracD = 100;
          } else {
            fracN = Math.round(mv * 10);
            fracD = 10;
          }

          p.fill(dr, dg, db, markerAlpha);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.textSize(mobile ? 18 : 22);
          p.textStyle(p.BOLD);
          p.text(mv.toFixed(digits), mx2, NLY - 42);
          p.textStyle(p.NORMAL);

          if (fracN > 0 && fracN < fracD) {
            const barW = zoomLevel >= 3 ? 32 : 28;
            const fy   = NLY - (zoomLevel >= 3 ? 102 : 92);
            const fsize = zoomLevel >= 3 ? 14 : 17;
            p.fill(fr, fg, fb, markerAlpha);
            p.textStyle(p.BOLD);
            p.textSize(fsize);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(fracN, mx2, fy - 2);
            p.stroke(fr, fg, fb, markerAlpha);
            p.strokeWeight(2);
            p.line(mx2 - barW, fy, mx2 + barW, fy);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.text(fracD, mx2, fy + 2);
            p.textStyle(p.NORMAL);

            if (CW >= 360) {
              p.fill(120, 120, 120, markerAlpha);
              p.textSize(9);
              p.textAlign(p.CENTER, p.TOP);
              const rd = zoomLevel >= 3
                ? readThousandthsChinese(fracN)
                : (zoomLevel >= 2 ? readHundredthsChinese(fracN) : '');
              if (rd) p.text(`「${rd}」`, mx2, fy + 16);
            }
          }
        }

        if (zoomLevel === 0) {
          p.noStroke();
          p.fill(120);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(13);
          p.text('0 和 1 之间藏着很多数，点「🔍 放大 ×10」！', CW / 2, NLY + 26);
        }

        if (zoomLevel >= 1) {
          let label;
          if (zoomLevel === 1) label = '放大了 10 倍 → 十分之一（0.1 一格）';
          else if (zoomLevel === 2) label = '再放大 10 倍 → 百分之一（0.01 一格）';
          else label = '再放大 10 倍 → 千分之一（0.001 一格）';
          p.noStroke();
          p.fill(mr, mg, mb, 210);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.textSize(11);
          p.text(label, CW / 2, CH - 8);
        }
      }

      function valToX(v) {
        return NLX + ((v - m2.rangeStart) / (m2.rangeEnd - m2.rangeStart)) * NLW;
      }

      function drawTick(val, h, label, alpha, r, g, b) {
        const tx = valToX(val);
        if (tx < NLX - 5 || tx > NLX + NLW + 5) return;
        p.stroke(r, g, b, alpha);
        p.strokeWeight(1.5);
        p.line(tx, NLY - h, tx, NLY + h);
        if (label && alpha > 20) {
          p.noStroke();
          p.fill(r, g, b, alpha);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(zoomLevelDigitsLabel());
          p.text(label, tx, NLY + h + 2);
        }
      }

      function zoomLevelDigitsLabel() {
        const r = m2.rangeEnd - m2.rangeStart;
        if (r <= 0.012) return 9;
        if (r <= 0.15) return 10;
        return 11;
      }

      function handlePress(mx, my) {
        if (activeTab === 0) {
          if (m1.isCut && grid) {
            const idx = grid.handleClick(mx, my);
            if (idx >= 0 && grid.selected.has(idx)) {
              gsap.to(grid._cellAlphas, {
                [idx]: 215,
                duration: 0.22,
                ease: 'power2.out',
              });
            }
          }
        } else {
          if (m2.zoomLevel >= 1 && m2.markerAlpha > 100) {
            const onLine = my > NLY - 24 && my < NLY + 24 && mx > NLX - 10 && mx < NLX + NLW + 10;
            if (onLine) { nlDragging = true; updateMarker(mx); }
          }
        }
      }

      function handleDrag(mx) {
        if (activeTab === 1 && nlDragging) updateMarker(mx);
      }

      function updateMarker(mx) {
        const t     = Math.max(0, Math.min(1, (mx - NLX) / NLW));
        const range = m2.rangeEnd - m2.rangeStart;
        const raw   = m2.rangeStart + t * range;
        let snap;
        if (m2.zoomLevel >= 3) snap = 0.001;
        else if (m2.zoomLevel >= 2) snap = 0.01;
        else snap = 0.1;
        const val = Math.max(m2.rangeStart,
                      Math.min(m2.rangeEnd,
                        Math.round(raw / snap) * snap));
        gsap.to(m2, { markerValue: val, duration: 0.12, ease: 'power2.out' });
      }

      p.mousePressed   = () => handlePress(p.mouseX, p.mouseY);
      p.touchStarted   = () => { handlePress(p.mouseX, p.mouseY); return false; };
      p.mouseDragged   = () => handleDrag(p.mouseX);
      p.touchMoved     = () => { handleDrag(p.mouseX); return false; };
      p.mouseReleased  = () => { nlDragging = false; };
      p.touchEnded     = () => { nlDragging = false; };

      p.windowResized = () => {
        computeLayout();
        p.resizeCanvas(CW, CH);
        if (grid) grid.resize(GX, GY, GS);
      };

    }, canvasEl);

    updateDesc(0);
  },

  destroy() {
    if (this.sketch) { this.sketch.remove(); this.sketch = null; }
  },
});
