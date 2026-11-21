/**
 * 网站版数据层（localStorage 持久化）
 * ------------------------------------------------------------------
 * 提供题库、答题历史、解锁状态、会员状态的读写。
 * 后台管理页的增删改都走这里。所有方法不抛异常。
 */
(function () {
  const KEYS = window.APP_CONFIG.KEYS;

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return { data: value, error: null };
    } catch (e) {
      return { data: null, error: { message: '本地存储写入失败，请检查浏览器存储权限' } };
    }
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const Data = {
    // 首次访问写入内置题库
    init() {
      if (!localStorage.getItem(KEYS.TESTS)) {
        write(KEYS.TESTS, clone(window.SEED_TESTS));
      }
    },

    resetTests() {
      return write(KEYS.TESTS, clone(window.SEED_TESTS));
    },

    listTests() {
      const list = read(KEYS.TESTS, []);
      return Array.isArray(list) ? list : [];
    },

    getTest(id) {
      return this.listTests().find(function (t) { return t.id === id; }) || null;
    },

    saveTest(test) {
      const list = this.listTests();
      const idx = list.findIndex(function (t) { return t.id === test.id; });
      if (idx >= 0) list[idx] = test;
      else list.push(test);
      return write(KEYS.TESTS, list);
    },

    removeTest(id) {
      const list = this.listTests().filter(function (t) { return t.id !== id; });
      return write(KEYS.TESTS, list);
    },

    listResults() {
      const list = read(KEYS.RESULTS, []);
      return Array.isArray(list) ? list : [];
    },

    addResult(record) {
      const list = this.listResults();
      list.unshift(record);
      return write(KEYS.RESULTS, list.slice(0, 50));
    },

    isUnlocked(testId, resultId) {
      const map = read(KEYS.UNLOCKS, {});
      return map[testId + '_' + resultId] === true;
    },

    unlock(testId, resultId) {
      const map = read(KEYS.UNLOCKS, {});
      map[testId + '_' + resultId] = true;
      return write(KEYS.UNLOCKS, map);
    },

    isMember() {
      const info = this.getMemberInfo();
      return !!(info && info.active);
    },

    getMemberInfo() {
      const raw = read(KEYS.MEMBER, null);
      if (!raw) return { active: false };
      if (raw.expireAt && Date.now() > raw.expireAt) {
        try { localStorage.removeItem(KEYS.MEMBER); } catch (e) {}
        return { active: false, expired: true };
      }
      return {
        active: true,
        expireAt: raw.expireAt,
        expireText: this.formatDate(raw.expireAt)
      };
    },

    grantMember(months) {
      const m = Math.max(1, Number(months) || 1);
      const now = Date.now();
      return write(KEYS.MEMBER, { active: true, openAt: now, expireAt: now + m * 30 * 24 * 60 * 60 * 1000 });
    },

    revokeMember() {
      try {
        localStorage.removeItem(KEYS.MEMBER);
        return { data: null, error: null };
      } catch (e) {
        return { data: null, error: { message: '操作失败' } };
      }
    },

    formatDate(ts) {
      const d = new Date(ts);
      const m = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      return d.getFullYear() + '-' + m + '-' + day;
    }
  };

  window.Data = Data;
})();
