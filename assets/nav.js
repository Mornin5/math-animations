// ============================================================
//  Navigation — config + dynamic module loading + mobile UX
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
let activeLesson  = null;
let currentModule = null;
const loadedScripts = new Set();

// ============================================================
//  Mobile sidebar helpers
// ============================================================
function isMobileLayout() {
  return window.innerWidth <= 700;
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-backdrop').classList.add('visible');
  document.body.style.overflow = 'hidden'; // prevent background scroll
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

    // Header
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

    // Lessons list
    const lessonsEl = document.createElement('div');
    lessonsEl.className = 'nav-lessons';
    lessonsEl.setAttribute('role', 'list');

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
          // Auto-close sidebar on mobile after selecting a lesson
          if (isMobileLayout()) closeSidebar();
        };
        el.addEventListener('click', activate);
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
      }

      lessonsEl.appendChild(el);
    });

    // Toggle accordion
    const toggleUnit = () => {
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
    };

    header.addEventListener('click', toggleUnit);
    header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') toggleUnit(); });

    // Init collapsed
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

  // Update topbar title (mobile)
  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = lesson.title;

  // Switch view
  document.getElementById('welcome-screen').classList.add('hidden');
  const lessonView = document.getElementById('lesson-view');
  lessonView.classList.remove('hidden');

  // Update desktop header
  const breadcrumb = document.getElementById('lesson-breadcrumb');
  const titleEl    = document.getElementById('lesson-title');
  if (breadcrumb) breadcrumb.textContent = `${unit.title} · ${unit.subtitle}`;
  if (titleEl)    titleEl.textContent    = lesson.title;

  // Teardown current module
  destroyCurrentModule();

  // Clear containers
  document.getElementById('canvas-container').innerHTML     = '';
  document.getElementById('controls-container').innerHTML   = '';
  document.getElementById('description-container').innerHTML = '';

  // Scroll main to top
  const main = document.getElementById('main');
  if (main) main.scrollTop = 0;

  // Load script (or reuse cached)
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

  // ---- Mobile: topbar hamburger button ----
  const topbarMenu = document.getElementById('topbar-menu');
  if (topbarMenu) {
    topbarMenu.addEventListener('click', openSidebar);
  }

  // ---- Mobile: close sidebar via ✕ button inside sidebar ----
  const sidebarClose = document.getElementById('sidebar-close');
  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  // ---- Mobile: click backdrop to close sidebar ----
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
    // Touch gesture: swipe left to close
    let touchStartX = 0;
    document.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx < -60 && document.getElementById('sidebar').classList.contains('open')) {
        closeSidebar();
      }
    }, { passive: true });
  }

  // ---- Close sidebar on Escape key ----
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
  });

  // ---- Re-open sidebar if window resizes to desktop (cleanup) ----
  window.addEventListener('resize', () => {
    if (!isMobileLayout()) {
      closeSidebar();
    }
  });
});
