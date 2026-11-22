/**
 * 网站版数据层
 * ------------------------------------------------------------------
 * 题库：以服务端为唯一数据源（多端共享），本地 localStorage 作镜像/离线兜底。
 * 答题历史、解锁状态、会员状态：仍存本地（个人数据，无需共享）。
 * 后台管理页的题库增删改会写回服务端，所有设备刷新后即可看到。
 * 所有方法不抛异常。
 */
(function () {
  const CFG = window.APP_CONFIG;
  const KEYS = CFG.KEYS;
  const CFG_SEED_VERSION_KEY = function () { return CFG.SEED_VERSION_KEY; };

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
    // 是否已连接服务端（云端题库），由 init 探测结果决定
    cloud: false,

    // 启动时：先用本地/种子填充题库（保证首屏可用），再异步从服务端拉取最新题库覆盖本地。
    // 返回 Promise，app.js 等待完成后再渲染首屏，确保多端看到的是同一份数据。
    init() {
      const savedVersion = Number(read(CFG_SEED_VERSION_KEY(), 0)) || 0;
      if (!localStorage.getItem(KEYS.TESTS) || savedVersion < CFG.SEED_VERSION) {
        write(KEYS.TESTS, clone(window.SEED_TESTS));
        write(CFG_SEED_VERSION_KEY(), CFG.SEED_VERSION);
      }
      const Pay = window.Pay;
      if (!Pay || !Pay.getTests) return Promise.resolve(false);
      return Pay.getTests().then(function (tests) {
        if (Array.isArray(tests) && tests.length) {
          // 以服务端为准覆盖本地镜像
          write(KEYS.TESTS, tests);
          Data.cloud = true;
          return true;
        }
        return false;
      }).catch(function () {
        // 服务端不可用：保持本地镜像，离线可用
        return false;
      });
    },

    // 当前是否以服务端为数据源
    isCloud() { return Data.cloud; },

    // 管理员 token（与门禁共用 sessionStorage 里的值）
    getAdminToken() {
      try { return sessionStorage.getItem('nd_web_admin_token') || ''; } catch (e) { return ''; }
    },

    resetTests() {
      const token = Data.getAdminToken();
      const Pay = window.Pay;
      if (Data.cloud && Pay && Pay.resetTests) {
        return Pay.resetTests(token).then(function (r) {
          write(KEYS.TESTS, clone(window.SEED_TESTS));
          write(CFG_SEED_VERSION_KEY(), CFG.SEED_VERSION);
          return { data: r, error: null, cloud: true };
        }).catch(function (e) {
          return { data: null, error: { message: '云端恢复失败：' + (e.message || '请重试') } };
        });
      }
      // 离线兜底：仅改本地
      const r = write(KEYS.TESTS, clone(window.SEED_TESTS));
      write(CFG_SEED_VERSION_KEY(), CFG.SEED_VERSION);
      return Promise.resolve(r);
    },

    listTests() {
      const list = read(KEYS.TESTS, []);
      return Array.isArray(list) ? list : [];
    },

    getTest(id) {
      return this.listTests().find(function (t) { return t.id === id; }) || null;
    },

    // 管理员保存/新增测试：云端模式下写服务端，成功后更新本地镜像
    saveTest(test) {
      const list = this.listTests();
      const idx = list.findIndex(function (t) { return t.id === test.id; });
      if (idx >= 0) list[idx] = test;
      else list.push(test);
      const token = Data.getAdminToken();
      const Pay = window.Pay;
      if (Data.cloud && Pay && Pay.saveTests) {
        return Pay.saveTests(list, token).then(function (r) {
          write(KEYS.TESTS, list);
          return { data: r, error: null, cloud: true };
        }).catch(function (e) {
          return { data: null, error: { message: '云端保存失败：' + (e.message || '请重试') } };
        });
      }
      return Promise.resolve(write(KEYS.TESTS, list));
    },

    // 管理员删除测试：云端模式下写服务端
    removeTest(id) {
      const list = this.listTests().filter(function (t) { return t.id !== id; });
      const token = Data.getAdminToken();
      const Pay = window.Pay;
      if (Data.cloud && Pay && Pay.saveTests) {
        return Pay.saveTests(list, token).then(function (r) {
          write(KEYS.TESTS, list);
          return { data: r, error: null, cloud: true };
        }).catch(function (e) {
          return { data: null, error: { message: '云端删除失败：' + (e.message || '请重试') } };
        });
      }
      return Promise.resolve(write(KEYS.TESTS, list));
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

    // ---------- 会员专享测试 ----------
    // 判断优先级：题库里显式写过 memberOnly（true/false）就以它为准（管理后台可开关）；
    // 没有该字段时，回落到 config.js 的 MEMBER_ONLY_TESTS 名单，
    // 避免旧云端题库里没有 memberOnly 字段导致专享测试被漏掉。
    isMemberOnly(test) {
      if (!test) return false;
      if (typeof test.memberOnly === 'boolean') return test.memberOnly;
      const list = CFG.MEMBER_ONLY_TESTS || [];
      return list.indexOf(test.id) >= 0;
    },

    // 未开通会员 + 会员专享 → 不允许开始答题
    canStart(test) {
      return !Data.isMemberOnly(test) || Data.isMember();
    },

    // ---------- 看广告免费解锁的机会（每台设备仅 1 次）----------
    getAdFreeUsed() {
      return Math.max(0, Number(read(KEYS.AD_FREE_USED, 0)) || 0);
    },

    // 还剩几次免费看广告的机会
    adFreeLeft() {
      const total = Math.max(0, Number(CFG.AD_FREE_TIMES) || 0);
      return Math.max(0, total - Data.getAdFreeUsed());
    },

    // 消耗一次免费机会（看完广告解锁后调用）
    useAdFree() {
      return write(KEYS.AD_FREE_USED, Data.getAdFreeUsed() + 1);
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
      return write(KEYS.MEMBER, { active: true, openAt: now, expireAt: now + m * 30 * 24 * 60 * 60 * 1000, source: 'local' });
    },

    // 由支付服务端下发的会员（权威），按服务端到期时间写入本地
    grantMemberFromServer(expireAt) {
      return write(KEYS.MEMBER, {
        active: true, openAt: Date.now(), expireAt: Number(expireAt), source: 'server'
      });
    },

    // 匿名设备 ID：支付时用来把订单和设备绑定，支付成功后服务端据此开通会员
    getClientId() {
      let id = null;
      try { id = localStorage.getItem(KEYS.CLIENT_ID); } catch (e) {}
      if (!id) {
        const arr = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(arr);
        else for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        id = Array.from(arr).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        try { localStorage.setItem(KEYS.CLIENT_ID, id); } catch (e) {}
      }
      return id;
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
