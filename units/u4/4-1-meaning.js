// ============================================================
//  4-1 小数的意义
//  模块一：切割模型（孩子点击格子，实时联动分数/小数）
//  模块二：数轴定位（×10 放大，拖拽标记，再放大引出 0.01）
// ============================================================

MathAnim.register('u4/4-1', {
  sketch: null,

  init(canvasEl, controlsEl, descEl) {
    const self = this;

    // ── 当前激活模块 0=切割模型 / 1=数轴定位 ──────────────────
    let activeTab = 0;

    // ── 模块一状态 ────────────────────────────────────────────
    const m1 = {
      cutProgress: 0,   // GSAP 动画目标
      isCut: false,
    };
    let grid = null;

    // ── 模块二状态 ────────────────────────────────────────────
    const m2 = {
      rangeStart:  0,   // GSAP 动画目标（数轴显示范围）
      rangeEnd:    1,
      tickAlpha:   0,   // 刻度透明度 0-255，GSAP 动画目标
      markerValue: 0,
      markerAlpha: 0,
      zoomLevel:   0,   // 0=初始 1=×10 2=×100
    };
    let nlDragging = false;

    // ── 布局变量（computeLayout 填充）────────────────────────
    let CW, CH, mobile;
    let GX, GY, GS;           // 模块一正方形
    let NLX, NLY, NLW;        // 模块二数轴
    let InfoX, InfoY;         // 模块一信息面板中心（canvas 内）

    function computeLayout() {
      const w = canvasEl.clientWidth || 700;
      CW      = Math.min(w - 16, 720);
      mobile  = CW < 520;
      CH      = mobile ? 420 : 400;

      // 模块一：正方形位置
      const maxG  = mobile ? Math.min(CW - 40, 260) : Math.min((CW - 120) / 2, 280);
      GS = Math.round(maxG);
      GX = mobile ? Math.round((CW - GS) / 2) : 40;
      GY = mobile ? 20 : Math.round((CH - GS) / 2);

      // 信息面板（桌面右侧，移动端下方）
      InfoX = mobile ? CW / 2 : GX + GS + Math.round((CW - GX - GS - 20) / 2);
      InfoY = mobile ? GY + GS + 68 : CH / 2;

      // 模块二：数轴
      NLX = 50;
      NLW = CW - 100;
      NLY = Math.round(CH * 0.52);
    }

    // ── 构建控制区 HTML ───────────────────────────────────────
    controlsEl.innerHTML = `
      <div class="module-tabs">
        <button class="tab-btn active" data-tab="0">🔲 切割模型</button>
        <button class="tab-btn"        data-tab="1">📏 数轴定位</button>
      </div>
      <div class="module-controls" id="mc-0">
        <button class="btn btn-primary"   id="btn-cut">切成 10 份</button>
        <button class="btn btn-secondary" id="btn-reset-m1">↺ 重置</button>
      </div>
      <div class="module-controls hidden" id="mc-1">
        <button class="btn btn-primary"   id="btn-zoom1">放大 ×10</button>
        <button class="btn btn-secondary hidden" id="btn-zoom2">再放大</button>
        <button class="btn btn-secondary" id="btn-reset-m2">↺ 重置</button>
      </div>
    `;

    // ── Tab 切换 ─────────────────────────────────────────────
    controlsEl.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(parseInt(btn.dataset.tab)));
    });

    function switchTab(tab) {
      activeTab = tab;
      controlsEl.querySelectorAll('.tab-btn').forEach(b =>
        b.classList.toggle('active', parseInt(b.dataset.tab) === tab));
      document.getElementById('mc-0').classList.toggle('hidden', tab !== 0);
      document.getElementById('mc-1').classList.toggle('hidden', tab !== 1);
      updateDesc(tab);
    }

    // ── 模块一按钮 ───────────────────────────────────────────
    document.getElementById('btn-cut').addEventListener('click', () => {
      if (m1.isCut) return;
      gsap.to(m1, {
        cutProgress: 1,
        duration: 0.7,
        ease: 'power2.inOut',
        onComplete: () => { m1.isCut = true; },
      });
    });

    document.getElementById('btn-reset-m1').addEventListener('click', () => {
      gsap.killTweensOf(m1);
      m1.cutProgress = 0;
      m1.isCut = false;
      if (grid) grid.reset();
      updateInfoPanel(0);
    });

    // ── 模块二按钮 ───────────────────────────────────────────
    document.getElementById('btn-zoom1').addEventListener('click', () => {
      if (m2.zoomLevel > 0) return;
      m2.zoomLevel = 1;
      // 刻度渐显，标记点渐显
      gsap.to(m2, { tickAlpha: 255, markerAlpha: 255, duration: 0.7, ease: 'power2.out' });
      m2.markerValue = 0.5;
      document.getElementById('btn-zoom1').disabled = true;
      document.getElementById('btn-zoom2').classList.remove('hidden');
    });

    document.getElementById('btn-zoom2').addEventListener('click', () => {
      if (m2.zoomLevel !== 1) return;
      m2.zoomLevel = 2;
      const mv = m2.markerValue;
      // 确定缩放目标范围（以标记点所在的 0.X ~ 0.(X+1) 区间放大）
      const lo = Math.floor(mv * 10) / 10;
      const hi = lo + 0.1;
      gsap.to(m2, {
        rangeStart: lo,
        rangeEnd:   hi,
        duration:   0.8,
        ease:       'power2.inOut',
      });
      // 标记点夹在新范围内中间
      gsap.to(m2, { markerValue: lo + 0.05, duration: 0.8, ease: 'power2.inOut' });
      document.getElementById('btn-zoom2').disabled = true;
      updateDesc(1); // 更新说明文字
    });

    document.getElementById('btn-reset-m2').addEventListener('click', () => {
      gsap.killTweensOf(m2);
      Object.assign(m2, { rangeStart: 0, rangeEnd: 1, tickAlpha: 0, markerAlpha: 0,
                          markerValue: 0, zoomLevel: 0 });
      const z1 = document.getElementById('btn-zoom1');
      const z2 = document.getElementById('btn-zoom2');
      z1.disabled = false;
      z2.classList.add('hidden');
      z2.disabled = false;
    });

    // ── 说明文字 ─────────────────────────────────────────────
    function updateDesc(tab) {
      if (tab === 0) {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 模块一：切割模型</h3>
          <p>点击「切成 10 份」，把这个正方形平均分成 10 份。<br>
             然后点击任意格子选中它，右侧会同步显示对应的<strong>分数</strong>和<strong>小数</strong>。</p>
        </div>`;
      } else if (m2.zoomLevel < 2) {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 模块二：数轴定位</h3>
          <p>0 和 1 之间藏着很多数，点击「放大 ×10」看一看！<br>
             放大后可以拖动小红点，找到它对应的分数和小数。</p>
        </div>`;
      } else {
        descEl.innerHTML = `<div class="desc-box">
          <h3>📖 继续放大！</h3>
          <p>把 0.1 到 0.2 之间再次放大 10 倍，出现了 <strong>百分之一</strong>！<br>
             <code>0.01 = 1/100</code>，读作"零点零一"。<br>
             拖动红点，看看不同的百分之几对应什么小数。</p>
        </div>`;
      }
    }

    // ── 信息面板更新（HTML 结构，canvas 外） ─────────────────
    // 注：信息面板直接画在 canvas 里（见 drawInfoPanel），无需 DOM

    // ── p5 Sketch ────────────────────────────────────────────
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

      p.draw = () => {
        p.background(238, 244, 252);
        if (activeTab === 0) drawM1();
        else                 drawM2();
      };

      // ─────────────────────────────────────────────────────
      //  模块一：切割模型
      // ─────────────────────────────────────────────────────
      function drawM1() {
        grid.cutProgress = m1.cutProgress;
        grid.draw();

        const n = grid.getSelectedCount();

        // 切割前提示
        if (!m1.isCut) {
          p.noStroke();
          p.fill(110);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(13);
          p.text('点击「切成 10 份」开始', GX + GS / 2, GY + GS + 12);
          return;
        }

        // 切割后提示（未选中）
        if (n === 0) {
          p.noStroke();
          p.fill(110);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(13);
          p.text('点击任意格子选中，可多选', GX + GS / 2, GY + GS + 12);
        }

        drawInfoPanel(n);
      }

      function drawInfoPanel(n) {
        const x = InfoX, y = InfoY;
        const [cr, cg, cb] = MathAnim.cssRgb('--color-count');
        const [fr, fg, fb] = MathAnim.cssRgb('--color-fraction');
        const [dr, dg, db] = MathAnim.cssRgb('--color-decimal');

        // 份数
        p.noStroke();
        p.fill(cr, cg, cb);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(mobile ? 15 : 17);
        p.textStyle(p.BOLD);
        p.text(`选中：${n} 份`, x, y - (mobile ? 52 : 62));
        p.textStyle(p.NORMAL);

        if (n === 0) return;

        const numSz = mobile ? 24 : 30;
        const barW  = mobile ? 40 : 50;
        const gap   = mobile ? 44 : 58;

        // 分数（左）
        const fx = x - gap;
        p.noStroke();
        p.fill(fr, fg, fb);
        p.textStyle(p.BOLD);
        p.textSize(numSz);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(n, fx, y - 4);
        p.stroke(fr, fg, fb);
        p.strokeWeight(2.5);
        p.line(fx - barW / 2, y, fx + barW / 2, y);
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.text('10', fx, y + 4);
        p.textStyle(p.NORMAL);

        // 等号
        p.fill(100);
        p.textSize(mobile ? 20 : 24);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('=', x, y);

        // 小数（右）
        p.fill(dr, dg, db);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(mobile ? 34 : 44);
        p.textStyle(p.BOLD);
        p.text((n / 10).toFixed(1), x + gap, y);
        p.textStyle(p.NORMAL);

        // 读法提示
        const READINGS = ['', '零点一','零点二','零点三','零点四','零点五',
                              '零点六','零点七','零点八','零点九','一（整体）'];
        if (CW >= 360) {
          p.fill(140);
          p.textSize(11);
          p.textAlign(p.CENTER, p.TOP);
          p.text(`读作："${READINGS[n] ?? ''}"`, x + gap, y + (mobile ? 22 : 28));
        }
      }

      // ─────────────────────────────────────────────────────
      //  模块二：数轴定位
      // ─────────────────────────────────────────────────────
      function drawM2() {
        const { rangeStart: rs, rangeEnd: re, tickAlpha, markerValue: mv, markerAlpha, zoomLevel } = m2;
        const [ar, ag, ab] = MathAnim.cssRgb('--color-axis');
        const [mr, mg, mb] = MathAnim.cssRgb('--color-marker');
        const [fr, fg, fb] = MathAnim.cssRgb('--color-fraction');
        const [dr, dg, db] = MathAnim.cssRgb('--color-decimal');
        const range  = re - rs;
        const digits = zoomLevel >= 2 ? 2 : 1;

        // ── 数轴主体 ──
        p.stroke(ar, ag, ab);
        p.strokeWeight(2.5);
        p.line(NLX, NLY, NLX + NLW, NLY);
        p.fill(ar, ag, ab);
        p.noStroke();
        p.triangle(NLX + NLW + 10, NLY, NLX + NLW, NLY - 5, NLX + NLW, NLY + 5);

        // ── 端点刻度 ──
        drawTick(rs, 12, rs.toFixed(digits), 255, ar, ag, ab);
        drawTick(re, 12, re.toFixed(digits), 255, ar, ag, ab);

        // ── 内部刻度（渐显） ──
        if (tickAlpha > 0) {
          const step = range / 10;
          for (let i = 1; i <= 9; i++) {
            const v = rs + i * step;
            drawTick(v, 7, v.toFixed(digits), tickAlpha, ar, ag, ab);
          }
        }

        // ── 标记点 ──
        if (markerAlpha > 0 && mv >= rs && mv <= re) {
          const mx2 = valToX(mv);
          p.noStroke();
          p.fill(mr, mg, mb, markerAlpha * 0.2);
          p.circle(mx2, NLY, 30);
          p.fill(mr, mg, mb, markerAlpha);
          p.circle(mx2, NLY, 16);

          // 值标注（上方）
          const n = Math.round(mv * (zoomLevel >= 2 ? 100 : 10));
          const d = zoomLevel >= 2 ? 100 : 10;

          // 小数值
          p.fill(dr, dg, db, markerAlpha);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.textSize(mobile ? 20 : 24);
          p.textStyle(p.BOLD);
          p.text(mv.toFixed(digits), mx2, NLY - 36);
          p.textStyle(p.NORMAL);

          // 分数（更上方）
          if (n > 0) {
            const barW = 28;
            const fy   = NLY - 70;
            p.fill(fr, fg, fb, markerAlpha);
            p.textStyle(p.BOLD);
            p.textSize(17);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(n, mx2, fy - 3);
            p.stroke(fr, fg, fb, markerAlpha);
            p.strokeWeight(2);
            p.line(mx2 - barW, fy, mx2 + barW, fy);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.text(d, mx2, fy + 3);
            p.textStyle(p.NORMAL);
          }
        }

        // ── 初始提示（未放大时） ──
        if (zoomLevel === 0) {
          p.noStroke();
          p.fill(120);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(14);
          p.text('0 和 1 之间藏着很多数，点击「放大 ×10」看一看！', CW / 2, NLY + 28);
        }

        // ── 缩放标注 ──
        if (zoomLevel >= 1) {
          const label = zoomLevel >= 2 ? '放大了 100 倍（出现了百分之一！）' : '放大了 10 倍（出现了十分之一！）';
          p.noStroke();
          p.fill(MathAnim.cssRgb('--color-marker')[0],
                 MathAnim.cssRgb('--color-marker')[1],
                 MathAnim.cssRgb('--color-marker')[2], 200);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.textSize(12);
          p.text(label, CW / 2, NLY - 90);
        }
      }

      // 值 → 画布 x 坐标
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
          p.textSize(11);
          p.text(label, tx, NLY + h + 3);
        }
      }

      // ── 鼠标 / 触摸交互 ────────────────────────────────────
      p.mousePressed   = () => handlePress(p.mouseX, p.mouseY);
      p.touchStarted   = () => { handlePress(p.touches[0].x, p.touches[0].y); return false; };
      p.mouseDragged   = () => handleDrag(p.mouseX);
      p.touchMoved     = () => { handleDrag(p.touches[0].x); return false; };
      p.mouseReleased  = () => { nlDragging = false; };
      p.touchEnded     = () => { nlDragging = false; };

      function handlePress(mx, my) {
        if (activeTab === 0) {
          // 模块一：点击格子
          if (m1.isCut && grid) grid.handleClick(mx, my);
        } else {
          // 模块二：点击数轴区域开始拖拽
          if (m2.zoomLevel >= 1 && m2.tickAlpha > 200) {
            const onLine = my > NLY - 24 && my < NLY + 24 && mx > NLX - 10 && mx < NLX + NLW + 10;
            if (onLine) { nlDragging = true; updateMarker(mx); }
          }
        }
      }

      function handleDrag(mx) {
        if (activeTab === 1 && nlDragging) updateMarker(mx);
      }

      function updateMarker(mx) {
        const t    = Math.max(0, Math.min(1, (mx - NLX) / NLW));
        const range = m2.rangeEnd - m2.rangeStart;
        const raw  = m2.rangeStart + t * range;
        const snap = m2.zoomLevel >= 2 ? 0.01 : 0.1;
        const val  = Math.max(m2.rangeStart,
                       Math.min(m2.rangeEnd,
                         Math.round(raw / snap) * snap));
        gsap.to(m2, { markerValue: val, duration: 0.12, ease: 'power2.out' });
      }

      // ── 响应式 ─────────────────────────────────────────────
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
