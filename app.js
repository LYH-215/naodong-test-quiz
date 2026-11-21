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
          (opts.input ? '<input class="modal__input" id="modalInput" placeholder="' + esc(opts.placeholder || '') + '" value="' + esc(opts.value || '') + '">' : '') +
          '<div class="modal__actions">' +
            (opts.showCancel !== false ? '<button class="btn btn-ghost" id="modalCancel">' + esc(opts.cancelText || '取消') + '</button>' : '') +
            '<button class="btn btn-primary" id="modalOk">' + esc(opts.okText || '确定') + '</button>' +
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
    if (cancel) cancel.onclick = closeModal;
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

  // 顶部导航高亮
  function syncNav(hash) {
    document.querySelectorAll('.nav__link').forEach(function (a) {
      a.classList.remove('active');
    });
    let target = '#/';
    if (hash.indexOf('#/member') === 0) target = '#/member';
    else if (hash.indexOf('#/admin') === 0) target = '#/admin';
    const link = document.querySelector('.nav__link[href="' + target + '"]');
    if (link && target !== '#/admin') link.classList.add('active');
    else if (target === '#/admin') {
      const adminLink = document.querySelector('.nav__link[href="#/admin"]');
      if (adminLink) adminLink.classList.add('active');
    } else {
      const homeLink = document.querySelector('.nav__link[href="#/"]');
      if (homeLink) homeLink.classList.add('active');
    }
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
      return '<article class="test-card" data-id="' + esc(t.id) + '">' +
        '<div class="test-card__cover" style="background:linear-gradient(135deg,' + esc(colors[0]) + ',' + esc(colors[1]) + ')">' +
          cover + '<span class="test-card__count">' + count + ' 题</span>' +
        '</div>' +
        '<div class="test-card__body">' +
          '<div class="test-card__title">' + esc(t.title) + '</div>' +
          '<div class="test-card__sub">' + esc(t.subtitle) + '</div>' +
          '<div class="test-card__cta">开始测试 →</div>' +
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
      card.onclick = function () { go('#/quiz/' + encodeURIComponent(card.dataset.id)); };
    });
  }

  // ============ 答题页 ============
  function renderQuiz(testId) {
    const test = Data.getTest(decodeURIComponent(testId || ''));
    if (!test || !test.questions || !test.questions.length) {
      $app.innerHTML = '<div class="card" style="text-align:center;padding:60px 20px">测试不存在或暂无题目<br><br><button class="btn btn-primary" onclick="location.hash=\'#/\'">返回首页</button></div>';
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
          : '<div class="unlock-card card">' +
              '<div class="unlock-card__icon">✦</div>' +
              '<div class="unlock-card__title">想看看完整的你？</div>' +
              '<div class="unlock-card__desc">观看一段激励视频，即可解锁完整长报告 + 高清结果图</div>' +
              '<button class="btn btn-primary btn-block" id="unlockBtn">看视频解锁完整报告</button>' +
              '<p style="margin:14px 0 0"><a style="color:#C08A2E;cursor:pointer" id="toVip">开通会员，永久免广告 →</a></p>' +
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
    if (unlockBtn) unlockBtn.onclick = function () { playAdThenUnlock(test.id, result.id, function () {
      Data.unlock(test.id, result.id);
      toast('已解锁完整报告');
      renderResult(test.id, result.id);
    }); };

    const toVip = document.getElementById('toVip');
    if (toVip) toVip.onclick = function () { go('#/member'); };
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
      { icon: '✦', title: '解锁全部测试', desc: '所有剧情测试完整版随便玩' },
      { icon: '▤', title: '完整长报告', desc: '每套测试的深度人设报告解锁' },
      { icon: '▶', title: '免广告', desc: '无需看视频，直接查看高清结果图' },
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
        '<div class="pay-card card">' +
          '<div class="pay-card__title">扫码支付 · 联系客服开通</div>' +
          '<div class="pay-card__qr"><img src="assets/payment-qr.jpg" alt="收款码" id="qrImg"></div>' +
          '<div class="pay-card__tip">点击图片可放大查看</div>' +
          '<div class="pay-card__note">' + esc(CFG.PAY_NOTE) + '</div>' +
          '<button class="btn btn-ghost" id="contactBtn">联系客服开通</button>' +
        '</div>' +
        '<p class="compliance">本测试仅供娱乐，不具备科学测评、心理诊断效力。<br>会员为趣味内容解锁，非任何专业服务。</p>' +
      '</div>';

    document.getElementById('qrImg').onclick = function () {
      showModal({ title: '收款码', showCancel: false, okText: '关闭',
        desc: '请截图保存后扫码付款，再把付款截图发给客服开通会员。',
        onOk: function () {} });
      const img = document.createElement('img');
      img.src = 'assets/payment-qr.jpg';
      img.style.cssText = 'width:260px;display:block;margin:0 auto;border-radius:10px';
      $modal.querySelector('.modal').insertBefore(img, $modal.querySelector('.modal__actions'));
    };
    document.getElementById('contactBtn').onclick = function () {
      toast('付款后请把截图发给客服，由客服在后台为你开通');
    };
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
        '<div class="panel card"><div class="panel__title">会员管理</div>' +
          '<div class="member-status"><span class="dot ' + (info.active ? 'dot--on' : '') + '"></span>' +
            (info.active ? '当前会员有效，到期 ' + esc(info.expireText) : '当前非会员') + '</div>' +
          '<div class="admin-actions">' +
            '<button class="btn btn-primary" id="grantBtn">开通会员</button>' +
            '<button class="btn btn-ghost" id="revokeBtn">取消会员</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel card"><div class="panel__head">' +
          '<div class="panel__title">测试题库（' + tests.length + '）</div>' +
          '<button class="btn btn-primary" id="addBtn">+ 新增测试</button>' +
        '</div>' + (rows || '<p class="text-sub">暂无测试</p>') + '</div>' +
        '<div class="admin-actions"><button class="btn btn-ghost" id="resetBtn">恢复内置 3 套测试</button></div>' +
        '<div class="tip">说明：编辑内容保存在当前浏览器本地（localStorage）。换设备或换浏览器不会同步；若要多端共享需接入后端服务。</div>' +
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
          Data.saveTest(newTest);
          go('#/admin-edit/' + encodeURIComponent(id));
        } });
    };
    $app.querySelectorAll('.op').forEach(function (el) {
      el.onclick = function () {
        const id = el.dataset.id;
        if (el.dataset.act === 'edit') { go('#/admin-edit/' + encodeURIComponent(id)); }
        else if (el.dataset.act === 'del') {
          showModal({ title: '删除测试', desc: '确定删除「' + el.dataset.title + '」吗？不可恢复。',
            okText: '删除', onOk: function () { Data.removeTest(id); toast('已删除'); renderAdmin(); } });
        }
      };
    });
    document.getElementById('grantBtn').onclick = function () {
      showModal({ title: '开通会员', desc: '输入开通月数', placeholder: '1', value: '1',
        onOk: function (val) {
          const r = Data.grantMember(val);
          toast(r.error ? r.error.message : '已开通会员');
          renderAdmin();
        } });
    };
    document.getElementById('revokeBtn').onclick = function () {
      showModal({ title: '取消会员', desc: '确定取消当前会员资格吗？', onOk: function () {
        Data.revokeMember(); toast('已取消'); renderAdmin();
      } });
    };
    document.getElementById('resetBtn').onclick = function () {
      showModal({ title: '恢复内置题库', desc: '将用内置 3 套测试覆盖当前所有测试，确定继续吗？',
        okText: '恢复', onOk: function () { Data.resetTests(); toast('已恢复'); renderAdmin(); } });
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
          basicField('emoji', '封面装饰符号（emoji）', test.emoji);
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
        toast(r.error ? r.error.message : '保存成功');
        if (!r.error) setTimeout(function () { go('#/admin'); }, 500);
      };

      $app.querySelectorAll('[data-basic]').forEach(function (el) {
        el.oninput = function () { test[el.dataset.basic] = el.value; };
      });
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
            const r = Data.saveTest(test);
            toast(r.error ? r.error.message : '封面已上传');
            paint();
          };
          reader.readAsDataURL(file);
        };
      }
      const clearCover = document.getElementById('clearCover');
      if (clearCover) clearCover.onclick = function () { test.coverImage = ''; Data.saveTest(test); paint(); };
      const cycleColor = document.getElementById('cycleColor');
      if (cycleColor) cycleColor.onclick = function () {
        const palettes = [
          ['#8FD3B6', '#5FB99A'], ['#B8A6E6', '#8E7BCB'], ['#F2A9A0', '#E07B72'],
          ['#8FA9D6', '#5C7FBA'], ['#F6D58A', '#E8AE54']
        ];
        const cur = (test.coverColors || [])[0];
        const map = { '#8FD3B6': 1, '#B8A6E6': 2, '#F2A9A0': 3, '#8FA9D6': 4, '#F6D58A': 0 };
        test.coverColors = palettes[map[cur] == null ? 0 : map[cur]];
        Data.saveTest(test); paint();
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
    } else if (hash === '#/member') { renderMember(); }
    else if (hash === '#/admin') { renderAdmin(); }
    else if (hash.indexOf('#/admin-edit/') === 0) { renderEdit(hash.slice('#/admin-edit/'.length)); }
    else { renderHome(); }
    window.scrollTo(0, 0);
  }

  // ---------- 启动 ----------
  Data.init();
  renderDisclaimerBar();
  window.addEventListener('hashchange', router);
  router();
})();
