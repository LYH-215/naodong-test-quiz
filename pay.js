/**
 * 支付前端模块
 * ------------------------------------------------------------------
 * 封装与支付服务后端的交互：探测模式、下单、二维码/演示支付、轮询开通。
 * 支付成功后按服务端到期时间写入本地会员 → 全站内容立即自动解锁。
 * 若后端不可用（例如仍托管在纯静态 GitHub Pages），自动降级为纯本地演示开通。
 */
(function () {
  const CFG = window.APP_CONFIG;
  const BASE = (CFG.API_BASE || '').replace(/\/$/, '');
  let modeCache = null;

  function api(path, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
      opts.headers['Content-Type'] = 'application/json';
    }
    // 附加分享码：
    // - 同源分享链接：从地址栏 ?sharecode= 取
    // - 静态站点 + 远端后端：用 config.js 里配置的 API_SHARECODE
    // 平台网关没有分享码会直接返回 403，所以这里两种来源都要尝试。
    let url = BASE + path;
    let code = '';
    const m = window.location.search.match(/[?&]sharecode=([^&]+)/);
    if (m) code = decodeURIComponent(m[1]);
    if (!code && BASE && CFG.API_SHARECODE) code = CFG.API_SHARECODE;
    if (code) url += (path.indexOf('?') >= 0 ? '&' : '?') + 'sharecode=' + encodeURIComponent(code);
    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  // 探测支付模式：real / demo / offline
  function getMode() {
    if (modeCache) return Promise.resolve(modeCache);
    return api('/api/config')
      .then(function (c) { modeCache = c.mode === 'real' ? 'real' : 'demo'; return modeCache; })
      .catch(function () { modeCache = 'offline'; return modeCache; });
  }

  // 用服务端权威状态刷新本地会员（若服务端显示已开通）
  function refreshMemberFromServer() {
    const cid = window.Data.getClientId();
    return api('/api/member/status?clientId=' + encodeURIComponent(cid))
      .then(function (m) {
        if (m && m.active && m.expireAt) {
          window.Data.grantMemberFromServer(m.expireAt);
        }
        return m;
      })
      .catch(function () {});
  }

  // 轮询订单，支付成功则开通会员并回调 onSuccess
  function pollOrder(orderNo, onSuccess, onStatus) {
    let tries = 0;
    const max = 120; // 最多轮询 120 次（约 2 分钟，每次 1s）
    function tick() {
      api('/api/order/status?orderNo=' + encodeURIComponent(orderNo))
        .then(function (s) {
          if (onStatus) onStatus(s.status);
          if (s.paid) { onSuccess(); return; }
          if (s.status === 'expired') return;
          if (++tries < max) setTimeout(tick, 1000);
        })
        .catch(function () { if (++tries < max) setTimeout(tick, 1500); });
    }
    tick();
  }

  // 题库：公开读取（多端共享数据源）
  function getTests() {
    return api('/api/tests').then(function (r) { return (r && r.tests) || null; });
  }

  // 题库：管理员保存整份题库（带 token）
  function saveTests(tests, token) {
    return api('/api/admin/tests', {
      method: 'POST',
      headers: { 'X-Admin-Token': token || '' },
      body: { tests: tests }
    });
  }

  // 题库：管理员恢复内置
  function resetTests(token) {
    return api('/api/admin/tests/reset', {
      method: 'POST',
      headers: { 'X-Admin-Token': token || '' }
    });
  }

  // ============ 激活码（无需商户号的手动会员方案）============

  // 顾客：点「我已付款」自助领码并开通会员（24h 限一次）
  function claimCode() {
    const cid = window.Data.getClientId();
    return api('/api/code/claim', { method: 'POST', body: { clientId: cid, months: CFG.memberMonths || 1 } });
  }

  // 顾客：兑换激活码（用当前设备 clientId）
  function redeemCode(code) {
    const cid = window.Data.getClientId();
    return api('/api/code/redeem', { method: 'POST', body: { code: code, clientId: cid } });
  }

  function adminHeaders(token) { return { 'X-Admin-Token': token || '' }; }

  function generateCodes(count, months, token) {
    return api('/api/admin/codes/generate', {
      method: 'POST', headers: adminHeaders(token), body: { count: count, months: months }
    });
  }
  function listCodes(token) {
    return api('/api/admin/codes', { headers: adminHeaders(token) });
  }
  function revokeCode(code, token) {
    return api('/api/admin/codes/revoke', {
      method: 'POST', headers: adminHeaders(token), body: { code: code }
    });
  }
  function adminGrantMember(clientId, months, token) {
    return api('/api/admin/member/grant', {
      method: 'POST', headers: adminHeaders(token), body: { clientId: clientId, months: months }
    });
  }
  function adminRevokeMember(clientId, token) {
    return api('/api/admin/member/revoke', {
      method: 'POST', headers: adminHeaders(token), body: { clientId: clientId }
    });
  }

  // ============ 客服留言（顾客提问 → 管理员回复）============

  // 顾客：提交留言（用当前设备 clientId）
  function sendMessage(contact, content) {
    const cid = window.Data.getClientId();
    return api('/api/message/add', { method: 'POST', body: { clientId: cid, contact: contact, content: content } });
  }
  // 顾客：查询自己设备的留言与回复
  function getMyMessages() {
    const cid = window.Data.getClientId();
    return api('/api/message/mine?clientId=' + encodeURIComponent(cid))
      .then(function (r) { return (r && r.messages) || []; });
  }
  // 管理员：列出全部留言
  function adminListMessages(token) {
    return api('/api/admin/messages', { headers: adminHeaders(token) })
      .then(function (r) { return (r && r.messages) || []; });
  }
  // 管理员：回复留言
  function adminReplyMessage(id, reply, token) {
    return api('/api/admin/messages/reply', {
      method: 'POST', headers: adminHeaders(token), body: { id: id, reply: reply }
    });
  }
  // 管理员：删除留言
  function adminDeleteMessage(id, token) {
    return api('/api/admin/messages/delete', {
      method: 'POST', headers: adminHeaders(token), body: { id: id }
    });
  }

  // 管理后台：校验 token 是否有效（后端不可用返回 offline）
  function adminCheck(token) {
    if (!token) return Promise.resolve(false);
    return api('/api/admin/check?token=' + encodeURIComponent(token))
      .then(function (r) { return !!(r && r.ok); })
      .catch(function () { return false; });
  }

  // 管理后台：用密码换取 token（后端不可用则 reject，禁止进入）
  function adminVerify(password) {
    return api('/api/admin/verify', { method: 'POST', body: { password: password } })
      .then(function (r) {
        if (!r || !r.ok || !r.token) throw new Error((r && r.error) || '验证失败');
        return r.token;
      });
  }

  window.Pay = {
    getMode: getMode,
    refreshMemberFromServer: refreshMemberFromServer,
    pollOrder: pollOrder,
    api: api,
    getTests: getTests,
    saveTests: saveTests,
    resetTests: resetTests,
    claimCode: claimCode,
    redeemCode: redeemCode,
    generateCodes: generateCodes,
    listCodes: listCodes,
    revokeCode: revokeCode,
    adminGrantMember: adminGrantMember,
    adminRevokeMember: adminRevokeMember,
    sendMessage: sendMessage,
    getMyMessages: getMyMessages,
    adminListMessages: adminListMessages,
    adminReplyMessage: adminReplyMessage,
    adminDeleteMessage: adminDeleteMessage,
    adminCheck: adminCheck,
    adminVerify: adminVerify,

    // 发起开通会员流程
    start: function (opts) {
      const Data = window.Data;
      const onDone = opts.onDone || function () {};
      const showModal = opts.showModal;
      const toast = opts.toast;
      const esc = opts.esc;
      const months = CFG.memberMonths || 1;

      getMode().then(function (mode) {
        // 后端不可用：纯本地演示开通
        if (mode === 'offline') {
          showModal({
            title: '演示模式',
            desc: '当前站点未连接支付服务（如托管在 GitHub Pages）。演示模式下将直接为你模拟开通会员，用于预览解锁效果。真实收款需部署支付服务并配置商户号。',
            okText: '模拟支付并开通',
            onOk: function () {
              Data.grantMember(months);
              toast('会员已开通，全部内容已解锁');
              onDone();
            }
          });
          return;
        }

        // 有后端：先刷新一次服务端会员状态，已开通则直接放行
        refreshMemberFromServer().then(function (m) {
          if (m && m.active) { toast('你已是会员'); onDone(); return; }
          // 创建订单
          api('/api/order/create', {
            method: 'POST',
            body: { clientId: Data.getClientId(), months: months }
          }).then(function (order) {
            if (order.mode === 'real' && order.codeUrl) {
              showQrPay(showModal, toast, esc, order, months, onDone);
            } else {
              // 演示支付（后端处于 demo 模式）
              showModal({
                title: '演示支付',
                desc: '支付服务当前为演示模式（未配置微信商户号）。点击下方按钮模拟支付成功，即可体验自动开通与内容解锁。',
                okText: '模拟支付成功',
                onOk: function () {
                  api('/api/order/demo-paid', { method: 'POST', body: { orderNo: order.orderNo } })
                    .then(function () {
                      pollOrder(order.orderNo, function () {
                        refreshMemberFromServer().then(function () {
                          toast('支付成功，会员已开通，全部内容已解锁');
                          onDone();
                        });
                      });
                    })
                    .catch(function () { toast('支付失败，请重试', 'err'); });
                }
              });
            }
          }).catch(function (e) { toast('下单失败：' + e.message, 'err'); });
        });
      });
    }
  };

  // 真实支付：展示二维码 + 轮询
  function showQrPay(showModal, toast, esc, order, months, onDone) {
    showModal({
      title: '微信扫码支付',
      desc: '请使用微信扫描下方二维码支付 ¥' + (order.amountFen / 100).toFixed(2) +
        '（' + months + ' 个月会员）。支付成功后将自动开通，无需任何额外操作。',
      okText: '关闭',
      onOk: function () {}
    });
    const box = document.querySelector('#modalRoot .modal');
    if (!box) return;
    // 放一个二维码容器；优先用本地 qrcode 库，否则显示链接
    const wrap = document.createElement('div');
    wrap.style.cssText = 'text-align:center;margin:16px 0';
    wrap.innerHTML = '<div id="payQr" style="display:inline-block;padding:10px;background:#fff;border:1px solid #eee;border-radius:10px"></div>' +
      '<div id="payWait" style="margin-top:10px;color:var(--ink-sub);font-size:13px">等待支付中…</div>';
    const actions = box.querySelector('.modal__actions');
    box.insertBefore(wrap, actions);
    const qrEl = wrap.querySelector('#payQr');
    if (window.QRCode) {
      try {
        new window.QRCode(qrEl, { text: order.codeUrl, width: 200, height: 200, colorDark: '#1f2d27', colorLight: '#ffffff' });
      } catch (e) { qrEl.textContent = '二维码生成失败，请用微信打开支付链接'; }
    } else {
      qrEl.innerHTML = '<a href="' + esc(order.codeUrl) + '" target="_blank" style="font-size:13px;color:#2E7D62">点此打开支付链接</a>';
    }
    pollOrder(order.orderNo, function () {
      refreshMemberFromServer().then(function () {
        if (document.getElementById('modalRoot')) {
          document.getElementById('modalRoot').innerHTML = '';
        }
        toast('支付成功，会员已开通，全部内容已解锁');
        onDone();
      });
    }, function (status) {
      const w = document.getElementById('payWait');
      if (w) w.textContent = status === 'paid' ? '支付成功，正在开通…' : '等待支付中…';
    });
  }
})();
