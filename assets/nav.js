// ============================================================
//  Navigation — 四年级下册（人教版）全册结构
// ============================================================

const NAV_CONFIG = [
  {
    id: 'u1', title: '第1单元', subtitle: '四则运算', icon: '➕',
    lessons: [
      { id: '1-1', title: '1-1 含括号的四则运算', key: 'u1/1-1', file: null },
      { id: '1-2', title: '1-2 运算顺序',         key: 'u1/1-2', file: null },
    ],
  },
  {
    id: 'u2', title: '第2单元', subtitle: '观察物体（二）', icon: '👁️',
    lessons: [
      { id: '2-1', title: '2-1 从不同方向观察', key: 'u2/2-1', file: null },
    ],
  },
  {
    id: 'u3', title: '第3单元', subtitle: '运算律', icon: '⚖️',
    lessons: [
      { id: '3-1', title: '3-1 加法交换律与结合律', key: 'u3/3-1', file: null },
      { id: '3-2', title: '3-2 乘法交换律与结合律', key: 'u3/3-2', file: null },
      { id: '3-3', title: '3-3 乘法分配律',         key: 'u3/3-3', file: null },
      { id: '3-4', title: '3-4 简便计算',           key: 'u3/3-4', file: null },
    ],
  },
  {
    id: 'u4', title: '第4单元', subtitle: '小数的意义和性质', icon: '🔢',
    lessons: [
      { id: '4-1', title: '4-1 小数的意义',              key: 'u4/4-1', file: 'units/u4/4-1-meaning.js' },
      { id: '4-2', title: '4-2 小数的读法和写法',        key: 'u4/4-2', file: null },
      { id: '4-3', title: '4-3 小数的性质',              key: 'u4/4-3', file: null },
      { id: '4-4', title: '4-4 小数的大小比较',          key: 'u4/4-4', file: null },
      { id: '4-5', title: '4-5 小数点移动',              key: 'u4/4-5', file: null },
      { id: '4-6', title: '4-6 解决问题',                key: 'u4/4-6', file: null },
      { id: '4-7', title: '4-7 小数与单位换算',          key: 'u4/4-7', file: null },
      { id: '4-8', title: '4-8 小数的近似数',            key: 'u4/4-8', file: null },
      { id: '4-9', title: '4-9 整理和复习',              key: 'u4/4-9', file: null },
    ],
  },
  {
    id: 'u5', title: '第5单元', subtitle: '三角形', icon: '📐',
    lessons: [
      { id: '5-1', title: '5-1 三角形的特性',   key: 'u5/5-1', file: null },
      { id: '5-2', title: '5-2 三角形的分类',   key: 'u5/5-2', file: null },
      { id: '5-3', title: '5-3 三角形的内角和', key: 'u5/5-3', file: null },
    ],
  },
  {
    id: 'u6', title: '第6单元', subtitle: '小数的加法和减法', icon: '➕',
    lessons: [
      { id: '6-1', title: '6-1 小数加减法',   key: 'u6/6-1', file: null },
      { id: '6-2', title: '6-2 混合运算',     key: 'u6/6-2', file: null },
    ],
  },
  {
    id: 'u7', title: '第7单元', subtitle: '图形的运动（二）', icon: '🔄',
    lessons: [
      { id: '7-1', title: '7-1 轴对称',   key: 'u7/7-1', file: null },
      { id: '7-2', title: '7-2 平移',     key: 'u7/7-2', file: null },
      { id: '7-3', title: '7-3 旋转',     key: 'u7/7-3', file: null },
    ],
  },
  {
    id: 'u8', title: '第8单元', subtitle: '平均数与条形统计图', icon: '📊',
    lessons: [
      { id: '8-1', title: '8-1 平均数',     key: 'u8/8-1', file: null },
      { id: '8-2', title: '8-2 条形统计图', key: 'u8/8-2', file: null },
    ],
  },
  {
    id: 'u9', title: '第9单元', subtitle: '数学广角——鸡兔同笼', icon: '🐇',
    lessons: [
      { id: '9-1', title: '9-1 鸡兔同笼', key: 'u9/9-1', file: null },
    ],
  },
];

// ---- State ----
let activeLesson  = null;
let currentModule = null;
const loadedScripts = new Set();

// ============================================================
//  Mobile sidebar helpers
// ============================================================
const isMobile = () => window.innerWidth <= 700;

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-backdrop').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('visible');
  document.body.style.overflow = '';
}

