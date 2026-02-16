// app.js - Main controller for Guitar Roadmap
window.App = (function () {
  let currentWeek = null;

  function init() {
    // Apply saved theme
    const theme = window.Storage.getTheme();
    if (theme === 'light') document.body.classList.add('light-theme');

    // Render dashboard
    UI.renderDashboard('all');
    UI.updateDashboardStats();
    UI.initSearch();

    // Phase filter tabs
    document.querySelectorAll('.phase-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.phase-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        UI.renderDashboard(tab.getAttribute('data-phase'));
      });
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      window.Storage.setTheme(isLight ? 'light' : 'dark');
    });

    // Nav home
    document.getElementById('nav-home').addEventListener('click', showDashboard);
    document.getElementById('back-to-dash').addEventListener('click', showDashboard);

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

    // Hide loading screen
    setTimeout(() => {
      const ls = document.getElementById('loading-screen');
      if (ls) {
        ls.classList.add('fade-out');
        setTimeout(() => ls.remove(), 500);
      }
    }, 800);
  }

  function showDashboard() {
    currentWeek = null;
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('week-view').classList.add('hidden');
    document.getElementById('breadcrumbs').classList.add('hidden');
    UI.renderDashboard(document.querySelector('.phase-tab.active')?.getAttribute('data-phase') || 'all');
    UI.updateDashboardStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showWeek(weekId, expandSection) {
    currentWeek = weekId;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('week-view').classList.remove('hidden');
    UI.renderWeekDetail(weekId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // If a section was specified, expand it
    if (expandSection) {
      setTimeout(() => {
        const sectionBody = document.getElementById('section-' + expandSection);
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { showDashboard, showWeek };
})();
