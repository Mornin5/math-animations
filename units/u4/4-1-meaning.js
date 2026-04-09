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
        title:  '认识整体',
        desc:   '这个大长方形代表<strong>1个整体</strong>。在数学里，整体用数字"1"表示。',
      },
      {
        title:  '平均分成10份',
        desc:   '把这个整体<strong>平均分成10份</strong>，每一份的大小完全相同。',
      },
      {
        title:  '认识十分之一 (0.1)',
        desc:   '取其中的<strong>1份</strong>，就是这个整体的<strong>十分之一</strong>。<br>写作：<code>1/10 = 0.1</code>，读作"零点一"。',
      },
      {
        title:  '认识几个十分之一',
        desc:   '取其中的<strong>3份</strong>，就是 3个十分之一，即<strong>十分之三</strong>。<br>写作：<code>3/10 = 0.3</code>，读作"零点三"。',
      },
      {
        title:  '自由探索',
        desc:   '拖动下方滑块，选择不同的份数，观察分数和小数是如何变化的。',
      },
    ];

    // ---- Shared animation state ----------------------------
    //  GSAP directly mutates these numeric fields each frame
    const anim = {
      cutProgress:    0,   // 0→1, controls how many cut lines appear
      highlightCount: 0,   // 0→10, controls shaded parts (float for tween)
    };

    let currentStep = 0;
    let sliderWrap  = null;

    // ---- Build controls ------------------------------------
    controlsEl.innerHTML = `
      <div class="controls">
        <button class="btn btn-secondary" id="ma-prev">&#9664; 上一步</button>
        <span  class="step-badge"         id="ma-badge">第 1 步 / 共 5 步</span>
        <button class="btn btn-primary"   id="ma-next">下一步 &#9654;</button>
        <button class="btn btn-secondary" id="ma-reset">↺ 重置</button>
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

    const btnPrev  = document.getElementById('ma-prev');
    const btnNext  = document.getElementById('ma-next');
    const btnReset = document.getElementById('ma-reset');
    const badge    = document.getElementById('ma-badge');
    const slider   = document.getElementById('ma-slider');
    const sliderValEl = document.getElementById('ma-sliderVal');

    // ---- Step transitions ----------------------------------
    const goTo = (step) => {
      currentStep = step;
      badge.textContent = `第 ${step + 1} 步 / 共 ${STEPS.length} 步`;
      btnPrev.disabled  = (step === 0);
      btnNext.disabled  = (step === STEPS.length - 1);

      // Kill running tweens
      gsap.killTweensOf(anim);

      // Update description
      descEl.innerHTML = `
        <div class="desc-box">
          <h3>📖 ${STEPS[step].title}</h3>
          <p>${STEPS[step].desc}</p>
        </div>
      `;

      // Slider visibility
      sliderWrap.style.display = (step === 4) ? 'block' : 'none';

      switch (step) {
        case 0:
          gsap.to(anim, { cutProgress: 0, highlightCount: 0, duration: 0.4, ease: 'power2.out' });
          break;

        case 1:
          gsap.to(anim, {
            cutProgress: 1,
            highlightCount: 0,
            duration: 1.4,
            ease: 'power2.inOut',
          });
          break;

        case 2:
          gsap.to(anim, { cutProgress: 1, duration: 0.25, onComplete: () => {
            gsap.to(anim, { highlightCount: 1, duration: 0.55, ease: 'back.out(2)' });
          }});
          break;

        case 3:
          gsap.to(anim, { cutProgress: 1, duration: 0.2, onComplete: () => {
            gsap.to(anim, { highlightCount: 3, duration: 0.75, ease: 'power2.out' });
          }});
          break;

        case 4:
          gsap.to(anim, { cutProgress: 1, duration: 0.2 });
          // sync slider
          slider.value = Math.round(anim.highlightCount);
          sliderValEl.textContent = slider.value;
          break;
      }
    };

    btnPrev.addEventListener('click',  () => { if (currentStep > 0) goTo(currentStep - 1); });
    btnNext.addEventListener('click',  () => { if (currentStep < STEPS.length - 1) goTo(currentStep + 1); });
    btnReset.addEventListener('click', () => goTo(0));

    slider.addEventListener('input', () => {
      const v = parseInt(slider.value);
      sliderValEl.textContent = v;
      gsap.to(anim, { highlightCount: v, duration: 0.3, ease: 'power2.out' });
    });

    // ---- p5 Sketch -----------------------------------------
    this.sketch = new p5((p) => {

      // Canvas geometry (recalculated on resize)
      let CW, CH;
      let RX, RY, RW, RH;    // cutting rectangle
      let partW;
      let nlY;                // number-line Y
      let fdY;                // fraction/decimal display Y

      // Component instances
      let numberLine;

      // --------------------------------------------------
      p.setup = () => {
        computeLayout();
        const canvas = p.createCanvas(CW, CH);
        canvas.elt.style.borderRadius = '10px';
        p.textFont('system-ui, "PingFang SC", "Microsoft YaHei", sans-serif');
        buildComponents();
        goTo(0);
      };

      // --------------------------------------------------
      p.draw = () => {
        p.background(238, 244, 252);

        const hc   = Math.round(anim.highlightCount);   // integer 0-10
        const cuts = anim.cutProgress * 9;               // 0 to 9 (float)

        drawRect(hc, cuts);
        drawFractionDecimal(hc);

        numberLine.setMarker(hc > 0 ? hc / 10 : null);
        numberLine.draw();
      };

      // --------------------------------------------------
      function computeLayout() {
        const containerW = canvasEl.clientWidth || 760;
        CW = Math.min(containerW - 32, 760);
        CH = 450;

        RW = Math.round(CW * 0.76);
        RH = 130;
        RX = Math.round((CW - RW) / 2);
        RY = 54;
        partW = RW / 10;

        fdY  = RY + RH + 72;
        nlY  = RY + RH + 175;
      }

      function buildComponents() {
        numberLine = new MathAnim.NumberLine(p, {
          x: RX, y: nlY, width: RW,
          min: 0, max: 1, ticks: 10,
          showLabels: true,
        });
      }

      // --------------------------------------------------
      //  Main rectangle (切割模型)
      // --------------------------------------------------
      function drawRect(hc, cuts) {
        const fullCuts    = Math.floor(cuts);          // completed dividers
        const partialFrac = cuts - fullCuts;           // growing fraction (0-1)

        // ---- Background fill --
        p.noStroke();
        p.fill(210, 232, 255);
        p.rect(RX, RY, RW, RH, 5);

        // ---- Highlighted parts --
        for (let i = 0; i < hc; i++) {
          // Gradient-like effect: slightly lighter on top
          const shade = (i % 2 === 0) ? [255, 112, 67, 210] : [255, 138, 101, 210];
          p.noStroke();
          p.fill(...shade);
          p.rect(RX + i * partW + 1, RY + 1, partW - 2, RH - 2, 3);

          // Part number (white, centred)
          p.fill(255, 255, 255, 230);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);
          p.textStyle(p.BOLD);
          p.text(i + 1, RX + i * partW + partW / 2, RY + RH / 2);
          p.textStyle(p.NORMAL);
        }

        // ---- Unshaded part numbers (visible once fully cut) --
        if (cuts >= 8.95) {
          for (let i = hc; i < 10; i++) {
            p.fill(21, 101, 192, 120);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(12);
            p.text(i + 1, RX + i * partW + partW / 2, RY + RH / 2);
          }
        }

        // ---- Outer border --
        p.noFill();
        p.stroke(21, 101, 192);
        p.strokeWeight(3);
        p.rect(RX, RY, RW, RH, 5);

        // ---- Cut lines (animated "knife slicing down") --
        p.stroke(21, 101, 192, 170);
        p.strokeWeight(1.5);
        for (let i = 1; i <= fullCuts; i++) {
          const cx = RX + i * partW;
          p.line(cx, RY + 2, cx, RY + RH - 2);
        }
        // Growing (partial) cut
        if (fullCuts < 9 && partialFrac > 0.01) {
          const cx = RX + (fullCuts + 1) * partW;
          const h  = (RH - 4) * partialFrac;
          p.line(cx, RY + 2, cx, RY + 2 + h);
        }

        // ---- Step 0: big "1" label --
        if (currentStep === 0) {
          p.noStroke();
          p.fill(21, 101, 192, 200);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(58);
          p.textStyle(p.BOLD);
          p.text('1', RX + RW / 2, RY + RH / 2 + 5);
          p.textStyle(p.NORMAL);
        }

        // ---- Label below rect --
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(13);
        if (currentStep === 0) {
          p.fill(21, 101, 192, 180);
          p.text('1 个整体', RX + RW / 2, RY + RH + 10);
        } else if (cuts >= 8.95) {
          p.fill(80);
          p.text('平均分成 10 份，每份是整体的  1/10', RX + RW / 2, RY + RH + 10);
        }

        // ---- Bracket above highlighted region (steps 2-4) --
        if (currentStep >= 2 && hc > 0) {
          const endX  = RX + hc * partW;
          const midX  = RX + hc * partW / 2;
          const bracY = RY - 10;

          p.stroke(255, 87, 34);
          p.strokeWeight(2);
          p.noFill();
          p.line(RX + 2, bracY, endX - 2, bracY);
          p.line(RX + 2, bracY, RX + 2,   bracY + 6);
          p.line(endX - 2, bracY, endX - 2, bracY + 6);

          p.noStroke();
          p.fill(255, 87, 34);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.textSize(13);
          p.textStyle(p.BOLD);
          p.text(`${hc} 份`, midX, bracY - 2);
          p.textStyle(p.NORMAL);
        }
      }

      // --------------------------------------------------
      //  Fraction / Decimal display (steps 2-4, hc > 0)
      // --------------------------------------------------
      function drawFractionDecimal(hc) {
        if (currentStep < 2 || hc === 0) return;

        const cx = CW / 2;
        const cy = fdY;
        const gap = Math.min(RW * 0.28, 130);

        // ---- Fraction (left) --
        const fx = cx - gap;
        const numSz = 34;
        const barW  = 50;
        p.push();
        p.noStroke();
        p.fill(21, 101, 192);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(numSz);
        p.text(hc, fx, cy - 4);
        p.stroke(21, 101, 192);
        p.strokeWeight(2.5);
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
        p.textSize(26);
        p.text('=', cx, cy);

        // ---- Decimal (right) --
        const dx = cx + gap;
        p.noStroke();
        p.fill(192, 57, 43);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(46);
        p.textStyle(p.BOLD);
        p.text((hc / 10).toFixed(1), dx, cy);
        p.textStyle(p.NORMAL);

        // Reading hint
        p.fill(120);
        p.textSize(12);
        p.textAlign(p.CENTER, p.TOP);
        const reading = hc === 1 ? '零点一' :
                        hc === 2 ? '零点二' :
                        hc === 3 ? '零点三' :
                        hc === 4 ? '零点四' :
                        hc === 5 ? '零点五' :
                        hc === 6 ? '零点六' :
                        hc === 7 ? '零点七' :
                        hc === 8 ? '零点八' :
                        hc === 9 ? '零点九' : '零点十（即1）';
        p.text(`读作："${reading}"`, dx, cy + 30);
      }

      // --------------------------------------------------
      p.windowResized = () => {
        computeLayout();
        p.resizeCanvas(CW, CH);
        if (numberLine) {
          numberLine.x     = RX;
          numberLine.y     = nlY;
          numberLine.width = RW;
        }
      };

    }, canvasEl);   // second arg → p5 instance mode: canvas appended to canvasEl
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
