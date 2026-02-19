// storage.js - localStorage management for Guitar Roadmap
window.Storage = (function () {
  const STORAGE_KEY = 'guitar-roadmap-progress';
  const VERSION = 1;

  function getDefault() {
    return {
      version: VERSION,
      weeks: {},
      settings: { theme: 'dark' }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefault();
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return getDefault();
      if (!data.version) data.version = VERSION;
      if (!data.weeks) data.weeks = {};
      if (!data.settings) data.settings = { theme: 'dark' };
      return data;
    } catch (e) {
      console.warn('Failed to load progress, starting fresh', e);
      return getDefault();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }

  function getWeekData(weekId) {
    const data = load();
    if (!data.weeks[weekId]) {
      data.weeks[weekId] = {
        checkpoints: {},
        notes: '',
        sessions: []
      };
    }
    return data.weeks[weekId];
  }

  function toggleCheckpoint(weekId, checkpointId) {
    const data = load();
    if (!data.weeks[weekId]) {
      data.weeks[weekId] = { checkpoints: {}, notes: '', sessions: [] };
    }
    const current = !!data.weeks[weekId].checkpoints[checkpointId];
    data.weeks[weekId].checkpoints[checkpointId] = !current;
    save(data);
    return !current;
  }

  function setCheckpoint(weekId, checkpointId, value) {
    const data = load();
    if (!data.weeks[weekId]) {
      data.weeks[weekId] = { checkpoints: {}, notes: '', sessions: [] };
    }
    data.weeks[weekId].checkpoints[checkpointId] = !!value;
    save(data);
  }

  function isCheckpointDone(weekId, checkpointId) {
    const data = load();
    return !!(data.weeks[weekId] && data.weeks[weekId].checkpoints[checkpointId]);
  }

  function saveNotes(weekId, text) {
    const data = load();
    if (!data.weeks[weekId]) {
      data.weeks[weekId] = { checkpoints: {}, notes: '', sessions: [] };
    }
    data.weeks[weekId].notes = text;
    save(data);
  }

  function getNotes(weekId) {
    const data = load();
    return (data.weeks[weekId] && data.weeks[weekId].notes) || '';
  }

  function addSession(weekId, session) {
    const data = load();
    if (!data.weeks[weekId]) {
      data.weeks[weekId] = { checkpoints: {}, notes: '', sessions: [] };
    }
    if (!Array.isArray(data.weeks[weekId].sessions)) {
      data.weeks[weekId].sessions = [];
    }
    session.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    data.weeks[weekId].sessions.push(session);
    save(data);
    return session;
  }

  function removeSession(weekId, sessionId) {
    const data = load();
    if (data.weeks[weekId] && Array.isArray(data.weeks[weekId].sessions)) {
      data.weeks[weekId].sessions = data.weeks[weekId].sessions.filter(s => s.id !== sessionId);
      save(data);
    }
  }

  function getSessions(weekId) {
    const data = load();
    return (data.weeks[weekId] && data.weeks[weekId].sessions) || [];
  }

  function getWeekProgress(weekId) {
    const week = window.ROADMAP_DATA && window.ROADMAP_DATA.weeks.find(w => w.id === weekId);
    if (!week) return { done: 0, total: 0, percent: 0 };
    const total = week.checkpoints.length;
    if (total === 0) return { done: 0, total: 0, percent: 0 };
    const data = load();
    const wd = data.weeks[weekId];
    let done = 0;
    if (wd && wd.checkpoints) {
      week.checkpoints.forEach(cp => {
        if (wd.checkpoints[cp.id]) done++;
      });
    }
    return { done, total, percent: Math.round((done / total) * 100) };
  }

  function getOverallProgress() {
    if (!window.ROADMAP_DATA) return { done: 0, total: 0, percent: 0 };
    let done = 0, total = 0;
    window.ROADMAP_DATA.weeks.forEach(w => {
      const p = getWeekProgress(w.id);
      done += p.done;
      total += p.total;
    });
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  function getTotalPracticeTime() {
    const data = load();
    let mins = 0;
    Object.values(data.weeks).forEach(wd => {
      if (Array.isArray(wd.sessions)) {
        wd.sessions.forEach(s => { mins += (s.duration || 0); });
      }
    });
    return mins;
  }

  function getWeekPracticeTime(weekId) {
    const sessions = getSessions(weekId);
    return sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  }

  function exportData() {
    const data = load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guitar-roadmap-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = JSON.parse(e.target.result);
          if (!data || typeof data !== 'object') throw new Error('Invalid data');
          if (!data.weeks) throw new Error('Missing weeks data');
          save(data);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    load, save, getWeekData, toggleCheckpoint, setCheckpoint,
    isCheckpointDone, saveNotes, getNotes, addSession, removeSession,
    getSessions, getWeekProgress, getOverallProgress, getTotalPracticeTime,
    getWeekPracticeTime, exportData, importData, clearAll
  };
})();
