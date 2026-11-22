/**
 * 脑洞测试局（网站版）主程序
 * ------------------------------------------------------------------
 * 单页应用（hash 路由）。所有测试相关页面顶部都有固定免责声明。
 * 新增测试：在后台管理页操作，或直接编辑 seed-data.js 后清除本地缓存。
 */
(function () {
  const CFG = window.APP_CONFIG;
  const Data = window.Data;
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modalRoot');

  // ---------- 工具 ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function go(hash) { window.location.hash = hash; }
  function toast(msg, type) {
    type = type || 'ok';
    const el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.textContent = msg;
    el.style.cssText = 'position:fixed;left:50%;top:80px;transform:translateX(-50%);z-index:200;' +
      'background:' + (type === 'err' ? '#E07B72' : '#2E7D62') + ';color:#fff;padding:12px 24px;' +
      'border-radius:999px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.2);';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  // 通用模态框
  function showModal(opts) {
    $modal.innerHTML =
      '<div class="modal-mask">' +
        '<div class="modal">' +
          '<div class="modal__title">' + esc(opts.title || '') + '</div>' +
          (opts.desc ? '<div class="modal__desc">' + esc(opts.desc) + '</div>' : '') +
          (opts.input ? '<input class="modal__input" id="modalInput" type="' + (opts.inputType || 'text') + '" placeholder="' + esc(opts.placeholder || '') + '" value="' + esc(opts.value || '') + '">' : '') +
          (opts.html || '') +
          '<div class="modal__actions">' +
            (opts.showCancel !== false ? '<button class="btn ' + (opts.cancelClass || 'btn-ghost') + '" id="modalCancel">' + esc(opts.cancelText || '取消') + '</button>' : '') +
            '<button class="btn ' + (opts.okClass || 'btn-primary') + '" id="modalOk">' + esc(opts.okText || '确定') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    const ok = document.getElementById('modalOk');
    const cancel = document.getElementById('modalCancel');
    const input = document.getElementById('modalInput');
    if (input) setTimeout(function () { input.focus(); }, 50);
    ok.onclick = function () {
      const val = input ? input.value : '';
      closeModal();
      if (opts.onOk) opts.onOk(val);
    };
    if (cancel) cancel.onclick = function () {
      closeModal();
      if (opts.onCancel) opts.onCancel();
    };
    $modal.querySelector('.modal-mask').onclick = function (e) {
      if (e.target === this) closeModal();
    };
  }
  function closeModal() { $modal.innerHTML = ''; }

  // 免责声明条（全站固定）
  function renderDisclaimerBar() {
    document.getElementById('disclaimerBar').innerHTML =
      '<span class="d-icon">i</span><span>' + esc(CFG.DISCLAIMER) + '</span>';
  }

  // ---------- 管理后台门禁 ----------
  // 管理页不是公开入口：只有输入正确密码、拿到服务端 token 才能进入。
  // token 存 sessionStorage（关闭标签页即失效），密码只在服务端比对，前端源码看不到。
  const ADMIN_TOKEN_KEY = 'nd_web_admin_token';
  function getAdminToken() {
    try { return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function setAdminToken(t) {
    try { sessionStorage.setItem(ADMIN_TOKEN_KEY, t); } catch (e) {}
  }
  function clearAdminToken() {
    try { sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch (e) {}
  }

  // 校验通过后执行 cb；否则弹密码框或拒绝
  function requireAdmin(cb) {
    const Pay = window.Pay;
    // 没有后端服务（如纯静态 GitHub Pages）：管理后台不可用，杜绝前端绕过
    if (!Pay || !Pay.adminVerify) {
      $app.innerHTML = '<div class="admin-wrap"><div class="panel card">' +
        '<div class="panel__title">管理后台不可用</div>' +
        '<p class="text-sub">当前站点未连接管理服务，无法验证管理员身份。请通过正式站点链接访问。</p></div></div>';
      return;
    }
    // 已有 token：先验服务端（防伪造/过期）
    const token = getAdminToken();
    if (token) {
      Pay.adminCheck(token).then(function (ok) {
        if (ok) cb(); else askAdminPassword(cb);
      });
      return;
    }
    askAdminPassword(cb);
  }

  function askAdminPassword(cb) {
    showModal({
      title: '管理后台',
      desc: '请输入管理员密码',
      input: true,
      inputType: 'password',
      placeholder: '管理员密码',
      okText: '验证并进入',
      showCancel: true,
      onOk: function (pwd) {
        if (!pwd) { toast('请输入密码', 'err'); return; }
        window.Pay.adminVerify(pwd).then(function (token) {
          setAdminToken(token);
          toast('验证成功');
          cb();
        }).catch(function (e) {
          toast(e.message || '验证失败', 'err');
        });
      }
    });
  }

  // 顶部导航高亮
  function syncNav(hash) {
    document.querySelectorAll('.nav__link').forEach(function (a) {
      a.classList.remove('active');
    });
    let target = '#/';
    if (hash.indexOf('#/member') === 0) target = '#/member';
    else if (hash.indexOf('#/service') === 0) target = '#/service';
    else if (hash.indexOf('#/admin') === 0) target = ''; // 管理页不高亮任何公开导航
    const link = target ? document.querySelector('.nav__link[href="' + target + '"]') : null;
    if (link) link.classList.add('active');
  }

  // ============ 首页 ============
  function renderHome() {
    const tests = Data.listTests();
    const isMember = Data.isMember();
    const cards = tests.map(function (t) {
      const cover = t.coverImage
        ? '<img src="' + esc(t.coverImage) + '" alt="">'
        : '<span class="test-card__emoji">' + esc(t.emoji || '✦') + '</span>';
      const colors = t.coverColors || ['#8FD3B6', '#5FB99A'];
      const count = (t.questions && t.questions.length) || 0;
      // 会员专享测试：卡片上打标，未开通时不显示「开始测试」
      const memberOnly = Data.isMemberOnly(t);
      const locked = memberOnly && !isMember;
      return '<article class="test-card' + (locked ? ' test-card--locked' : '') + '" data-id="' + esc(t.id) + '">' +
        '<div class="test-card__cover" style="background:linear-gradient(135deg,' + esc(colors[0]) + ',' + esc(colors[1]) + ')">' +
          cover + '<span class="test-card__count">' + count + ' 题</span>' +
          (memberOnly ? '<span class="test-card__vip">会员专享</span>' : '') +
        '</div>' +
        '<div class="test-card__body">' +
          '<div class="test-card__title">' + esc(t.title) + '</div>' +
          '<div class="test-card__sub">' + esc(t.subtitle) + '</div>' +
          '<div class="test-card__cta">' + (locked ? '开通会员后解锁 →' : '开始测试 →') + '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    $app.innerHTML =
      '<section class="hero">' +
        '<span class="hero__badge">有趣的脑洞，都在这里</span>' +
        '<div class="hero__title">脑洞测试局</div>' +
        '<div class="hero__sub">一场轻轻的、好玩的自我探索小游戏。几道题，解锁你的专属剧情人设。</div>' +
        '<div class="hero__tip">全部测试仅供娱乐，图一乐就好 ✦</div>' +
      '</section>' +
      '<div class="vip-banner" id="vipBanner">' +
        '<div class="vip-banner__left">' +
          '<span class="vip-banner__icon">✦</span>' +
          '<div>' +
            '<div class="vip-banner__title">' + (isMember ? '你已是脑洞会员' : '开通会员 · 解锁全部测试') + '</div>' +
            '<div class="vip-banner__desc">' + (isMember ? '免广告，畅读完整报告' : '9.9 元/月，免广告 + 完整报告') + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="vip-banner__arrow">›</span>' +
      '</div>' +
      '<h2 class="section-title">全部测试 <span style="font-size:13px;color:var(--ink-sub);font-weight:400">共 ' + tests.length + ' 个</span></h2>' +
      '<div class="test-grid">' + (cards || '<div class="card">暂无测试，请到管理后台新增</div>') + '</div>';

    document.getElementById('vipBanner').onclick = function () { go('#/member'); };
    $app.querySelectorAll('.test-card').forEach(function (card) {
      card.onclick = function () {
        const test = Data.getTest(card.dataset.id);
        if (!Data.canStart(test)) { showMemberOnlyDialog(test); return; }
        go('#/quiz/' + encodeURIComponent(card.dataset.id));
      };
    });
  }

  // 会员专享测试的提示弹窗：引导去开通，而不是直接开始答题
  function showMemberOnlyDialog(test) {
    const name = test ? '《' + test.title + '》' : '该测试';
    showModal({
      title: '这是会员专享测试',
      desc: name + '需要开通会员后才能开始。会员可解锁全部测试、完整人设报告，并且免广告。',
      cancelText: '再看看',
      okText: '去开通会员',
      onOk: function () { go('#/member'); }
    });
  }

  // ============ 答题页 ============
  function renderQuiz(testId) {
    const test = Data.getTest(decodeURIComponent(testId || ''));
    if (!test || !test.questions || !test.questions.length) {
      $app.innerHTML = '<div class="card" style="text-align:center;padding:60px 20px">测试不存在或暂无题目<br><br><button class="btn btn-primary" onclick="location.hash=\'#/\'">返回首页</button></div>';
      return;
    }
    // 会员专享测试：即使用链接直接进入答题页，也要求先开通会员
    if (!Data.canStart(test)) {
      $app.innerHTML =
        '<div class="quiz-wrap">' +
          '<div class="unlock-card card" style="text-align:center">' +
            '<div class="unlock-card__icon">✦</div>' +
            '<div class="unlock-card__title">《' + esc(test.title) + '》是会员专享</div>' +
            '<div class="unlock-card__desc">开通会员即可开始这套测试，同时解锁全部测试的完整人设报告，且全程免广告。</div>' +
            '<button class="btn btn-primary btn-block" id="lockVipBtn">开通会员 · ¥' + esc(CFG.MEMBER_PRICE) + '/月</button>' +
            '<p style="margin:14px 0 0"><a style="color:var(--ink-sub);cursor:pointer" id="lockBackBtn">先去看看别的测试 →</a></p>' +
          '</div>' +
        '</div>';
      document.getElementById('lockVipBtn').onclick = function () { go('#/member'); };
      document.getElementById('lockBackBtn').onclick = function () { go('#/'); };
      return;
    }
    let idx = 0;
    const scores = {};
    const total = test.questions.length;

    function paint() {
      const q = test.questions[idx];
      const options = (q.options || []).map(function (o) {
        return '<button class="option" data-key="' + esc(o.key) + '">' +
          '<span class="option__key">' + esc(o.key) + '</span>' +
          '<span class="option__text">' + esc(o.text) + '</span>' +
          '<span class="option__arrow">›</span>' +
        '</button>';
      }).join('');
      $app.innerHTML =
        '<div class="quiz-wrap">' +
          '<div class="quiz-head">' +
            '<button class="quit-link" id="quitBtn">退出</button>' +
            '<span class="quiz-head__title">' + esc(test.title) + '</span>' +
            '<span class="quiz-head__step">' + (idx + 1) + ' / ' + total + '</span>' +
          '</div>' +
          '<div class="progress"><div class="progress__bar" style="width:' + Math.round((idx + 1) / total * 100) + '%"></div></div>' +
          '<div class="question-card card">' +
            '<span class="question-card__no">Q' + (idx + 1) + '</span>' +
            '<div class="question-card__title">' + esc(q.title) + '</div>' +
            '<div class="options">' + options + '</div>' +
          '</div>' +
          '<div class="quiz-hint">凭第一感觉选就好，没有标准答案 ✦</div>' +
        '</div>';
      window.scrollTo({ top: 0, behavior: 'smooth' });

      document.getElementById('quitBtn').onclick = function () {
        showModal({ title: '退出测试？', desc: '还没答完呢，确定要离开吗？', okText: '退出',
          onOk: function () { go('#/'); } });
      };
      $app.querySelectorAll('.option').forEach(function (btn) {
        btn.onclick = function () {
          const key = btn.dataset.key;
          const opt = (q.options || []).find(function (o) { return o.key === key; });
          if (!opt) return;
          const w = opt.weights || {};
          Object.keys(w).forEach(function (rid) { scores[rid] = (scores[rid] || 0) + w[rid]; });
          btn.style.borderColor = 'var(--brand)';
          btn.style.background = 'var(--brand-soft)';
          setTimeout(function () {
            idx++;
            if (idx < total) paint();
            else finish();
          }, 180);
        };
      });
    }

    function finish() {
      const results = test.results || [];
      let best = results[0], bestScore = -1;
      results.forEach(function (r) {
        const s = scores[r.id] || 0;
        if (s > bestScore) { bestScore = s; best = r; }
      });
      if (!best) { toast('结果生成失败', 'err'); go('#/'); return; }
      Data.addResult({ testId: test.id, testTitle: test.title, resultId: best.id, resultTag: best.tag, time: Date.now() });
      go('#/result/' + encodeURIComponent(test.id) + '/' + encodeURIComponent(best.id));
    }

    paint();
  }

  // ============ 结果页 ============
  function renderResult(testId, resultId) {
    const test = Data.getTest(decodeURIComponent(testId || ''));
    if (!test) { go('#/'); return; }
    const rid = decodeURIComponent(resultId || '');
    const result = (test.results || []).find(function (r) { return r.id === rid; }) || (test.results || [])[0];
    if (!result) { go('#/'); return; }
    const unlocked = Data.isMember() || Data.isUnlocked(test.id, result.id);
    // 看广告免费解锁的机会：每台设备总共只有 1 次，用完就必须开通会员
    const adFreeLeft = Data.adFreeLeft();
    const colors = result.colors || ['#8FD3B6', '#5FB99A'];

    $app.innerHTML =
      '<div class="result-wrap">' +
        '<div class="result-hero" style="background:linear-gradient(135deg,' + esc(colors[0]) + ',' + esc(colors[1]) + ')">' +
          '<div class="result-hero__label">你的剧情人设是</div>' +
          '<div class="result-hero__emoji">' + esc(result.emoji || '✦') + '</div>' +
          '<div class="result-hero__tag">' + esc(result.tag) + '</div>' +
          '<div class="result-hero__title">' + esc(result.title) + '</div>' +
          '<div class="result-hero__test">来自《' + esc(test.title) + '》</div>' +
        '</div>' +
        '<div class="poster-layout">' +
          '<div class="poster-canvas-box"><canvas id="posterCanvas"></canvas></div>' +
          '<div class="poster-side">' +
            '<div class="poster-side__hint">' + (unlocked ? '高清结果图已生成' : '当前为普通结果图 · 解锁后可生成高清版') + '</div>' +
            '<div class="poster-actions">' +
              '<button class="btn btn-primary btn-block" id="saveBtn">' + (unlocked ? '保存高清结果图' : '保存结果图') + '</button>' +
              '<button class="btn btn-ghost btn-block" id="shareBtn">分享给好友</button>' +
            '</div>' +
            '<div class="tip">' + esc(CFG.DISCLAIMER) + '</div>' +
          '</div>' +
        '</div>' +
        (unlocked
          ? '<div class="full-report card"><div class="full-report__head">完整人设报告</div><div class="full-report__text">' + nl2br(result.full) + '</div></div>'
          : adFreeLeft > 0
            ? '<div class="unlock-card card">' +
                '<div class="unlock-card__icon">✦</div>' +
                '<div class="unlock-card__title">想看看完整的你？</div>' +
                '<div class="unlock-card__desc">看一段短视频，即可解锁本次的完整长报告 + 高清结果图。<br>免费机会每台设备<b>仅 1 次</b>，用完后需开通会员。</div>' +
                '<button class="btn btn-primary btn-block" id="unlockBtn">看视频解锁完整报告（还剩 ' + adFreeLeft + ' 次）</button>' +
                '<p style="margin:14px 0 0"><a style="color:#C08A2E;cursor:pointer" id="toVip">开通会员，全部报告永久解锁 →</a></p>' +
              '</div>'
            : '<div class="unlock-card card">' +
                '<div class="unlock-card__icon">◇</div>' +
                '<div class="unlock-card__title">免费看报告的机会已用完</div>' +
                '<div class="unlock-card__desc">每台设备的 1 次免费解锁机会已经用过了。<br>开通会员后，所有测试的完整长报告 + 高清结果图都能无限查看，而且免广告。</div>' +
                '<button class="btn btn-primary btn-block" id="unlockBtn">开通会员 · ¥' + esc(CFG.MEMBER_PRICE) + '/月</button>' +
                '<p style="margin:14px 0 0"><a style="color:var(--ink-sub);cursor:pointer" id="retryFromLock">换一套测试试试 →</a></p>' +
              '</div>') +
        '<div class="result-foot">' +
          '<a id="retryBtn">再测一次</a><a id="homeBtn">返回首页</a>' +
        '</div>' +
      '</div>';

    // 绘制海报（默认普通，解锁后高清）
    const canvas = document.getElementById('posterCanvas');
    function paintPoster(hd) { window.Poster.draw(canvas, result, hd, CFG.DISCLAIMER); }
    paintPoster(unlocked);

    document.getElementById('saveBtn').onclick = function () {
      try {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = '脑洞测试局-' + result.tag + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        toast('结果图已开始下载');
      } catch (e) { toast('保存失败：' + e.message, 'err'); }
    };

    document.getElementById('shareBtn').onclick = function () {
      const title = '我在「脑洞测试局」测出了「' + result.tag + '」，你来试试？';
      if (navigator.share) {
        navigator.share({ title: title, text: title, url: location.href })
          .catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () { toast('链接已复制，快分享给好友'); })
          .catch(function () { toast('请手动复制地址栏链接分享'); });
      } else {
        toast('请复制地址栏链接分享给好友');
      }
    };

    const unlockBtn = document.getElementById('unlockBtn');
    if (unlockBtn) {
      if (adFreeLeft > 0) {
        // 还有免费机会：看广告 → 解锁本次结果，并把唯一一次机会用掉
        unlockBtn.onclick = function () {
          playAdThenUnlock(test.id, result.id, function () {
            Data.useAdFree();
            Data.unlock(test.id, result.id);
            toast('已解锁完整报告（免费机会已用完）');
            renderResult(test.id, result.id);
          });
        };
      } else {
        // 免费机会用完：按钮直接引导开通会员
        unlockBtn.onclick = function () { go('#/member'); };
      }
    }

    const toVip = document.getElementById('toVip');
    if (toVip) toVip.onclick = function () { go('#/member'); };
    const retryFromLock = document.getElementById('retryFromLock');
    if (retryFromLock) retryFromLock.onclick = function () { go('#/'); };
    document.getElementById('retryBtn').onclick = function () { go('#/quiz/' + encodeURIComponent(test.id)); };
    document.getElementById('homeBtn').onclick = function () { go('#/'); };
  }

  // 演示激励广告（网站无微信广告能力，用倒计时模拟）
  function playAdThenUnlock(testId, resultId, done) {
    if (!CFG.AD_DEMO) { done(); return; }
    let left = CFG.AD_DEMO_SECONDS;
    showModal({
      title: '激励广告（演示）',
      showCancel: false,
      okText: '请稍候',
      desc: '网站版暂无微信激励广告，这里用倒计时模拟观看过程。',
      onOk: function () {}
    });
    const box = $modal.querySelector('.modal');
    box.insertAdjacentHTML('afterbegin',
      '<div class="spinner" style="margin-bottom:10px"></div>' +
      '<div class="ad-count" id="adCount">' + left + '</div>');
    const okBtn = document.getElementById('modalOk');
    if (okBtn) okBtn.disabled = true;
    const timer = setInterval(function () {
      left--;
      const c = document.getElementById('adCount');
      if (c) c.textContent = left;
      if (left <= 0) {
        clearInterval(timer);
        closeModal();
        done();
      }
    }, 1000);
  }

  // ============ 会员页 ============
  function renderMember() {
    const info = Data.getMemberInfo();
    const benefits = [
      { icon: '✦', title: '解锁全部测试', desc: '含「恋爱搭子适配测试」等会员专享内容' },
      { icon: '▤', title: '完整长报告', desc: '每套测试的深度人设报告无限查看' },
      { icon: '▶', title: '免广告', desc: '不用等 1 次免费机会，直接看高清结果图' },
      { icon: '♡', title: '持续更新', desc: '后续新增测试会员自动可用' }
    ];
    const benefitHtml = benefits.map(function (b) {
      return '<div class="benefit"><div class="benefit__icon">' + b.icon + '</div>' +
        '<div><div class="benefit__title">' + b.title + '</div><div class="benefit__desc">' + b.desc + '</div></div></div>';
    }).join('');

    $app.innerHTML =
      '<div class="member-wrap">' +
        (info.active
          ? '<div class="status-card"><div class="status-card__crown">✦</div><div class="status-card__title">你已是脑洞会员</div><div class="status-card__desc">有效期至 ' + esc(info.expireText) + '，全部权益已解锁</div></div>'
          : '<div class="price-card"><div class="price-card__tag">限时尝鲜价</div><div class="price-card__price"><small>¥</small>' + esc(CFG.MEMBER_PRICE) + '<em>/月</em></div><div>一杯奶茶钱，解锁全部脑洞</div></div>') +
        '<h2 class="section-title">会员权益</h2>' +
        '<div class="benefit-list">' + benefitHtml + '</div>' +
        '<div class="pay-card card" id="payCard">' +
          '<div class="pay-card__title">' + (info.active ? '会员已开通' : '立即开通会员 · 自动解锁') + '</div>' +
          (info.active
            ? '<div class="pay-card__note" style="text-align:center">有效期至 ' + esc(info.expireText) + '，全部会员内容已自动解锁 ✦</div>'
            : '<button class="btn btn-primary btn-block" id="wxPayBtn" style="margin:6px 0 16px">微信支付开通 · ¥' + esc(CFG.MEMBER_PRICE) + '/月</button>') +
          '<div class="pay-card__qr"><img src="assets/payment-qr.jpg" alt="收款码" id="qrImg"></div>' +
          '<div class="pay-card__tip">点击图片可放大查看（也可直接扫码转账）</div>' +
          '<div class="pay-card__note">' + esc(CFG.PAY_NOTE) + '</div>' +
          '<a href="#/service" class="svc-link">付款遇到问题？联系客服 →</a>' +
        '</div>' +
        // 激活码自助兑换：顾客付款后拿到激活码，在此输入即可开通会员（无需商户号）
        '<div class="card" id="codeCard" style="margin-top:16px">' +
          '<div class="pay-card__title">已有激活码？在此兑换</div>' +
          '<div class="pay-card__note" style="margin:8px 0 12px">扫码付款后点「我已付款」会自动发给你激活码；换设备时用码在此兑换即可。激活码一次有效。遇到问题？<a href="#/service" class="svc-inline">联系客服</a></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<input class="input" id="codeInput" placeholder="例如 ND-ABCD-1234" style="flex:1;min-width:180px;text-transform:uppercase">' +
            '<button class="btn btn-primary" id="redeemBtn">兑换开通</button>' +
          '</div>' +
        '</div>' +
        '<p class="compliance">本测试仅供娱乐，不具备科学测评、心理诊断效力。<br>会员为趣味内容解锁，非任何专业服务。</p>' +
      '</div>';

    // 支付按钮：弹出收款码 +「已付款 / 还没付款」确认弹窗。
    // 顾客扫码付款后点「我已付款」→ 服务端生成激活码并直接为当前设备开通会员。
    function openPayDialog() {
      const qrHtml =
        '<div class="pay-dialog-qr"><img src="assets/payment-qr.jpg" alt="收款码"></div>' +
        '<div class="pay-dialog-hint">微信扫码付款 ¥' + esc(CFG.MEMBER_PRICE) + '，付款完成后点击下方按钮</div>';
      showModal({
        title: '扫码付款开通会员',
        desc: '请用微信扫描下方收款码付款。付款完成后，请如实点击下方按钮：',
        html: qrHtml,
        cancelText: '还没付款',
        okText: '我已付款',
        onCancel: function () {},
        onOk: function () {
          if (!window.Pay || !window.Pay.claimCode) {
            toast('当前站点未连接会员服务，无法自助开通', 'err');
            return;
          }
          const btn = document.getElementById('modalOk');
          if (btn) { btn.disabled = true; btn.textContent = '开通中…'; }
          window.Pay.claimCode().then(function (r) {
            if (r.error) {
              if (btn) { btn.disabled = false; btn.textContent = '我已付款'; }
              toast(r.error, 'err');
              return;
            }
            // 服务端已为当前设备开通会员 + 生成激活码，写入本地并立即解锁
            Data.grantMemberFromServer(r.expireAt);
            // 展示激活码弹窗：顾客可复制保存，换设备时凭此码兑换
            showModal({
              title: '开通成功 ✦',
              desc: '会员已解锁，全部内容已可使用。这是你的专属激活码（换设备时可凭此码兑换，请保存）：',
              html: '<div class="claim-code-box"><code id="claimCodeVal">' + esc(r.code) + '</code>' +
                    '<button class="btn btn-ghost" id="copyClaimBtn" style="margin-top:10px">复制激活码</button></div>',
              okText: '完成', showCancel: false,
              onOk: function () { renderMember(); }
            });
            const copyBtn = document.getElementById('copyClaimBtn');
            if (copyBtn) copyBtn.onclick = function () { copyText(r.code, copyBtn); };
          }).catch(function (e) {
            if (btn) { btn.disabled = false; btn.textContent = '我已付款'; }
            toast('开通失败：' + (e.message || '请重试'), 'err');
          });
        }
      });
    }
    const wxPayBtn = document.getElementById('wxPayBtn');
    if (wxPayBtn) wxPayBtn.onclick = openPayDialog;

    const qrImg = document.getElementById('qrImg');
    if (qrImg) qrImg.onclick = openPayDialog;

    // 激活码兑换：调用服务端核销，成功后写本地会员并刷新页面
    const redeemBtn = document.getElementById('redeemBtn');
    const codeInput = document.getElementById('codeInput');
    if (redeemBtn) redeemBtn.onclick = function () {
      const code = (codeInput.value || '').trim().toUpperCase();
      if (!code) { toast('请输入激活码', 'err'); return; }
      if (!window.Pay || !window.Pay.redeemCode) {
        toast('当前站点未连接会员服务，无法兑换', 'err'); return;
      }
      redeemBtn.disabled = true;
      window.Pay.redeemCode(code).then(function (r) {
        if (r.error) { toast(r.error, 'err'); redeemBtn.disabled = false; return; }
        // 用服务端下发的到期时间写入本地会员，立即解锁
        Data.grantMemberFromServer(r.expireAt);
        toast('兑换成功，会员已开通，全部内容已解锁');
        renderMember();
      }).catch(function (e) {
        toast('兑换失败：' + (e.message || '请重试'), 'err');
        redeemBtn.disabled = false;
      });
    };
  }

  // ============ 联系客服 ============
  // 顾客联系客服的通道：直接联系方式（微信/QQ/邮箱，可一键复制）+ 站内留言。
  // 站内留言存服务端，管理员在后台回复，顾客刷新即可看到回复，形成闭环。
  function renderService() {
    // 直接联系方式（配置了才显示）
    const contacts = [];
    if (CFG.SERVICE_WECHAT) contacts.push({ label: '微信号', value: CFG.SERVICE_WECHAT, icon: '微' });
    if (CFG.SERVICE_QQ) contacts.push({ label: 'QQ', value: CFG.SERVICE_QQ, icon: 'Q' });
    if (CFG.SERVICE_EMAIL) contacts.push({ label: '邮箱', value: CFG.SERVICE_EMAIL, icon: '✉' });
    const contactHtml = contacts.length
      ? contacts.map(function (c) {
          return '<div class="svc-contact">' +
            '<span class="svc-contact__icon">' + esc(c.icon) + '</span>' +
            '<div class="svc-contact__body"><div class="svc-contact__label">' + esc(c.label) + '</div>' +
            '<div class="svc-contact__value">' + esc(c.value) + '</div></div>' +
            '<button class="btn btn-ghost svc-copy" data-copy="' + esc(c.value) + '">复制</button>' +
          '</div>';
        }).join('')
      : '<p class="text-sub">站长暂未填写直接联系方式，请用下方「站内留言」联系。</p>';

    $app.innerHTML =
      '<div class="service-wrap">' +
        '<h2 class="section-title" style="margin-top:6px">联系客服</h2>' +
        '<div class="panel card">' +
          '<div class="panel__title">有问题？这样联系我们 ✦</div>' +
          '<p class="svc-tip">' + nl2br(CFG.SERVICE_TIP || '') + '</p>' +
          '<div class="svc-contacts">' + contactHtml + '</div>' +
        '</div>' +
        // 站内留言
        '<div class="panel card">' +
          '<div class="panel__title">站内留言</div>' +
          '<p class="text-sub" style="margin:6px 0 14px">付款后没拿到激活码？或遇到任何问题？在这里留言，站长会回复你。</p>' +
          '<label class="field-label">你的联系方式（选填，方便我们找到你）</label>' +
          '<input class="input" id="msgContact" placeholder="例如：微信号 / 手机号" maxlength="100">' +
          '<label class="field-label" style="margin-top:12px">留言内容</label>' +
          '<textarea class="textarea" id="msgContent" rows="4" placeholder="例如：我已付款，请给我激活码" maxlength="500"></textarea>' +
          '<div class="admin-actions"><button class="btn btn-primary" id="msgSendBtn">发送留言</button></div>' +
        '</div>' +
        // 我的留言与回复
        '<div class="panel card">' +
          '<div class="panel__head"><div class="panel__title">我的留言</div>' +
          '<button class="btn btn-ghost" id="msgRefreshBtn">刷新</button></div>' +
          '<div id="myMsgList" class="msg-list"><p class="text-sub">加载中…</p></div>' +
        '</div>' +
        '<p class="compliance">本测试仅供娱乐，不具备科学测评、心理诊断效力。</p>' +
      '</div>';

    // 一键复制联系方式
    $app.querySelectorAll('.svc-copy').forEach(function (btn) {
      btn.onclick = function () { copyText(btn.dataset.copy, btn); };
    });

    // 发送留言
    const sendBtn = document.getElementById('msgSendBtn');
    if (sendBtn) sendBtn.onclick = function () {
      const contact = (document.getElementById('msgContact').value || '').trim();
      const content = (document.getElementById('msgContent').value || '').trim();
      if (!content) { toast('请填写留言内容', 'err'); return; }
      if (!window.Pay || !window.Pay.sendMessage) { toast('当前站点未连接客服服务，无法留言', 'err'); return; }
      sendBtn.disabled = true;
      window.Pay.sendMessage(contact, content).then(function (r) {
        if (r.error) { toast(r.error, 'err'); sendBtn.disabled = false; return; }
        toast('留言已发送，请等待站长回复');
        document.getElementById('msgContent').value = '';
        sendBtn.disabled = false;
        loadMyMessages();
      }).catch(function (e) {
        toast('发送失败：' + (e.message || '请重试'), 'err');
        sendBtn.disabled = false;
      });
    };

    // 刷新我的留言
    const refreshBtn = document.getElementById('msgRefreshBtn');
    if (refreshBtn) refreshBtn.onclick = function () { loadMyMessages(); };

    function loadMyMessages() {
      const box = document.getElementById('myMsgList');
      if (!box) return;
      if (!window.Pay || !window.Pay.getMyMessages) {
        box.innerHTML = '<p class="text-sub">当前站点未连接客服服务，无法查看留言</p>';
        return;
      }
      window.Pay.getMyMessages().then(function (list) {
        if (!list.length) { box.innerHTML = '<p class="text-sub">你还没有留言</p>'; return; }
        box.innerHTML = list.map(function (m) {
          const dt = m.createdAt ? new Date(m.createdAt).toLocaleString('zh-CN') : '';
          const replied = m.reply && m.reply.trim();
          return '<div class="msg-item">' +
            '<div class="msg-item__head"><span class="msg-item__who">我</span><span class="msg-item__time">' + esc(dt) + '</span>' +
            '<span class="msg-badge ' + (replied ? 'msg-badge--ok' : '') + '">' + (replied ? '已回复' : '待回复') + '</span></div>' +
            '<div class="msg-item__text">' + nl2br(m.content) + '</div>' +
            (replied
              ? '<div class="msg-reply"><div class="msg-reply__label">站长回复' +
                (m.repliedAt ? ' · ' + esc(new Date(m.repliedAt).toLocaleString('zh-CN')) : '') + '</div>' +
                '<div class="msg-reply__text">' + nl2br(m.reply) + '</div></div>'
              : '') +
          '</div>';
        }).join('');
      }).catch(function () {
        box.innerHTML = '<p class="text-sub">加载失败，请点「刷新」重试</p>';
      });
    }
    loadMyMessages();
  }

  // 复制文本到剪贴板（带降级方案）
  function copyText(text, btn) {
    function done() {
      const old = btn.textContent;
      btn.textContent = '已复制';
      if (toast) toast('已复制：' + text);
      setTimeout(function () { btn.textContent = old; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动复制', 'err'); }
      document.body.removeChild(ta);
    }
  }

  // ============ 后台管理 ============
  function renderAdmin() {
    const tests = Data.listTests();
    const info = Data.getMemberInfo();
    const rows = tests.map(function (t) {
      const colors = t.coverColors || ['#8FD3B6', '#5FB99A'];
      const cover = t.coverImage
        ? '<img src="' + esc(t.coverImage) + '" alt="">'
        : esc(t.emoji || '✦');
      const qc = (t.questions && t.questions.length) || 0;
      const rc = (t.results && t.results.length) || 0;
      return '<div class="admin-item">' +
        '<div class="admin-item__cover" style="background:linear-gradient(135deg,' + esc(colors[0]) + ',' + esc(colors[1]) + ')">' + cover + '</div>' +
        '<div class="admin-item__body">' +
          '<div class="admin-item__title">' + esc(t.title) + '</div>' +
          '<div class="admin-item__meta">' + qc + ' 道题 · ' + rc + ' 个结果 · ID: ' + esc(t.id) + '</div>' +
          '<div class="admin-item__ops">' +
            '<span class="op" data-act="edit" data-id="' + esc(t.id) + '">编辑</span>' +
            '<span class="op op--danger" data-act="del" data-id="' + esc(t.id) + '" data-title="' + esc(t.title) + '">删除</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    $app.innerHTML =
      '<div class="admin-wrap">' +
        '<h2 class="section-title" style="margin-top:6px">内容管理后台</h2>' +
        '<div class="panel card"><div class="panel__title">激活码管理（无需商户号的收款方式）</div>' +
          '<div class="pay-card__note" style="margin:6px 0 12px">' +
            '流程：顾客扫码付款后 → 你在这里生成激活码发给顾客 → 顾客在会员页输入即自动开通。激活码一次有效。</div>' +
          '<div class="admin-actions">' +
            '<button class="btn btn-primary" id="genCodeBtn">生成激活码</button>' +
            '<button class="btn btn-ghost" id="refreshCodeBtn">刷新列表</button>' +
          '</div>' +
          '<div id="codeList" class="code-list"><p class="text-sub">点击「刷新列表」查看已生成的激活码</p></div>' +
        '</div>' +
        '<div class="panel card"><div class="panel__title">按设备 ID 手动开通（备用）</div>' +
          '<div class="pay-card__note" style="margin:6px 0 12px">' +
            '顾客把其设备 ID 发给你时，可在此直接开通/取消。设备 ID 可在顾客浏览器控制台获取，或由其提供。</div>' +
          '<div class="admin-actions">' +
            '<button class="btn btn-primary" id="grantCidBtn">按设备ID开通</button>' +
            '<button class="btn btn-ghost" id="revokeCidBtn">按设备ID取消</button>' +
          '</div>' +
        '</div>' +
        // 客服留言管理
        '<div class="panel card"><div class="panel__head">' +
          '<div class="panel__title">客服留言（<span id="msgCount">-</span>）</div>' +
          '<button class="btn btn-ghost" id="msgListBtn">刷新留言</button></div>' +
          '<div class="pay-card__note" style="margin:0 0 12px">顾客在「联系客服」页提交的留言会显示在这里。回复后顾客刷新即可看到；处理完可删除。</div>' +
          '<div id="adminMsgList" class="msg-list"><p class="text-sub">点击「刷新留言」查看</p></div>' +
        '</div>' +
        '<div class="panel card"><div class="panel__head">' +
          '<div class="panel__title">测试题库（' + tests.length + '）</div>' +
          '<button class="btn btn-primary" id="addBtn">+ 新增测试</button>' +
        '</div>' + (rows || '<p class="text-sub">暂无测试</p>') + '</div>' +
        '<div class="admin-actions"><button class="btn btn-ghost" id="resetBtn">恢复内置 3 套测试</button></div>' +
        '<div class="tip">说明：题库已保存到服务端，所有设备共享同一份；激活码与会员状态也在服务端。本机会员预览：' +
          (info.active ? '有效，到期 ' + esc(info.expireText) : '未开通') + '</div>' +
      '</div>';

    document.getElementById('addBtn').onclick = function () {
      showModal({ title: '新增测试', desc: '输入测试标题', placeholder: '例如：我的脑洞人设',
        onOk: function (val) {
          if (!val || !val.trim()) { toast('标题不能为空', 'err'); return; }
          const id = 'test_' + Date.now();
          const newTest = {
            id: id, title: val.trim(), subtitle: '点我编辑副标题', emoji: '✦',
            coverColors: ['#8FD3B6', '#5FB99A'], coverImage: '', desc: '点我编辑测试介绍',
            questions: [{ id: id + '_q1', title: '在这里输入第 1 道题', options: [
              { key: 'A', text: '选项 A', weights: {} }, { key: 'B', text: '选项 B', weights: {} },
              { key: 'C', text: '选项 C', weights: {} }, { key: 'D', text: '选项 D', weights: {} }
            ] }],
            results: [{ id: id + '_r1', tag: '人设一', title: '结果标题', short: '免费短评',
              full: '完整长报告', emoji: '✦', colors: ['#8FD3B6', '#5FB99A'] }]
          };
          Data.saveTest(newTest).then(function (r) {
            if (r && r.error) { toast(r.error.message, 'err'); return; }
            go('#/admin-edit/' + encodeURIComponent(id));
          });
        } });
    };
    $app.querySelectorAll('.op').forEach(function (el) {
      el.onclick = function () {
        const id = el.dataset.id;
        if (el.dataset.act === 'edit') { go('#/admin-edit/' + encodeURIComponent(id)); }
        else if (el.dataset.act === 'del') {
          showModal({ title: '删除测试', desc: '确定删除「' + el.dataset.title + '」吗？不可恢复。',
            okText: '删除', onOk: function () {
              Data.removeTest(id).then(function (r) {
                if (r && r.error) { toast(r.error.message, 'err'); return; }
                toast('已删除'); renderAdmin();
              });
            } });
        }
      };
    });
    // 激活码：生成
    document.getElementById('genCodeBtn').onclick = function () {
      showModal({ title: '生成激活码', desc: '每个激活码可开通的月数（1~12）', placeholder: '1', value: '1',
        onOk: function (months) {
          showModal({ title: '生成数量', desc: '一次生成几个码（1~100）', placeholder: '5', value: '5',
            onOk: function (count) {
              if (!window.Pay || !window.Pay.generateCodes) { toast('会员服务不可用', 'err'); return; }
              window.Pay.generateCodes(count, months, Data.getAdminToken()).then(function (r) {
                if (r.error) { toast(r.error, 'err'); return; }
                showModal({
                  title: '生成成功（' + r.codes.length + ' 个）',
                  desc: '复制下方激活码发给已付款的顾客，每个码只能使用一次：',
                  okText: '关闭', showCancel: false,
                  onOk: function () {}
                });
                const box = $modal.querySelector('.modal');
                const area = document.createElement('div');
                area.style.cssText = 'font-family:monospace;font-size:15px;line-height:1.9;background:#F3F7F4;padding:12px;border-radius:8px;margin:10px 0;word-break:break-all;user-select:all';
                area.textContent = r.codes.join('\n');
                box.insertBefore(area, box.querySelector('.modal__actions'));
                loadCodes();
              }).catch(function (e) { toast('生成失败：' + (e.message || '请重试'), 'err'); });
            } });
        } });
    };
    // 激活码：刷新列表
    document.getElementById('refreshCodeBtn').onclick = function () { loadCodes(); };
    function loadCodes() {
      if (!window.Pay || !window.Pay.listCodes) { toast('会员服务不可用', 'err'); return; }
      window.Pay.listCodes(Data.getAdminToken()).then(function (r) {
        const box = document.getElementById('codeList');
        if (!box) return;
        const list = r.codes || [];
        if (!list.length) { box.innerHTML = '<p class="text-sub">还没有激活码，点击「生成激活码」创建</p>'; return; }
        const label = { unused: '未使用', used: '已使用', void: '已作废' };
        box.innerHTML = '<div class="code-table">' + list.map(function (c) {
          const dt = c.usedAt ? new Date(c.usedAt).toLocaleDateString('zh-CN') : (c.createdAt ? new Date(c.createdAt).toLocaleDateString('zh-CN') : '');
          return '<div class="code-row"><code>' + esc(c.code) + '</code>' +
            '<span class="code-meta">' + c.months + '个月 · ' + label[c.status] + ' · ' + dt + '</span>' +
            (c.status === 'unused'
              ? '<span class="op op--danger" data-revcode="' + esc(c.code) + '">作废</span>' : '') +
            '</div>';
        }).join('') + '</div>';
        box.querySelectorAll('[data-revcode]').forEach(function (el) {
          el.onclick = function () {
            showModal({ title: '作废激活码', desc: '确定作废 ' + el.dataset.revcode + ' 吗？', okText: '作废',
              onOk: function () {
                window.Pay.revokeCode(el.dataset.revcode, Data.getAdminToken()).then(function (rr) {
                  if (rr.error) { toast(rr.error, 'err'); return; }
                  toast('已作废'); loadCodes();
                });
              } });
          };
        });
      }).catch(function (e) { toast('加载失败：' + (e.message || '请重试'), 'err'); });
    }

    // 按设备 ID 手动开通 / 取消
    document.getElementById('grantCidBtn').onclick = function () {
      showModal({ title: '按设备ID开通会员', desc: '输入顾客的设备 ID（clientId）与月数，格式：设备ID,月数', placeholder: '例如 a1b2c3d4...,1',
        onOk: function (val) {
          const parts = String(val || '').split(',').map(function (s) { return s.trim(); });
          if (!parts[0] || parts[0].length < 8) { toast('设备 ID 无效（至少8位）', 'err'); return; }
          if (!window.Pay || !window.Pay.adminGrantMember) { toast('会员服务不可用', 'err'); return; }
          window.Pay.adminGrantMember(parts[0], parts[1] || 1, Data.getAdminToken()).then(function (r) {
            if (r.error) { toast(r.error, 'err'); return; }
            toast('已开通，到期 ' + Data.formatDate(r.expireAt));
          }).catch(function (e) { toast('开通失败：' + (e.message || '请重试'), 'err'); });
        } });
    };
    document.getElementById('revokeCidBtn').onclick = function () {
      showModal({ title: '按设备ID取消会员', desc: '输入要取消的设备 ID（clientId）', placeholder: '设备ID',
        onOk: function (val) {
          if (!val || val.trim().length < 8) { toast('设备 ID 无效', 'err'); return; }
          if (!window.Pay || !window.Pay.adminRevokeMember) { toast('会员服务不可用', 'err'); return; }
          window.Pay.adminRevokeMember(val.trim(), Data.getAdminToken()).then(function (r) {
            if (r.error) { toast(r.error, 'err'); return; }
            toast('已取消');
          }).catch(function (e) { toast('取消失败：' + (e.message || '请重试'), 'err'); });
        } });
    };
    // 客服留言：刷新列表
    const msgListBtn = document.getElementById('msgListBtn');
    if (msgListBtn) msgListBtn.onclick = function () { loadAdminMessages(); };
    function loadAdminMessages() {
      if (!window.Pay || !window.Pay.adminListMessages) { toast('客服服务不可用', 'err'); return; }
      window.Pay.adminListMessages(Data.getAdminToken()).then(function (list) {
        const countEl = document.getElementById('msgCount');
        const box = document.getElementById('adminMsgList');
        if (countEl) countEl.textContent = list.length;
        if (!box) return;
        if (!list.length) { box.innerHTML = '<p class="text-sub">暂无顾客留言</p>'; return; }
        box.innerHTML = list.map(function (m) {
          const dt = m.createdAt ? new Date(m.createdAt).toLocaleString('zh-CN') : '';
          const replied = m.reply && m.reply.trim();
          return '<div class="msg-item">' +
            '<div class="msg-item__head"><span class="msg-item__who">' + esc(m.contact || '匿名顾客') + '</span>' +
            '<span class="msg-item__time">' + esc(dt) + '</span>' +
            '<span class="msg-badge ' + (replied ? 'msg-badge--ok' : '') + '">' + (replied ? '已回复' : '待回复') + '</span></div>' +
            '<div class="msg-item__text">' + nl2br(m.content) + '</div>' +
            (replied ? '<div class="msg-reply"><div class="msg-reply__label">我的回复</div>' +
              '<div class="msg-reply__text">' + nl2br(m.reply) + '</div></div>' : '') +
            '<div class="msg-item__ops">' +
              '<span class="op" data-msgreply="' + esc(m.id) + '">' + (replied ? '修改回复' : '回复') + '</span>' +
              '<span class="op op--danger" data-msgdel="' + esc(m.id) + '">删除</span>' +
            '</div>' +
          '</div>';
        }).join('');
        box.querySelectorAll('[data-msgreply]').forEach(function (el) {
          el.onclick = function () {
            const id = el.dataset.msgreply;
            const cur = list.find(function (m) { return m.id === id; });
            showModal({ title: '回复留言', desc: '给顾客输入回复内容（可再次修改）',
              input: true, value: cur && cur.reply ? cur.reply : '', placeholder: '例如：已收到付款，激活码是 ND-XXXX-XXXX',
              okText: '发送回复', onOk: function (val) {
                if (!val || !val.trim()) { toast('回复内容不能为空', 'err'); return; }
                window.Pay.adminReplyMessage(id, val.trim(), Data.getAdminToken()).then(function (r) {
                  if (r.error) { toast(r.error, 'err'); return; }
                  toast('已回复'); loadAdminMessages();
                }).catch(function (e) { toast('回复失败：' + (e.message || '请重试'), 'err'); });
              } });
          };
        });
        box.querySelectorAll('[data-msgdel]').forEach(function (el) {
          el.onclick = function () {
            showModal({ title: '删除留言', desc: '确定删除这条留言吗？不可恢复。', okText: '删除',
              onOk: function () {
                window.Pay.adminDeleteMessage(el.dataset.msgdel, Data.getAdminToken()).then(function (r) {
                  if (r.error) { toast(r.error, 'err'); return; }
                  toast('已删除'); loadAdminMessages();
                });
              } });
          };
        });
      }).catch(function (e) { toast('加载失败：' + (e.message || '请重试'), 'err'); });
    }
    loadAdminMessages();

    document.getElementById('resetBtn').onclick = function () {
      showModal({ title: '恢复内置题库', desc: '将用内置 3 套测试覆盖当前所有测试，确定继续吗？',
        okText: '恢复', onOk: function () {
          Data.resetTests().then(function (r) {
            if (r && r.error) { toast(r.error.message, 'err'); return; }
            toast('已恢复'); renderAdmin();
          });
        } });
    };
  }

  // ============ 编辑器 ============
  function renderEdit(testId) {
    let test;
    try { test = JSON.parse(JSON.stringify(Data.getTest(decodeURIComponent(testId || '')))); } catch (e) {}
    if (!test) { toast('测试不存在', 'err'); go('#/admin'); return; }

    let tab = 'basic';
    const TABS = [
      { key: 'basic', name: '基本信息' }, { key: 'questions', name: '题目与权重' },
      { key: 'results', name: '结果报告' }, { key: 'cover', name: '封面图' }
    ];

    function paint() {
      let body = '';
      if (tab === 'basic') {
        body =
          basicField('title', '测试标题', test.title) +
          basicField('subtitle', '卡片副标题', test.subtitle) +
          '<div class="field"><label class="field__label">测试介绍</label><textarea class="textarea" data-basic="desc">' + esc(test.desc) + '</textarea></div>' +
          basicField('emoji', '封面装饰符号（emoji）', test.emoji) +
          '<label class="check-row"><input type="checkbox" id="memberOnlyChk"' + (Data.isMemberOnly(test) ? ' checked' : '') + '>' +
            '<span>会员专享（未开通会员不能开始这套测试，首页显示「会员专享」）</span></label>';
      } else if (tab === 'questions') {
        body = (test.questions || []).map(function (q, qi) {
          const opts = (q.options || []).map(function (o, oi) {
            const weights = (test.results || []).map(function (res) {
              return '<div class="weight"><label>' + esc(res.tag) + '</label>' +
                '<input type="number" data-wi="' + oi + '" data-qi="' + qi + '" data-rid="' + esc(res.id) + '" value="' + esc((o.weights && o.weights[res.id]) || 0) + '"></div>';
            }).join('');
            return '<div class="option-edit"><div class="option-edit__head">' +
              '<span class="option-edit__key">' + esc(o.key) + '</span>' +
              '<input class="input" data-otext="' + oi + '" data-qi="' + qi + '" value="' + esc(o.text) + '"></div>' +
              '<div class="weights">' + weights + '</div></div>';
          }).join('');
          return '<div class="q-card card"><div class="q-card__head">' +
            '<span class="q-card__no">第 ' + (qi + 1) + ' 题</span>' +
            '<span class="op op--danger" data-delq="' + qi + '">删除</span></div>' +
            '<input class="input" data-qtitle="' + qi + '" value="' + esc(q.title) + '">' + opts + '</div>';
        }).join('') +
        '<button class="add-btn" id="addQ">+ 添加题目</button>' +
        '<div class="tip">权重越高，选中该选项时越容易匹配到对应人设。一般每题给 1~2 个结果 3 分，其余 0 分。</div>';
      } else if (tab === 'results') {
        body = (test.results || []).map(function (r, ri) {
          return '<div class="r-card card"><div class="q-card__head">' +
            '<span class="q-card__no">结果 ' + (ri + 1) + '</span>' +
            '<span class="op op--danger" data-delr="' + ri + '">删除</span></div>' +
            resField('tag', '人设标签', r.tag, ri) +
            resField('title', '结果标题', r.title, ri) +
            '<div class="field"><label class="field__label">免费短评</label><textarea class="textarea" data-res="short" data-ri="' + ri + '">' + esc(r.short) + '</textarea></div>' +
            '<div class="field"><label class="field__label">完整长报告（解锁后可见）</label><textarea class="textarea tall" data-res="full" data-ri="' + ri + '">' + esc(r.full) + '</textarea></div>' +
            resField('emoji', '配图 emoji', r.emoji, ri) +
            '</div>';
        }).join('') +
        '<button class="add-btn" id="addR">+ 添加结果</button>' +
        '<div class="tip">新增结果后，记得回到「题目与权重」为新结果设置各选项权重。</div>';
      } else {
        const colors = test.coverColors || ['#8FD3B6', '#5FB99A'];
        body = '<div class="card" style="text-align:center">' +
          '<div class="cover-preview" style="background:linear-gradient(135deg,' + esc(colors[0]) + ',' + esc(colors[1]) + ')">' +
            (test.coverImage ? '<img src="' + esc(test.coverImage) + '" alt="">' : esc(test.emoji || '✦')) + '</div>' +
          '<input type="file" id="coverFile" accept="image/*" style="display:none">' +
          '<button class="btn btn-primary" id="uploadBtn">上传封面图</button> ' +
          (test.coverImage ? '<button class="btn btn-ghost" id="clearCover">清除封面图</button> ' : '') +
          '<button class="btn btn-ghost" id="cycleColor">切换渐变配色</button>' +
          '<div class="tip" style="text-align:left">不上传图片时使用 emoji + 渐变色作为封面。当前配色：' + esc(colors[0]) + ' → ' + esc(colors[1]) + '</div>' +
        '</div>';
      }

      $app.innerHTML =
        '<div class="edit-wrap">' +
          '<h2 class="section-title" style="margin-top:6px">编辑测试：' + esc(test.title) + '</h2>' +
          '<div class="tabs">' + TABS.map(function (t) {
            return '<div class="tab ' + (tab === t.key ? 'active' : '') + '" data-tab="' + t.key + '">' + t.name + '</div>';
          }).join('') + '</div>' +
          body +
          '<div class="save-bar"><button class="btn btn-primary" id="saveBtn">保存修改</button></div>' +
        '</div>';

      bind();
    }

    function basicField(field, label, val) {
      return '<div class="field"><label class="field__label">' + label + '</label>' +
        '<input class="input" data-basic="' + field + '" value="' + esc(val) + '"></div>';
    }
    function resField(field, label, val, ri) {
      return '<div class="field"><label class="field__label">' + label + '</label>' +
        '<input class="input" data-res="' + field + '" data-ri="' + ri + '" value="' + esc(val) + '"></div>';
    }

    function bind() {
      $app.querySelectorAll('.tab').forEach(function (el) {
        el.onclick = function () { commitVisible(); tab = el.dataset.tab; paint(); };
      });
      document.getElementById('saveBtn').onclick = function () {
        commitVisible();
        if (!test.title || !test.title.trim()) { toast('请填写测试标题', 'err'); return; }
        if (!test.questions.length || !test.results.length) { toast('题目和结果不能为空', 'err'); return; }
        const r = Data.saveTest(test);
        Promise.resolve(r).then(function (res) {
          toast(res && res.error ? res.error.message : '保存成功');
          if (!(res && res.error)) setTimeout(function () { go('#/admin'); }, 500);
        });
      };

      $app.querySelectorAll('[data-basic]').forEach(function (el) {
        el.oninput = function () { test[el.dataset.basic] = el.value; };
      });
      const memberOnlyChk = document.getElementById('memberOnlyChk');
      if (memberOnlyChk) memberOnlyChk.onchange = function () { test.memberOnly = memberOnlyChk.checked; };
      $app.querySelectorAll('[data-qtitle]').forEach(function (el) {
        el.oninput = function () { test.questions[+el.dataset.qtitle].title = el.value; };
      });
      $app.querySelectorAll('[data-otext]').forEach(function (el) {
        el.oninput = function () { test.questions[+el.dataset.qi].options[+el.dataset.otext].text = el.value; };
      });
      $app.querySelectorAll('[data-wi]').forEach(function (el) {
        el.oninput = function () {
          const o = test.questions[+el.dataset.qi].options[+el.dataset.wi];
          o.weights = o.weights || {};
          o.weights[el.dataset.rid] = parseInt(el.value, 10) || 0;
        };
      });
      $app.querySelectorAll('[data-res]').forEach(function (el) {
        el.oninput = function () { test.results[+el.dataset.ri][el.dataset.res] = el.value; };
      });
      $app.querySelectorAll('[data-delq]').forEach(function (el) {
        el.onclick = function () {
          if (test.questions.length <= 1) { toast('至少保留 1 道题', 'err'); return; }
          commitVisible(); test.questions.splice(+el.dataset.delq, 1); paint();
        };
      });
      $app.querySelectorAll('[data-delr]').forEach(function (el) {
        el.onclick = function () {
          if (test.results.length <= 1) { toast('至少保留 1 个结果', 'err'); return; }
          commitVisible(); test.results.splice(+el.dataset.delr, 1); paint();
        };
      });
      const addQ = document.getElementById('addQ');
      if (addQ) addQ.onclick = function () {
        commitVisible();
        const qid = test.id + '_q' + (test.questions.length + 1);
        test.questions.push({ id: qid, title: '新题目', options: ['A','B','C','D'].map(function (k) {
          return { key: k, text: '选项 ' + k, weights: {} };
        }) });
        paint();
      };
      const addR = document.getElementById('addR');
      if (addR) addR.onclick = function () {
        commitVisible();
        const rid = test.id + '_r' + (test.results.length + 1);
        test.results.push({ id: rid, tag: '新人设', title: '结果标题', short: '免费短评',
          full: '完整长报告', emoji: '✦', colors: ['#8FD3B6', '#5FB99A'] });
        paint();
      };
      const uploadBtn = document.getElementById('uploadBtn');
      if (uploadBtn) {
        const fileInput = document.getElementById('coverFile');
        uploadBtn.onclick = function () { fileInput.click(); };
        fileInput.onchange = function () {
          const file = fileInput.files[0];
          if (!file) return;
          if (file.size > 2 * 1024 * 1024) { toast('图片请小于 2MB', 'err'); return; }
          const reader = new FileReader();
          reader.onload = function (e) {
            test.coverImage = e.target.result;
            Promise.resolve(Data.saveTest(test)).then(function (res) {
              toast(res && res.error ? res.error.message : '封面已上传');
            });
            paint();
          };
          reader.readAsDataURL(file);
        };
      }
      const clearCover = document.getElementById('clearCover');
      if (clearCover) clearCover.onclick = function () {
        test.coverImage = '';
        Promise.resolve(Data.saveTest(test)).then(function (res) {
          if (res && res.error) toast(res.error.message, 'err');
        });
        paint();
      };
      const cycleColor = document.getElementById('cycleColor');
      if (cycleColor) cycleColor.onclick = function () {
        const palettes = [
          ['#8FD3B6', '#5FB99A'], ['#B8A6E6', '#8E7BCB'], ['#F2A9A0', '#E07B72'],
          ['#8FA9D6', '#5C7FBA'], ['#F6D58A', '#E8AE54']
        ];
        const cur = (test.coverColors || [])[0];
        const map = { '#8FD3B6': 1, '#B8A6E6': 2, '#F2A9A0': 3, '#8FA9D6': 4, '#F6D58A': 0 };
        test.coverColors = palettes[map[cur] == null ? 0 : map[cur]];
        Promise.resolve(Data.saveTest(test)).then(function (res) {
          if (res && res.error) toast(res.error.message, 'err');
        });
        paint();
      };
    }

    // 切换 tab 时把当前可见输入同步进 test（多数已通过 oninput 同步，这里兜底 textarea）
    function commitVisible() {
      $app.querySelectorAll('[data-basic]').forEach(function (el) { test[el.dataset.basic] = el.value; });
      $app.querySelectorAll('[data-qtitle]').forEach(function (el) { test.questions[+el.dataset.qtitle].title = el.value; });
      $app.querySelectorAll('[data-otext]').forEach(function (el) { test.questions[+el.dataset.qi].options[+el.dataset.otext].text = el.value; });
      $app.querySelectorAll('[data-res]').forEach(function (el) { test.results[+el.dataset.ri][el.dataset.res] = el.value; });
    }

    paint();
  }

  // ============ 路由 ============
  function router() {
    const hash = window.location.hash || '#/';
    syncNav(hash);
    closeModal();
    if (hash === '#/' || hash === '') { renderHome(); }
    else if (hash.indexOf('#/quiz/') === 0) { renderQuiz(hash.slice('#/quiz/'.length)); }
    else if (hash.indexOf('#/result/') === 0) {
      const parts = hash.slice('#/result/'.length).split('/');
      renderResult(parts[0], parts[1]);
      // 同步服务端会员状态：若刚支付成功，重绘结果页以显示已解锁内容
      if (window.Pay && window.Pay.refreshMemberFromServer) {
        window.Pay.refreshMemberFromServer().then(function () {
          const hadUnlockCard = !!document.getElementById('unlockBtn');
          if (Data.isMember() && hadUnlockCard) renderResult(parts[0], parts[1]);
        });
      }
    }     else if (hash === '#/member') {
      renderMember();
      // 异步同步服务端会员状态（支付在其他地方完成后回来，这里自动识别并解锁）
      if (window.Pay && window.Pay.refreshMemberFromServer) {
        window.Pay.refreshMemberFromServer().then(function () {
          if (!Data.isMember()) return;
          // 若本地视图仍是「未开通」（例如刚同步成功），重绘一次
          if (!document.getElementById('wxPayBtn')) return;
          renderMember();
        });
      }
    }
    else if (hash === '#/service') { renderService(); }
    else if (hash === '#/admin') { requireAdmin(renderAdmin); }
    else if (hash.indexOf('#/admin-edit/') === 0) {
      const testId = hash.slice('#/admin-edit/'.length);
      requireAdmin(function () { renderEdit(testId); });
    }
    else { renderHome(); }
    window.scrollTo(0, 0);
  }

  // ---------- 启动 ----------
  // 先同步种子/本地缓存让首屏可用，渲染导航与免责声明；
  // 再从服务端拉取共享题库，成功后重绘当前页，确保所有设备看到同一份内容。
  const bootInit = Data.init();
  renderDisclaimerBar();
  window.addEventListener('hashchange', router);
  router();
  Promise.resolve(bootInit).then(function (updated) {
    if (updated) router(); // 云端题库已覆盖本地，重绘以显示最新内容
  });
})();
