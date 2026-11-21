/**
 * 结果配图生成器（浏览器 Canvas）
 * 用纯 Canvas 绘制海报，无外部图片依赖。hd=true 为高清大图。
 */
(function () {
  function wrapText(ctx, text, maxWidth, maxLines) {
    const lines = [];
    let current = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\n') {
        lines.push(current); current = '';
        if (lines.length >= maxLines) break;
        continue;
      }
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current); current = ch;
        if (lines.length >= maxLines) break;
      } else {
        current = test;
      }
    }
    if (current && lines.length < maxLines) lines.push(current);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(canvas, result, hd, disclaimer) {
    const W = hd ? 750 : 600;
    const H = hd ? 1334 : 1067;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const colors = result.colors || ['#8FD3B6', '#5FB99A'];
    const scale = W / 600;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.arc(W - 40 * scale, 120 * scale, 160 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20 * scale, H - 120 * scale, 120 * scale, 0, Math.PI * 2); ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold ' + (22 * scale) + 'px sans-serif';
    ctx.fillText('脑 洞 测 试 局', W / 2, 70 * scale);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = (14 * scale) + 'px sans-serif';
    ctx.fillText('趣味剧情测试 · 仅供娱乐', W / 2, 100 * scale);

    ctx.font = (100 * scale) + 'px sans-serif';
    ctx.fillText(result.emoji || '✦', W / 2, 235 * scale);

    const tag = result.tag || '神秘人设';
    ctx.font = 'bold ' + (18 * scale) + 'px sans-serif';
    const tagW = ctx.measureText(tag).width + 48 * scale;
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    roundRect(ctx, W / 2 - tagW / 2, 262 * scale, tagW, 42 * scale, 21 * scale);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(tag, W / 2, 291 * scale);

    ctx.font = 'bold ' + (27 * scale) + 'px sans-serif';
    const titleLines = wrapText(ctx, result.title || '', W - 80 * scale, 2);
    titleLines.forEach(function (line, i) {
      ctx.fillText(line, W / 2, (365 + i * 40) * scale);
    });

    const cardTop = (420 + titleLines.length * 8) * scale;
    const cardH = H - cardTop - 120 * scale;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, 36 * scale, cardTop, W - 72 * scale, cardH, 24 * scale);
    ctx.fill();

    const body = (hd && result.full) ? result.full : result.short;
    ctx.fillStyle = '#30423B';
    ctx.font = (16 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    const bodyLines = wrapText(ctx, body || '', W - 140 * scale, hd ? 18 : 8);
    bodyLines.forEach(function (line, i) {
      ctx.fillText(line, 70 * scale, cardTop + (56 + i * 30) * scale);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = (12 * scale) + 'px sans-serif';
    ctx.fillText(disclaimer || '', W / 2, H - 46 * scale);
  }

  window.Poster = { draw: draw };
})();