// ============================================================
//  Render nav tree
// ============================================================
function renderNav() {
  const navTree = document.getElementById('nav-tree');
  navTree.innerHTML = '';

  NAV_CONFIG.forEach((unit, unitIdx) => {
    const unitEl = document.createElement('div');
    unitEl.className = 'nav-unit';

    const header = document.createElement('div');
    header.className = 'nav-unit-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.innerHTML = `
      <span class="nav-unit-icon">${unit.icon}</span>
      <div class="nav-unit-text">
        <div class="nav-unit-title">${unit.title}</div>
        <div class="nav-unit-sub">${unit.subtitle}</div>
      </div>
      <span class="nav-unit-arrow">▶</span>
    `;

    const lessonsEl = document.createElement('div');
    lessonsEl.className = 'nav-lessons';

    unit.lessons.forEach(lesson => {
      const el = document.createElement('div');
      const hasFile = !!lesson.file;
      el.className = 'nav-lesson' + (hasFile ? '' : ' coming-soon');
      el.dataset.id = lesson.id;
      el.setAttribute('role', hasFile ? 'button' : 'listitem');
      el.setAttribute('tabindex', hasFile ? '0' : '-1');
      el.textContent = lesson.title;

      if (!hasFile) {
        const badge = document.createElement('span');
        badge.className = 'badge-soon';
        badge.textContent = '即将上线';
        el.appendChild(badge);
      } else {
        const activate = () => {
          loadLesson(lesson, unit);
          if (isMobile()) closeSidebar();
        };
        el.addEventListener('click', activate);
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
      }
      lessonsEl.appendChild(el);
    });

    const toggleUnit = () => {
      const isOpen = header.classList.contains('expanded');
      document.querySelectorAll('.nav-unit-header.expanded').forEach(h => {
        h.classList.remove('expanded');
        const list = h.nextElementSibling;
        list.style.maxHeight = '0';
        list.style.opacity   = '0';
      });
      if (!isOpen) {
        header.classList.add('expanded');
        lessonsEl.style.maxHeight = lessonsEl.scrollHeight + 'px';
        lessonsEl.style.opacity   = '1';
      }
    };

    header.addEventListener('click', toggleUnit);
    header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') toggleUnit(); });

    lessonsEl.style.maxHeight  = '0';
    lessonsEl.style.opacity    = '0';
    lessonsEl.style.overflow   = 'hidden';
    lessonsEl.style.transition = 'max-height 0.28s ease, opacity 0.22s ease';

    unitEl.appendChild(header);
    unitEl.appendChild(lessonsEl);
    navTree.appendChild(unitEl);

    // Auto-expand 第4单元 (current unit)
    if (unit.id === 'u4') {
      header.classList.add('expanded');
      requestAnimationFrame(() => {
        lessonsEl.style.maxHeight = lessonsEl.scrollHeight + 'px';
        lessonsEl.style.opacity   = '1';
      });
    }
  });
}

// ============================================================
//  Load & activate a lesson
// ============================================================
function loadLesson(lesson, unit) {
  if (activeLesson === lesson.id) return;
  activeLesson = lesson.id;

  document.querySelectorAll('.nav-lesson').forEach(el => el.classList.remove('active'));
  const navEl = document.querySelector(`.nav-lesson[data-id="${lesson.id}"]`);
  if (navEl) navEl.classList.add('active');

  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = lesson.title;

  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('lesson-view').classList.remove('hidden');

  const breadcrumb = document.getElementById('lesson-breadcrumb');
  const titleEl    = document.getElementById('lesson-title');
  if (breadcrumb) breadcrumb.textContent = `${unit.title} · ${unit.subtitle}`;
  if (titleEl)    titleEl.textContent    = lesson.title;

  destroyCurrentModule();

  ['canvas-container', 'controls-container', 'description-container'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });

  const main = document.getElementById('main');
  if (main) main.scrollTop = 0;

  if (loadedScripts.has(lesson.file)) {
    activateModule(lesson.key);
  } else {
    const s = document.createElement('script');
    s.src = lesson.file;
    s.onload  = () => { loadedScripts.add(lesson.file); activateModule(lesson.key); };
    s.onerror = () => {
      document.getElementById('canvas-container').innerHTML =
        '<p style="padding:40px;text-align:center;color:#999">模块加载失败，请检查网络后刷新重试。</p>';
    };
    document.head.appendChild(s);
  }
}

function activateModule(key) {
  const mod = MathAnim.getModule(key);
  if (!mod) { console.error('Module not found:', key); return; }
  currentModule = mod;
  mod.init(
    document.getElementById('canvas-container'),
    document.getElementById('controls-container'),
    document.getElementById('description-container')
  );
}

function destroyCurrentModule() {
  if (currentModule && typeof currentModule.destroy === 'function') currentModule.destroy();
  currentModule = null;
}

// ============================================================
//  Bootstrap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderNav();

  document.getElementById('topbar-menu').addEventListener('click', openSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);

  const backdrop = document.getElementById('sidebar-backdrop');
  backdrop.addEventListener('click', closeSidebar);

  let touchStartX = 0;
  document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientX - touchStartX < -60 &&
        document.getElementById('sidebar').classList.contains('open')) closeSidebar();
  }, { passive: true });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
  window.addEventListener('resize', () => { if (!isMobile()) closeSidebar(); });
});
