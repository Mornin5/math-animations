// ============================================================
//  4-1 小数的意义 — 切割模型动画
//  知识点：把整体平均分成10份，认识十分之几与零点几
// ============================================================

MathAnim.register('u4/4-1', {
  sketch: null,

  // ----------------------------------------------------------
  //  init — 创建 p5 sketch 与控制面板
  // ----------------------------------------------------------
  init(canvasEl, controlsEl, descEl) {

    // ---- Step definitions ----------------------------------
    const STEPS = [
      {
        title: '认识整体',
        desc:  '这个大长方形代表<strong>1个整体</strong>。在数学里，整体用数字"1"表示。',
      },
      {
        title: '平均分成10份',
        desc:  '把这个整体<strong>平均分成10份</strong>，每一份的大小完全相同。',
      },
      {
        title: '认识十分之一 (0.1)',
        desc:  '取其中的<strong>1份</strong>，就是这个整体的<strong>十分之一</strong>。<br>写作：<code>1/10 = 0.1</code>，读作"零点一"。',
      },
      {
        title: '认识几个十分之一',
        desc:  '取其中的<strong>3份</strong>，就是 3个十分之一，即<strong>十分之三</strong>。<br>写作：<code>3/10 = 0.3</code>，读作"零点三"。',
      },
      {
        title: '自由探索',
        desc:  '拖动下方滑块，选择不同的份数，观察分数和小数是如何变化的。',
      },
    ];

    // ---- Shared animation state (GSAP mutates these) -------
    const anim = {
      cutProgress:    0,  // 0→1
      highlightCount: 0,  // 0→10 (float during tween)
    };

    let currentStep = 0;
    let sliderWrap  = null;

    // ---- Build controls ------------------------------------
    controlsEl.innerHTML = `
      <div class="controls">
        <button class="btn btn-secondary" id="ma-prev">&#9664; 上一步</button>
        <span  class="step-badge"         id="ma-badge">第 1 步 / 共 5 步</span>
        <button class="btn btn-primary"   id="ma-next">下一步 &#9654;</button>
        <button class="btn btn-secondary" id="ma-reset" title="重置">↺</button>
      </div>
    `;

    // Slider (only shown in step 4)
    sliderWrap = document.createElement('div');
    sliderWrap.className = 'slider-wrap';
    sliderWrap.innerHTML = `
      <label>选择份数：<strong id="ma-sliderVal">0</strong> 份</label>
      <input type="range" id="ma-slider" min="0" max="10" value="0" step="1">
    `;
    controlsEl.appendChild(sliderWrap);

    const btnPrev     = document.getElementById('ma-prev');
    const btnNext     = document.getElementById('ma-next');
    const btnReset    = document.getElementById('ma-reset');
    const badge       = document.getElementById('ma-badge');
    const slider      = document.getElementById('ma-slider');
    const sliderValEl = document.getElementById('ma-sliderVal');

    // ---- Step transitions ----------------------------------
    const goTo = (step) => {
      currentStep = step;
      badge.textContent  = `第 ${step + 1} 步 / 共 ${STEPS.length} 步`;
      btnPrev.disabled   = (step === 0);
      btnNext.disabled   = (step === STEPS.length - 1);

      gsap.killTweensOf(anim);

      // Update description
      descEl.innerHTML = `
        <div class="desc-box">
          <h3>📖 ${STEPS[step].title}</h3>
          <p>${STEPS[step].desc}</p>
        </div>
      `;

      sliderWrap.style.display = (step === 4) ? 'block' : 'none';

      switch (step) {
        case 0:
          gsap.to(anim, { cutProgress: 0, highlightCount: 0, duration: 0.4, ease: 'power2.out' });
          break;
        case 1:
          gsap.to(anim, { cutProgress: 1, highlightCount: 0, duration: 1.4, ease: 'power2.inOut' });
          break;
        case 2:
          gsap.to(anim, { cutProgress: 1, duration: 0.2, onComplete: () =>
            gsap.to(anim, { highlightCount: 1, duration: 0.55, ease: 'back.out(2)' })
          });
          break;
        case 3:
          gsap.to(anim, { cutProgress: 1, duration: 0.2, onComplete: () =>
            gsap.to(anim, { highlightCount: 3, duration: 0.75, ease: 'power2.out' })
          });
          break;
        case 4:
          gsap.to(anim, { cutProgress: 1, duration: 0.2 });
          slider.value = Math.round(anim.highlightCount);
          sliderValEl.textContent = slider.value;
          break;
      }
    };

    btnPrev.addEventListener('click',  () => { if (currentStep > 0)             goTo(currentStep - 1); });
    btnNext.addEventListener('click',  () => { if (currentStep < STEPS.length - 1) goTo(currentStep + 1); });
    btnReset.addEventListener('click', () => goTo(0));

    slider.addEventListener('input', () => {
      const v = parseInt(slider.value);
      sliderValEl.textContent = v;
      gsap.to(anim, { highlightCount: v, duration: 0.3, ease: 'power2.out' });
    });

    // ---- p5 Sketch -----------------------------------------
    this.sketch = new p5((p) => {

      // Layout values (recalculated on resize)
      let CW, CH;
      let RX, RY, RW, RH;   // cutting rectangle
      let partW;
      let fdY;               // fraction/decimal centre Y
      let nlY;               // number line Y
      let mobile;            // boolean: narrow canvas

      // Derived scale factor for in-canvas text/elements
      let sc;                // scale: 1.0 on desktop, smaller on mobile

      let numberLine;

      // --------------------------------------------------
      p.setup = () => {
        computeLayout();
        const canvas = p.createCanvas(CW, CH);
        canvas.elt.style.borderRadius = '8px';
        p.textFont('system-ui, "PingFang SC", "Microsoft YaHei", sans-serif');
        buildComponents();
        goTo(0);
      };

      // --------------------------------------------------
      p.draw = () => {
        p.background(238, 244, 252);

        const hc   = Math.round(anim.highlightCount);   // integer 0-10
        const cuts = anim.cutProgress * 9;               // 0→9 float

        drawRect(hc, cuts);
        drawFractionDecimal(hc);

        numberLine.setMarker(hc > 0 ? hc / 10 : null);
        numberLine.draw();
      };

      // --------------------------------------------------
      //  Layout geometry (adapts to container width)
      // --------------------------------------------------
      function computeLayout() {
        const containerW = canvasEl.clientWidth || 760;
        // Leave a little horizontal breathing room
        CW = Math.min(containerW - (containerW < 480 ? 16 : 32), 760);

        mobile = CW < 480;
        sc     = mobile ? (CW / 480) : 1;          // proportional scale factor

        if (mobile) {
          CH = 340;
          RW = Math.round(CW * 0.88);
          RH = Math.round(80 + (CW - 320) * 0.08); // 80-93px
          RY = 36;
        } else {
          CH = 450;
          RW = Math.round(CW * 0.76);
          RH = 130;
          RY = 54;
        }

        RX    = Math.round((CW - RW) / 2);
        partW = RW / 10;
        fdY   = RY + RH + Math.round(52 * sc);
        nlY   = RY + RH + Math.round(mobile ? 140 : 175);
      }

      function buildComponents() {
        numberLine = new MathAnim.NumberLine(p, {
          x: RX, y: nlY, width: RW,
          min: 0, max: 1, ticks: 10,
          // On narrow screens show labels only at 0, 0.5, 1
          labelStep: mobile ? 5 : 1,
        });
      }

      // --------------------------------------------------
      //  Cutting rectangle
      // --------------------------------------------------
      function drawRect(hc, cuts) {
        const fullCuts    = Math.floor(cuts);
        const partialFrac = cuts - fullCuts;

        // Base fill
        p.noStroke();
        p.fill(210, 232, 255);
        p.rect(RX, RY, RW, RH, 4);

        // Highlighted parts
        for (let i = 0; i < hc; i++) {
          p.noStroke();
          p.fill(i % 2 === 0 ? [255, 112, 67, 210] : [255, 138, 101, 210]);
          p.rect(RX + i * partW + 1, RY + 1, partW - 2, RH - 2, 3);

          // Part numbers on highlighted parts
          if (partW >= 18) {
            p.fill(255, 255, 255, 220);
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(Math.max(9, 12 * sc));
            p.textStyle(p.BOLD);
            p.text(i + 1, RX + i * partW + partW / 2, RY + RH / 2);
            p.textStyle(p.NORMAL);
          }
        }

        // Part numbers on unshaded parts (after full cut)
        if (cuts >= 8.95 && partW >= 18) {
          for (let i = hc; i < 10; i++) {
            p.fill(21, 101, 192, 110);
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(Math.max(9, 12 * sc));
            p.text(i + 1, RX + i * partW + partW / 2, RY + RH / 2);
          }
        }

        // Outer border
        p.noFill();
        p.stroke(21, 101, 192);
        p.strokeWeight(mobile ? 2 : 3);
        p.rect(RX, RY, RW, RH, 4);

        // Cut lines (knife-slicing animation: grow from top)
        p.stroke(21, 101, 192, 160);
        p.strokeWeight(mobile ? 1 : 1.5);
        for (let i = 1; i <= fullCuts; i++) {
          const cx = RX + i * partW;
          p.line(cx, RY + 2, cx, RY + RH - 2);
        }
        // Partial (growing) cut
        if (fullCuts < 9 && partialFrac > 0.01) {
          const cx = RX + (fullCuts + 1) * partW;
          p.line(cx, RY + 2, cx, RY + 2 + (RH - 4) * partialFrac);
        }

        // Step 0: large "1" label
        if (currentStep === 0) {
          p.noStroke();
          p.fill(21, 101, 192, 200);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(mobile ? 40 : 58);
          p.textStyle(p.BOLD);
          p.text('1', RX + RW / 2, RY + RH / 2 + 4);
          p.textStyle(p.NORMAL);
        }

        // Label below rectangle
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(Math.max(10, 13 * sc));
        if (currentStep === 0) {
          p.fill(21, 101, 192, 180);
          p.text('1 个整体', RX + RW / 2, RY + RH + 8);
        } else if (cuts >= 8.95) {
          p.fill(80);
          p.text('平均分成 10 份，每份是整体的  1/10', RX + RW / 2, RY + RH + 8);
        }

        // Bracket above highlighted region (steps 2-4)
        if (currentStep >= 2 && hc > 0) {
          const endX  = RX + hc * partW;
          const midX  = RX + hc * partW / 2;
          const bracY = RY - (mobile ? 8 : 10);

          p.stroke(255, 87, 34);
          p.strokeWeight(mobile ? 1.5 : 2);
          p.noFill();
          p.line(RX + 2, bracY, endX - 2, bracY);
          p.line(RX + 2, bracY, RX + 2,   bracY + 5);
          p.line(endX - 2, bracY, endX - 2, bracY + 5);

          p.noStroke();
          p.fill(255, 87, 34);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.textSize(Math.max(10, 13 * sc));
          p.textStyle(p.BOLD);
          p.text(`${hc} 份`, midX, bracY - 1);
          p.textStyle(p.NORMAL);
        }
      }

      // --------------------------------------------------
      //  Fraction = Decimal display (steps 2-4, hc > 0)
      // --------------------------------------------------
      function drawFractionDecimal(hc) {
        if (currentStep < 2 || hc === 0) return;

        const cx   = CW / 2;
        const cy   = fdY;
        // Gap between fraction and decimal: scales with canvas width
        const gap  = Math.round(Math.min(RW * 0.27, mobile ? 90 : 130));

        const numSz  = Math.round(mobile ? 24 : 34);
        const barW   = Math.round(mobile ? 38 : 52);
        const decSz  = Math.round(mobile ? 34 : 46);
        const hintSz = Math.round(mobile ? 10 : 12);

        // ---- Fraction (left of centre) --
        const fx = cx - gap;
        p.push();
        p.noStroke();
        p.fill(21, 101, 192);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(numSz);
        p.text(hc, fx, cy - 4);
        p.stroke(21, 101, 192);
        p.strokeWeight(2);
        p.line(fx - barW / 2, cy, fx + barW / 2, cy);
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.text('10', fx, cy + 4);
        p.textStyle(p.NORMAL);
        p.pop();

        // ---- "=" sign --
        p.noStroke();
        p.fill(80);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.round(mobile ? 20 : 26));
        p.text('=', cx, cy);

        // ---- Decimal (right of centre) --
        const dx = cx + gap;
        p.noStroke();
        p.fill(192, 57, 43);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(decSz);
        p.textStyle(p.BOLD);
        p.text((hc / 10).toFixed(1), dx, cy);
        p.textStyle(p.NORMAL);

        // Reading hint (hidden on very narrow canvas)
        if (CW >= 360) {
          const READINGS = ['', '零点一', '零点二', '零点三', '零点四', '零点五',
                                '零点六', '零点七', '零点八', '零点九', '一（整体）'];
          p.fill(140);
          p.textSize(hintSz);
          p.textAlign(p.CENTER, p.TOP);
          p.text(`读作："${READINGS[hc] || ''}"`, dx, cy + Math.round(decSz / 2) + 5);
        }
      }

      // --------------------------------------------------
      p.windowResized = () => {
        computeLayout();
        p.resizeCanvas(CW, CH);
        if (numberLine) {
          numberLine.x         = RX;
          numberLine.y         = nlY;
          numberLine.width     = RW;
          numberLine.labelStep = mobile ? 5 : 1;
        }
      };

    }, canvasEl);
  },

  // ----------------------------------------------------------
  //  destroy — clean up sketch & GSAP tweens
  // ----------------------------------------------------------
  destroy() {
    if (this.sketch) {
      this.sketch.remove();
      this.sketch = null;
    }
  },
});
