// app.js - Main controller for Guitar Roadmap
window.App = (function () {
  let currentWeek = null;
  let _pendingExpandSection = null;

  // ── Internal renderers (do DOM work) ──────────────────────────────────────

  function _renderDashboard() {
    currentWeek = null;
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('week-view').classList.add('hidden');
    document.getElementById('breadcrumbs').classList.add('hidden');
    UI.renderDashboard(document.querySelector('.phase-tab.active')?.getAttribute('data-phase') || 'all');
    UI.updateDashboardStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function _renderWeek(weekId) {
    currentWeek = weekId;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('week-view').classList.remove('hidden');
    UI.renderWeekDetail(weekId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const sec = _pendingExpandSection;
    if (sec) {
      _pendingExpandSection = null;
      setTimeout(() => {
        const sectionBody = document.getElementById('section-' + sec);
        if (sectionBody) {
          sectionBody.classList.remove('collapsed');
          const toggle = sectionBody.previousElementSibling;
          if (toggle) {
            const icon = toggle.querySelector('.toggle-icon');
            if (icon) icon.textContent = '−';
          }
          sectionBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }

  // ── Hash router ────────────────────────────────────────────────────────────

  function navigate() {
    const hash = window.location.hash;
    const weekMatch = hash.match(/^#week\/(\d+)$/);
    if (weekMatch) {
      const id = parseInt(weekMatch[1]);
      if (id >= 1 && id <= 12) {
        _renderWeek(id);
        return;
      }
    }
    _renderDashboard();
  }

  // ── Public navigation (just updates the hash; navigate() does the rendering) ──

  function showDashboard() {
    window.location.hash = '#dashboard';
  }

  function showWeek(weekId, expandSection) {
    _pendingExpandSection = expandSection || null;
    window.location.hash = '#week/' + weekId;
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    UI.initSearch();

    // Phase filter tabs
    document.querySelectorAll('.phase-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.phase-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        UI.renderDashboard(tab.getAttribute('data-phase'));
      });
    });

    // Nav home (logo)
    document.getElementById('nav-home').addEventListener('click', showDashboard);

    // Prev/Next week
    document.getElementById('prev-week').addEventListener('click', () => {
      if (currentWeek && currentWeek > 1) showWeek(currentWeek - 1);
    });
    document.getElementById('next-week').addEventListener('click', () => {
      if (currentWeek && currentWeek < 12) showWeek(currentWeek + 1);
    });

    // Log session
    document.getElementById('log-session').addEventListener('click', () => {
      if (!currentWeek) return;
      const date = document.getElementById('session-date').value;
      const duration = parseInt(document.getElementById('session-duration').value) || 90;
      const type = document.getElementById('session-type').value;
      if (!date) return;
      window.Storage.addSession(currentWeek, { date, duration, type });
      UI.renderSessions(currentWeek);
      UI.updateDashboardStats();
    });

    // Stopwatch
    let swInterval = null, swSeconds = 0, swRunning = false;
    const swDisplay = document.getElementById('stopwatch-display');
    const swContainer = document.getElementById('stopwatch');
    const swStartBtn = document.getElementById('sw-start');
    const swStopBtn = document.getElementById('sw-stop');

    swStartBtn.addEventListener('click', () => {
      if (swRunning) return;
      swRunning = true;
      swContainer.classList.add('running');
      swStartBtn.disabled = true;
      swStopBtn.disabled = false;
      swInterval = setInterval(() => {
        swSeconds++;
        const m = String(Math.floor(swSeconds / 60)).padStart(2, '0');
        const s = String(swSeconds % 60).padStart(2, '0');
        swDisplay.textContent = m + ':' + s;
      }, 1000);
    });

    swStopBtn.addEventListener('click', () => {
      if (!swRunning) return;
      swRunning = false;
      swContainer.classList.remove('running');
      clearInterval(swInterval);
      swInterval = null;
      swStartBtn.disabled = false;
      swStopBtn.disabled = true;
      document.getElementById('session-duration').value = Math.max(1, Math.round(swSeconds / 60));
    });

    document.getElementById('sw-reset').addEventListener('click', () => {
      swRunning = false;
      swContainer.classList.remove('running');
      clearInterval(swInterval);
      swInterval = null;
      swSeconds = 0;
      swDisplay.textContent = '00:00';
      swStartBtn.disabled = false;
      swStopBtn.disabled = true;
    });

    // Data management
    document.getElementById('data-mgmt-btn').addEventListener('click', () => {
      document.getElementById('data-modal').classList.remove('hidden');
    });
    document.getElementById('modal-close').addEventListener('click', () => {
      document.getElementById('data-modal').classList.add('hidden');
    });
    document.getElementById('export-btn').addEventListener('click', () => {
      window.Storage.exportData();
    });
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await window.Storage.importData(file);
        location.reload();
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    });
    document.getElementById('clear-btn').addEventListener('click', () => {
      if (confirm('Clear ALL progress? This cannot be undone.')) {
        window.Storage.clearAll();
        location.reload();
      }
    });

    // Close modal on backdrop click
    document.getElementById('data-modal').addEventListener('click', (e) => {
      if (e.target.id === 'data-modal') {
        document.getElementById('data-modal').classList.add('hidden');
      }
    });

    // Hash-based routing
    window.addEventListener('hashchange', navigate);
    navigate(); // render based on current URL hash on load

    // Hide loading screen
    setTimeout(() => {
      const ls = document.getElementById('loading-screen');
      if (ls) {
        ls.classList.add('fade-out');
        setTimeout(() => ls.remove(), 500);
      }
    }, 800);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { showDashboard, showWeek };
})();
