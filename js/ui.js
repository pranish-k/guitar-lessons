// ui.js - UI rendering for Guitar Roadmap
window.UI = (function () {

  // Render the dashboard week cards
  function renderDashboard(filter) {
    const grid = document.getElementById('weeks-grid');
    if (!grid || !window.ROADMAP_DATA) return;
    grid.innerHTML = '';

    const weeks = window.ROADMAP_DATA.weeks.filter(w => {
      if (!filter || filter === 'all') return true;
      return w.phase === parseInt(filter);
    });

    weeks.forEach((week, i) => {
      const progress = window.Storage.getWeekProgress(week.id);
      const practiceTime = window.Storage.getWeekPracticeTime(week.id);
      const phase = window.ROADMAP_DATA.phases.find(p => p.weeks.includes(week.id));

      const card = document.createElement('div');
      card.className = 'week-card phase-' + week.phase;
      card.setAttribute('data-week', week.id);
      card.style.animationDelay = (i * 0.06) + 's';

      card.innerHTML = `
        <div class="card-lanyard"></div>
        <div class="card-phase-stripe">Phase ${week.phase}</div>
        <div class="card-body">
          <div class="card-badge">${week.id}</div>
          <h3 class="card-title">${escapeHtml(week.title)}</h3>
          <p class="card-subtitle">${escapeHtml(week.checkpoints.length)} checkpoints</p>
          <div class="card-stats">
            <span class="card-stat">${progress.percent}% done</span>
            <span class="card-stat">${formatMinutes(practiceTime)}</span>
          </div>
          <div class="card-progress">
            <div class="card-progress-fill" style="width:${progress.percent}%"></div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        window.App.showWeek(week.id);
      });

      grid.appendChild(card);
    });
  }

  // Update dashboard stats
  function updateDashboardStats() {
    const overall = window.Storage.getOverallProgress();
    const totalTime = window.Storage.getTotalPracticeTime();

    const statCompleted = document.getElementById('stat-completed');
    const statHours = document.getElementById('stat-hours');
    const statPercent = document.getElementById('stat-percent');
    const neckFill = document.getElementById('neck-fill');

    if (statCompleted) statCompleted.textContent = overall.done + '/' + overall.total;
    if (statHours) statHours.textContent = formatMinutes(totalTime);
    if (statPercent) statPercent.textContent = overall.percent + '%';
    if (neckFill) neckFill.style.width = overall.percent + '%';

    // Update fret dots
    document.querySelectorAll('.fret-dot').forEach(dot => {
      const weekId = parseInt(dot.getAttribute('data-week'));
      const wp = window.Storage.getWeekProgress(weekId);
      dot.classList.toggle('completed', wp.percent === 100);
      dot.classList.toggle('in-progress', wp.percent > 0 && wp.percent < 100);
    });
  }

  // Render week detail view
  function renderWeekDetail(weekId) {
    const week = window.ROADMAP_DATA.weeks.find(w => w.id === weekId);
    if (!week) return;

    // Header
    document.getElementById('week-badge').textContent = 'WEEK ' + week.id;
    document.getElementById('week-badge').className = 'week-badge phase-badge-' + week.phase;
    document.getElementById('week-title').textContent = week.title;
    document.getElementById('week-intro').textContent = week.whatYoullLearn || '';

    // Sticky nav title
    const navTitle = document.getElementById('week-nav-title');
    if (navTitle) navTitle.textContent = 'WEEK ' + week.id;

    // Progress
    const progress = window.Storage.getWeekProgress(weekId);
    document.getElementById('week-progress-fill').style.width = progress.percent + '%';
    document.getElementById('week-progress-text').textContent = progress.percent + '%';

    // Prev/Next
    document.getElementById('prev-week').style.visibility = weekId > 1 ? 'visible' : 'hidden';
    document.getElementById('next-week').style.visibility = weekId < 12 ? 'visible' : 'hidden';

    // Content sections
    const contentEl = document.getElementById('week-content');
    contentEl.innerHTML = '';

    // Render each section
    week.sections.forEach(section => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'content-section';
      sectionEl.innerHTML = `
        <button class="section-toggle" data-section="${section.id}">
          <span class="section-title-text">${escapeHtml(section.title)}</span>
          <span class="toggle-icon">+</span>
        </button>
        <div class="section-body collapsed" id="section-${section.id}">
          <div class="section-inner">${section.content}</div>
        </div>
      `;
      contentEl.appendChild(sectionEl);
    });

    // Checkpoint section
    if (week.checkpoints && week.checkpoints.length > 0) {
      const cpSection = document.createElement('div');
      cpSection.className = 'content-section checkpoint-section';
      let cpLabel = 'Checkpoint';
      if (week.id === 8) cpLabel = 'Self-Assessment Checklist';
      cpSection.innerHTML = `
        <button class="section-toggle" data-section="checkpoints">
          <span class="section-title-text">${cpLabel}</span>
          <span class="toggle-icon">+</span>
        </button>
        <div class="section-body collapsed" id="section-checkpoints">
          <div class="section-inner">
            <div class="checkpoint-list">
              ${week.checkpoints.map(cp => {
                const checked = window.Storage.isCheckpointDone(weekId, cp.id);
                return `
                  <label class="checkpoint-item ${checked ? 'checked' : ''}">
                    <input type="checkbox" data-week="${weekId}" data-cp="${cp.id}" ${checked ? 'checked' : ''}>
                    <span class="check-box"></span>
                    <span class="check-text">${escapeHtml(cp.text)}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
      contentEl.appendChild(cpSection);
    }

    // Wire up section toggles
    contentEl.querySelectorAll('.section-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const body = btn.nextElementSibling;
        const icon = btn.querySelector('.toggle-icon');
        body.classList.toggle('collapsed');
        icon.textContent = body.classList.contains('collapsed') ? '+' : '−';
      });
    });

    // Expand first section by default
    const firstBody = contentEl.querySelector('.section-body');
    if (firstBody) {
      firstBody.classList.remove('collapsed');
      const firstIcon = contentEl.querySelector('.toggle-icon');
      if (firstIcon) firstIcon.textContent = '−';
    }

    // Wire up checkboxes
    contentEl.querySelectorAll('.checkpoint-item input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const wk = parseInt(cb.getAttribute('data-week'));
        const cpId = cb.getAttribute('data-cp');
        window.Storage.setCheckpoint(wk, cpId, cb.checked);
        cb.closest('.checkpoint-item').classList.toggle('checked', cb.checked);
        updateWeekProgress(wk);
        updateDashboardStats();
      });
    });

    // Notes
    const notesArea = document.getElementById('week-notes');
    notesArea.value = window.Storage.getNotes(weekId);
    notesArea.oninput = debounce(() => {
      window.Storage.saveNotes(weekId, notesArea.value);
      flashSaved();
    }, 500);

    // Session date default
    document.getElementById('session-date').value = new Date().toISOString().split('T')[0];

    // Render sessions
    renderSessions(weekId);

    // Breadcrumbs
    updateBreadcrumbs(week);
  }

  function updateWeekProgress(weekId) {
    const progress = window.Storage.getWeekProgress(weekId);
    const fill = document.getElementById('week-progress-fill');
    const text = document.getElementById('week-progress-text');
    if (fill) fill.style.width = progress.percent + '%';
    if (text) text.textContent = progress.percent + '%';
  }

  function renderSessions(weekId) {
    const container = document.getElementById('session-history');
    if (!container) return;
    const sessions = window.Storage.getSessions(weekId);

    if (sessions.length === 0) {
      container.innerHTML = '<p class="empty-sessions">No sessions logged yet. Hit REC to log your first session.</p>';
      return;
    }

    container.innerHTML = sessions.map(s => `
      <div class="session-card">
        <div class="session-info">
          <span class="session-date">${formatDate(s.date)}</span>
          <span class="session-type">${escapeHtml(s.type || 'Practice')}</span>
          <span class="session-duration">${s.duration} min</span>
        </div>
        <button class="session-delete" data-week="${weekId}" data-session="${s.id}" title="Delete session">&times;</button>
      </div>
    `).join('');

    const totalMin = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    container.innerHTML += `<div class="sessions-total">Total: ${formatMinutes(totalMin)}</div>`;

    container.querySelectorAll('.session-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wk = parseInt(btn.getAttribute('data-week'));
        const sid = btn.getAttribute('data-session');
        window.Storage.removeSession(wk, sid);
        renderSessions(wk);
        updateDashboardStats();
      });
    });
  }

  function updateBreadcrumbs(week) {
    const bc = document.getElementById('breadcrumbs');
    if (!bc) return;
    const phase = window.ROADMAP_DATA.phases.find(p => p.weeks.includes(week.id));
    bc.innerHTML = `
      <span class="crumb clickable" data-view="dashboard">Dashboard</span>
      <span class="crumb-sep">&rsaquo;</span>
      <span class="crumb">${phase ? 'Phase ' + phase.id : ''}</span>
      <span class="crumb-sep">&rsaquo;</span>
      <span class="crumb active">Week ${week.id}</span>
    `;
    bc.classList.remove('hidden');
    bc.querySelector('.clickable').addEventListener('click', () => {
      window.App.showDashboard();
    });
  }

  function flashSaved() {
    const ind = document.getElementById('save-indicator');
    if (!ind) return;
    ind.textContent = 'Saved ✓';
    ind.classList.add('show');
    setTimeout(() => {
      ind.classList.remove('show');
    }, 1500);
  }

  // Search
  function initSearch() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    input.addEventListener('input', debounce(() => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { results.innerHTML = ''; results.classList.remove('open'); return; }

      const matches = [];
      window.ROADMAP_DATA.weeks.forEach(week => {
        // Search title
        if (week.title.toLowerCase().includes(q)) {
          matches.push({ weekId: week.id, text: 'Week ' + week.id + ': ' + week.title, type: 'week' });
        }
        // Search sections
        week.sections.forEach(s => {
          if (s.content.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)) {
            matches.push({ weekId: week.id, sectionId: s.id, text: 'Week ' + week.id + ' > ' + s.title, type: 'section' });
          }
        });
        // Search checkpoints
        week.checkpoints.forEach(cp => {
          if (cp.text.toLowerCase().includes(q)) {
            matches.push({ weekId: week.id, text: 'Week ' + week.id + ': ' + cp.text, type: 'checkpoint' });
          }
        });
      });

      if (matches.length === 0) {
        results.innerHTML = '<div class="search-item empty">No results found</div>';
      } else {
        results.innerHTML = matches.slice(0, 10).map(m => `
          <div class="search-item" data-week="${m.weekId}" data-section="${m.sectionId || ''}">
            <span class="search-type">${m.type}</span>
            ${escapeHtml(m.text)}
          </div>
        `).join('');
      }
      results.classList.add('open');

      results.querySelectorAll('.search-item[data-week]').forEach(item => {
        item.addEventListener('click', () => {
          const wk = parseInt(item.getAttribute('data-week'));
          const sec = item.getAttribute('data-section');
          window.App.showWeek(wk, sec);
          input.value = '';
          results.innerHTML = '';
          results.classList.remove('open');
        });
      });
    }, 250));

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
        results.innerHTML = '';
        results.classList.remove('open');
      }
    });
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatMinutes(min) {
    if (!min) return '0h';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return m + 'm';
    if (m === 0) return h + 'h';
    return h + 'h ' + m + 'm';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  return {
    renderDashboard, updateDashboardStats, renderWeekDetail,
    renderSessions, updateWeekProgress, initSearch
  };
})();
