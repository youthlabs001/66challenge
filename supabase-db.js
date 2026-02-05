/**
 * 66challenge 데이터 레이어
 * SUPABASE_ANON_KEY가 있으면 Supabase 사용, 없으면 localStorage 사용
 */
(function () {
  'use strict';

  const CONFIG_KEY = 'reading66_config';
  const USERS_KEY = 'reading66_users';
  const NOTICES_KEY = 'reading66_notices';
  const DATA_KEY = 'reading66_data';
  const STORAGE_KEY = 'reading66';

  function useSupabase() {
    return typeof window !== 'undefined' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase && typeof window.supabase.from === 'function';
  }

  function getClient() {
    return window.supabase || null;
  }

  // ---------- Config ----------
  async function getConfig() {
    if (useSupabase()) {
      const { data, error } = await getClient().from('challenge_config').select('*').eq('id', 'default').maybeSingle();
      if (error) return defaultConfig();
      if (!data) return defaultConfig();
      return {
        startDate: data.start_date ? data.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        totalDays: data.total_days ?? 66,
        goalPages: data.goal_pages ?? 20
      };
    }
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return defaultConfig();
  }

  function defaultConfig() {
    return {
      startDate: new Date().toISOString().slice(0, 10),
      totalDays: 66,
      goalPages: 20
    };
  }

  async function saveConfig(config) {
    if (useSupabase()) {
      const { error } = await getClient().from('challenge_config').upsert({
        id: 'default',
        start_date: config.startDate,
        total_days: config.totalDays || 66,
        goal_pages: config.goalPages || 20,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      return;
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  // ---------- Users (Participants) ----------
  async function getUsers() {
    if (useSupabase()) {
      const { data, error } = await getClient().from('participants').select('id, name, password').order('created_at', { ascending: true });
      if (error) return [];
      return (data || []).map(function (r) {
        return { id: r.id, name: r.name, password: r.password || '' };
      });
    }
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  async function addParticipant(name, password) {
    if (useSupabase()) {
      const { data, error } = await getClient().from('participants').insert({ name: name, password: password || '' }).select('id, name, password').single();
      if (error) throw new Error(error.message);
      return { id: data.id, name: data.name, password: data.password || '' };
    }
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const id = 'u' + Date.now();
    users.push({ id, name, password: password || '', createdAt: new Date().toISOString().slice(0, 10) });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { id, name, password: password || '' };
  }

  async function deleteParticipant(id) {
    if (useSupabase()) {
      const { error } = await getClient().from('participants').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]').filter(function (u) { return u.id !== id; });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        delete data[id];
        localStorage.setItem(DATA_KEY, JSON.stringify(data));
      }
    } catch (e) {}
  }

  // ---------- Notices ----------
  async function getNotices() {
    if (useSupabase()) {
      const { data, error } = await getClient().from('notices').select('id, text, created_at').order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(function (r) {
        return { id: r.id, text: r.text, createdAt: r.created_at ? r.created_at.slice(0, 19) : '' };
      });
    }
    try {
      const raw = localStorage.getItem(NOTICES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  async function addNotice(text) {
    if (useSupabase()) {
      const { data, error } = await getClient().from('notices').insert({ text: text }).select('id, text, created_at').single();
      if (error) throw new Error(error.message);
      return { id: data.id, text: data.text, createdAt: data.created_at ? data.created_at.slice(0, 19) : '' };
    }
    const notices = JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]');
    const n = { id: 'n' + Date.now(), createdAt: new Date().toISOString().slice(0, 10), text: text };
    notices.unshift(n);
    localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
    return n;
  }

  async function deleteNotice(id) {
    if (useSupabase()) {
      const { error } = await getClient().from('notices').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    const notices = JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]').filter(function (n) { return n.id !== id; });
    localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
  }

  // ---------- Reading data (per participant) ----------
  async function getReadingData(participantId) {
    if (useSupabase() && participantId) {
      const { data, error } = await getClient().from('reading_records').select('record_date, pages, book_title, thought').eq('participant_id', participantId);
      if (error) return { daily: {} };
      var daily = {};
      (data || []).forEach(function (r) {
        var key = r.record_date ? r.record_date.slice(0, 10) : '';
        if (key) daily[key] = { pages: r.pages || 0, bookTitle: r.book_title || '', thought: r.thought || '' };
      });
      return { daily: daily };
    }
    if (useSupabase() && !participantId) {
      return { daily: {} };
    }
    try {
      const raw = localStorage.getItem(DATA_KEY);
      const all = raw ? JSON.parse(raw) : {};
      if (participantId && all[participantId]) return { daily: all[participantId].daily || {} };
      const single = localStorage.getItem(STORAGE_KEY);
      if (!participantId && single) return JSON.parse(single);
    } catch (e) {}
    return { daily: {} };
  }

  async function saveReadingRecord(participantId, dateKey, payload) {
    var pages = typeof payload.pages === 'number' ? payload.pages : parseInt(payload.pages, 10) || 0;
    var bookTitle = (payload.bookTitle != null ? String(payload.bookTitle) : '').trim();
    var thought = (payload.thought != null ? String(payload.thought) : '').trim();

    if (useSupabase() && participantId) {
      const { error } = await getClient().from('reading_records').upsert({
        participant_id: participantId,
        record_date: dateKey,
        pages: pages,
        book_title: bookTitle,
        thought: thought
      }, { onConflict: 'participant_id,record_date' });
      if (error) throw new Error(error.message);
      return;
    }
    var data = await getReadingData(participantId);
    data.daily = data.daily || {};
    data.daily[dateKey] = { pages: pages, bookTitle: bookTitle, thought: thought };
    if (participantId) {
      var all = {};
      try { var raw = localStorage.getItem(DATA_KEY); if (raw) all = JSON.parse(raw); } catch (e) {}
      all[participantId] = data;
      localStorage.setItem(DATA_KEY, JSON.stringify(all));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }

  async function deleteAllReadingData(participantId) {
    if (useSupabase() && participantId) {
      const { error } = await getClient().from('reading_records').delete().eq('participant_id', participantId);
      if (error) throw new Error(error.message);
      return;
    }
    if (participantId) {
      var all = {};
      try { var raw = localStorage.getItem(DATA_KEY); if (raw) all = JSON.parse(raw); } catch (e) {}
      delete all[participantId];
      localStorage.setItem(DATA_KEY, JSON.stringify(all));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // 단일 사용자(참가자 없음)용: localStorage 키 STORAGE_KEY 사용
  async function getSingleUserReadingData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { daily: {} };
    } catch (e) { return { daily: {} }; }
  }

  window.db = {
    getConfig: getConfig,
    saveConfig: saveConfig,
    getUsers: getUsers,
    addParticipant: addParticipant,
    deleteParticipant: deleteParticipant,
    getNotices: getNotices,
    addNotice: addNotice,
    deleteNotice: deleteNotice,
    getReadingData: getReadingData,
    saveReadingRecord: saveReadingRecord,
    deleteAllReadingData: deleteAllReadingData,
    getSingleUserReadingData: getSingleUserReadingData,
    useSupabase: useSupabase
  };
})();
