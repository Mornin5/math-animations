// ============================================================
//  Navigation — config + dynamic module loading
// ============================================================

const NAV_CONFIG = [
  {
    id: 'u4',
    title: '第四单元',
    subtitle: '小数的初步认识',
    icon: '🔢',
    lessons: [
      { id: '4-1', title: '4-1 小数的意义',      key: 'u4/4-1', file: 'units/u4/4-1-meaning.js' },
      { id: '4-2', title: '4-2 小数的读写',      key: 'u4/4-2', file: null },
      { id: '4-3', title: '4-3 小数的大小比较',  key: 'u4/4-3', file: null },
      { id: '4-4', title: '4-4 小数加减法',      key: 'u4/4-4', file: null },
    ],
  },
  {
    id: 'u5',
    title: '第五单元',
    subtitle: '三位数乘两位数',
    icon: '✖️',
    lessons: [
      { id: '5-1', title: '5-1 口算乘法',  key: 'u5/5-1', file: null },
      { id: '5-2', title: '5-2 笔算乘法',  key: 'u5/5-2', file: null },
      { id: '5-3', title: '5-3 乘法估算',  key: 'u5/5-3', file: null },
    ],
  },
  {
    id: 'u6',
    title: '第六单元',
    subtitle: '面积',
    icon: '📐',
    lessons: [
      { id: '6-1', title: '6-1 面积的意义', key: 'u6/6-1', file: null },
      { id: '6-2', title: '6-2 面积单位',   key: 'u6/6-2', file: null },
    ],
  },
];

// ---- State ----
let activeLesson  = null;   // currently highlighted lesson id
let currentModule = null;   // currently running module instance
const loadedScripts = new Set();

// ============================================================
//  Render nav tree
// ============================================================
function renderNav() {
  const navTree = document.getElementById('nav-tree');
  navTree.innerHTML = '';

  NAV_CONFIG.forEach((unit, unitIdx) => {
    const unitEl = document.createElement('div');
    unitEl.className = 'nav-unit';

    // Header
    const header = document.createElement('div');
    header.className = 'nav-unit-header';
    header.innerHTML = `
      <span class="nav-unit-icon">${unit.icon}</span>
      <div class="nav-unit-text">
        <div class="nav-unit-title">${unit.title}</div>
        <div class="nav-unit-sub">${unit.subtitle}</div>
      </div>
      <span class="nav-unit-arrow">▶</span>
    `;

    // Lessons list
    const lessonsEl = document.createElement('div');
    lessonsEl.className = 'nav-lessons';

    unit.lessons.forEach(lesson => {
      const el = document.createElement('div');
      const hasFile = !!lesson.file;
      el.className = 'nav-lesson' + (hasFile ? '' : ' coming-soon');
      el.dataset.id = lesson.id;
      el.textContent = lesson.title;

      if (!hasFile) {
        const badge = document.createElement('span');
        badge.className = 'badge-soon';
        badge.textContent = '即将上线';
        el.appendChild(badge);
      } else {
        el.addEventListener('click', () => loadLesson(lesson, unit));
      }

      lessonsEl.appendChild(el);
    });

    // Toggle accordion
    header.addEventListener('click', () => {
      const isOpen = header.classList.contains('expanded');

      // Collapse all units
      document.querySelectorAll('.nav-unit-header.expanded').forEach(h => {
        h.classList.remove('expanded');
        const list = h.nextElementSibling;
        list.style.maxHeight = '0';
        list.style.opacity  = '0';
      });

      if (!isOpen) {
        header.classList.add('expanded');
        lessonsEl.style.maxHeight = lessonsEl.scrollHeight + 'px';
        lessonsEl.style.opacity   = '1';
      }
    });

    // Init closed
    lessonsEl.style.maxHeight = '0';
    lessonsEl.style.opacity   = '0';
    lessonsEl.style.overflow  = 'hidden';
    lessonsEl.style.transition = 'max-height 0.28s ease, opacity 0.22s ease';

    unitEl.appendChild(header);
    unitEl.appendChild(lessonsEl);
    navTree.appendChild(unitEl);

    // Auto-expand first unit
    if (unitIdx === 0) {
      header.classList.add('expanded');
      // Use rAF so layout is calculated first
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

  // Highlight active nav item
  document.querySelectorAll('.nav-lesson').forEach(el => el.classList.remove('active'));
  const navEl = document.querySelector(`.nav-lesson[data-id="${lesson.id}"]`);
  if (navEl) navEl.classList.add('active');

  // Switch view
  document.getElementById('welcome-screen').classList.add('hidden');
  const lessonView = document.getElementById('lesson-view');
  lessonView.classList.remove('hidden');

  // Update header
  document.getElementById('lesson-breadcrumb').textContent =
    `${unit.title} · ${unit.subtitle}`;
  document.getElementById('lesson-title').textContent = lesson.title;

  // Teardown current module
  destroyCurrentModule();

  // Clear containers
  document.getElementById('canvas-container').innerHTML    = '';
  document.getElementById('controls-container').innerHTML  = '';
  document.getElementById('description-container').innerHTML = '';

  // Load script (or reuse if already loaded)
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
  if (currentModule && typeof currentModule.destroy === 'function') {
    currentModule.destroy();
  }
  currentModule = null;
}

// ============================================================
//  Bootstrap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderNav();

  // Mobile sidebar toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
});
