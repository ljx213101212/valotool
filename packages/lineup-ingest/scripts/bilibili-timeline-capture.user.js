// ==UserScript==
// @name         B站时间轴捕获工具 (ValoTool)
// @namespace    valotool.lineup-ingest
// @version      2.0.0
// @description  在 B站视频页一键捕获当前播放时间，生成 lineup-ingest 时间轴数据
// @author       valotool
// @match        *://www.bilibili.com/video/*
// @match        *://bilibili.com/video/*
// @match        *://*.bilibili.com/video/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  var LOG = '[ValoTool]';

  function log() {
    var args = [LOG];
    for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
    console.log.apply(console, args);
  }

  log('v2.0.0 已加载');

  // ============================================================
  // 地图 & 英雄 (同步自 @valotool/lineup-content 注册表)
  // ============================================================
  var MAP_LIST = [
    { v: 'ascent',   l: '亚海悬城 (Ascent)' },
    { v: 'bind',     l: '源工重镇 (Bind)' },
    { v: 'haven',    l: '隐世修所 (Haven)' },
    { v: 'split',    l: '霓虹町 (Split)' },
    { v: 'icebox',   l: '森寒冬港 (Icebox)' },
    { v: 'breeze',   l: '微风岛屿 (Breeze)' },
    { v: 'fracture', l: '裂变峡谷 (Fracture)' },
    { v: 'pearl',    l: '深海明珠 (Pearl)' },
    { v: 'lotus',    l: '莲华古城 (Lotus)' },
    { v: 'sunset',   l: '日落之城 (Sunset)' },
    { v: 'abyss',    l: '幽邃地窟 (Abyss)' },
    { v: 'corrode',  l: '盐海矿镇 (Corrode)' },
    { v: 'summit',   l: '天枢云阙 (Summit)' },
  ];

  var AGENT_LIST = [
    { v: 'astra',     l: '星礈 (Astra)' },
    { v: 'breach',    l: '铁臂 (Breach)' },
    { v: 'brimstone', l: '炼狱 (Brimstone)' },
    { v: 'chamber',   l: '尚勃勒 (Chamber)' },
    { v: 'clove',     l: '暮蝶 (Clove)' },
    { v: 'cypher',    l: '零 (Cypher)' },
    { v: 'deadlock',  l: '钢锁 (Deadlock)' },
    { v: 'fade',      l: '黑梦 (Fade)' },
    { v: 'gekko',     l: '盖可 (Gekko)' },
    { v: 'harbor',    l: '海神 (Harbor)' },
    { v: 'iso',       l: '壹决 (Iso)' },
    { v: 'jett',      l: '捷风 (Jett)' },
    { v: 'kayo',      l: 'K/O' },
    { v: 'killjoy',   l: '奇乐 (Killjoy)' },
    { v: 'neon',      l: '霓虹 (Neon)' },
    { v: 'omen',      l: '幽影 (Omen)' },
    { v: 'phoenix',   l: '不死鸟 (Phoenix)' },
    { v: 'raze',      l: '雷兹 (Raze)' },
    { v: 'reyna',     l: '芮娜 (Reyna)' },
    { v: 'sage',      l: '贤者 (Sage)' },
    { v: 'skye',      l: '斯凯 (Skye)' },
    { v: 'sova',      l: '猎枭 (Sova)' },
    { v: 'tejo',      l: '钛狐 (Tejo)' },
    { v: 'viper',     l: '蝰蛇 (Viper)' },
    { v: 'vyse',      l: '维斯 (Vyse)' },
    { v: 'waylay',    l: '幻棱 (Waylay)' },
    { v: 'yoru',      l: '夜露 (Yoru)' },
  ];

  // ============================================================
  // 快捷键
  // ============================================================
  var KEY_CAPTURE = 'F8';
  var KEY_TOGGLE  = 'F9';

  // ============================================================
  // 常量
  // ============================================================
  var LS_PREFIX = 'valotool_timeline_';
  var LS_FLOAT   = LS_PREFIX + 'float';

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function formatTime(totalSec) {
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = Math.floor(totalSec % 60);
    var ss = String(s).padStart ? String(s).padStart(2, '0') : ('0' + s).slice(-2);
    return h > 0 ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss;
  }

  function fmtPrecise(sec) {
    var m = Math.floor(sec / 60);
    var s = (sec % 60).toFixed(1);
    var ss = s.padStart ? s.padStart(4, '0') : ('000' + s).slice(-4);
    return m + ':' + ss;
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // ============================================================
  // DOM 帮助函数
  // ============================================================
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var key in attrs) {
        if (key === 'style' && typeof attrs[key] === 'object') {
          for (var sk in attrs[key]) { e.style[sk] = attrs[key][sk]; }
        } else if (key === 'on') {
          for (var ek in attrs[key]) { e.addEventListener(ek, attrs[key][ek]); }
        } else if (key === '$') {
          e.textContent = attrs[key];
        } else {
          e[key] = attrs[key];
        }
      }
    }
    if (kids) {
      for (var i = 0; i < kids.length; i++) {
        if (kids[i] != null) e.append(typeof kids[i] === 'string' ? document.createTextNode(kids[i]) : kids[i]);
      }
    }
    return e;
  }

  function inputStyle(ext) {
    var s = {
      background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937',
      borderRadius: '4px', padding: '4px 8px', outline: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '12px',
    };
    for (var k in ext) s[k] = ext[k];
    return s;
  }

  function btnStyle(ext) {
    var s = {
      background: '#60a5fa', color: '#fff', border: 'none', borderRadius: '6px',
      padding: '6px 14px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
      fontSize: '13px', fontWeight: 500,
    };
    for (var k in ext) s[k] = ext[k];
    return s;
  }

  // ============================================================
  // 视频相关
  // ============================================================
  function getBvid() {
    var path = window.location.pathname;
    if (path.indexOf('/video/') !== 0) return '';
    return (path.split('/')[2] || '').split('?')[0];
  }

  function getVideoMeta() {
    var bvid = getBvid();
    var rawTitle = (document.title || '').replace(/_哔哩哔哩_bilibili$/, '').trim();
    var st = window.__INITIAL_STATE__ || {};
    var vd = st.videoData || {};
    var owner = vd.owner || {};
    return {
      bvid: bvid,
      title: rawTitle,
      creator: owner.name || '',
      creatorUid: owner.mid ? String(owner.mid) : '',
    };
  }

  function findVideo() {
    return document.querySelector('video');
  }

  function findPlayerContainer() {
    return document.querySelector('#bilibiliPlayer')
        || document.querySelector('.bpx-player-video-wrap')
        || document.querySelector('.bpx-player-container')
        || document.querySelector('#bofqi')
        || null;
  }

  function seekVideo(sec) {
    var video = findVideo();
    if (video) {
      video.currentTime = sec;
      video.play().catch(function () {});
    }
  }

  // ============================================================
  // 状态管理
  // ============================================================
  var bvid = '';
  var segments = [];
  var nextId = 1;
  var metaFields = { map: '', agent: '', creatorUid: '', recordedPatch: '', note: '' };

  function loadState(newBvid) {
    bvid = newBvid;
    metaFields = { map: '', agent: '', creatorUid: '', recordedPatch: '', note: '' };
    if (!bvid) { segments = []; nextId = 1; refreshPanel(); return; }
    var raw = localStorage.getItem(LS_PREFIX + bvid);
    if (raw) {
      try {
        var data = JSON.parse(raw);
        segments = data.segments || [];
        nextId = data.nextId || 1;
        if (segments.length && nextId <= segments[segments.length - 1].id) {
          nextId = segments[segments.length - 1].id + 1;
        }
        if (data.meta) {
          for (var k in data.meta) metaFields[k] = data.meta[k];
        }
      } catch (e) { segments = []; nextId = 1; }
    } else {
      segments = [];
      nextId = 1;
    }
    if (!metaFields.creatorUid) {
      var m = getVideoMeta();
      if (m.creatorUid) metaFields.creatorUid = m.creatorUid;
    }
    updatePlayerBadge();
    refreshPanel();
  }

  function saveState() {
    if (!bvid) return;
    try {
      localStorage.setItem(LS_PREFIX + bvid, JSON.stringify({ segments: segments, nextId: nextId, meta: metaFields }));
    } catch (e) {}
  }

  // ---- segment 操作 ----
  function addSegment(startSec) {
    var id = nextId++;
    segments.push({ id: id, startSec: startSec, title: '' });
    segments.sort(function (a, b) { return a.startSec - b.startSec; });
    saveState();
    updatePlayerBadge();
    refreshPanel();
  }

  function updateTitle(id, title) { var s = findSeg(id); if (s) { s.title = title; saveState(); } }
  function deleteSegment(id) { segments = segments.filter(function (s) { return s.id !== id; }); saveState(); updatePlayerBadge(); refreshPanel(); }

  function updateTime(id, newSec) {
    var s = findSeg(id); if (!s) return;
    s.startSec = clamp(Math.round(newSec), 0, 86400);
    segments.sort(function (a, b) { return a.startSec - b.startSec; });
    saveState(); refreshPanel();
  }

  function moveSegment(id, dir) {
    var idx = -1;
    for (var i = 0; i < segments.length; i++) { if (segments[i].id === id) { idx = i; break; } }
    if (idx < 0) return;
    var swap = idx + dir;
    if (swap < 0 || swap >= segments.length) return;
    var tmp = segments[idx]; segments[idx] = segments[swap]; segments[swap] = tmp;
    saveState(); refreshPanel();
  }

  function findSeg(id) {
    for (var i = 0; i < segments.length; i++) { if (segments[i].id === id) return segments[i]; }
    return null;
  }

  // ============================================================
  // 导出
  // ============================================================
  function toTimelineText() {
    return segments.map(function (s) {
      return formatTime(s.startSec) + '  ' + (s.title || '(无标题)');
    }).join('\n');
  }

  function toSourceJSON() {
    var meta = getVideoMeta();
    var src = {
      id: meta.bvid || bvid,
      platform: 'bilibili',
      url: 'https://www.bilibili.com/video/' + (meta.bvid || bvid),
      title: meta.title,
      creator: meta.creator,
      hints: { map: metaFields.map || '', agent: metaFields.agent || '' },
      credit: '点位演示来源：B站 @' + meta.creator + '（' + (metaFields.creatorUid || meta.creatorUid ? 'uid ' + (metaFields.creatorUid || meta.creatorUid) + '，' : '') + (meta.bvid || bvid) + '）',
      segments: segments.map(function (s) { return { startSec: s.startSec, title: s.title }; }),
    };
    if (metaFields.creatorUid || meta.creatorUid) src.creatorUid = metaFields.creatorUid || meta.creatorUid;
    if (metaFields.recordedPatch) src.recordedPatch = metaFields.recordedPatch;
    if (metaFields.note) src.note = metaFields.note;
    return JSON.stringify([src], null, 2);
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(function () { toast('已复制'); })
      .catch(function () { toast('复制失败，请手动复制'); });
  }

  function downloadText(text, filename) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // Toast
  // ============================================================
  var toastTimer = 0;
  function toast(msg) {
    clearTimeout(toastTimer);
    var el = document.getElementById('vtc-toast');
    if (!el) {
      el = h('div', { id: 'vtc-toast', style: {
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 200000,
        background: '#1f2937', color: '#e5e7eb', padding: '8px 20px', borderRadius: '999px',
        fontSize: '13px', fontFamily: 'system-ui, sans-serif', pointerEvents: 'none',
        opacity: '0', transition: 'opacity 0.2s', whiteSpace: 'nowrap',
      }});
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 1500);
  }

  // ============================================================
  // 浮动窗口 (可拖拽、可调大小、记忆位置)
  // ============================================================
  var panelEl = null;
  var panelVisible = false;
  var floatPos = { x: -1, y: -1, w: 390, h: 500 };

  function loadFloatPos() {
    try {
      var raw = localStorage.getItem(LS_FLOAT);
      if (raw) {
        var f = JSON.parse(raw);
        if (typeof f.x === 'number') floatPos.x = f.x;
        if (typeof f.y === 'number') floatPos.y = f.y;
        if (typeof f.w === 'number' && f.w >= 320) floatPos.w = f.w;
        if (typeof f.h === 'number' && f.h >= 280) floatPos.h = f.h;
      }
    } catch (e) {}
  }

  function saveFloatPos() {
    try {
      localStorage.setItem(LS_FLOAT, JSON.stringify(floatPos));
    } catch (e) {}
  }

  function defaultFloatPos() {
    var ww = window.innerWidth;
    var wh = window.innerHeight;
    floatPos.w = Math.min(floatPos.w || 390, ww - 40);
    floatPos.h = Math.min(floatPos.h || 500, wh - 100);
    if (floatPos.x < 0 || floatPos.y < 0 || floatPos.x + 100 > ww || floatPos.y + 50 > wh) {
      floatPos.x = Math.max(10, ww - floatPos.w - 10);
      floatPos.y = 80;
    }
    clampFloatPos();
  }

  function clampFloatPos() {
    var ww = window.innerWidth;
    var wh = window.innerHeight;
    floatPos.w = clamp(floatPos.w, 320, Math.max(320, ww - 20));
    floatPos.h = clamp(floatPos.h, 280, Math.max(280, wh - 80));
    floatPos.x = clamp(floatPos.x, -floatPos.w + 70, ww - 30);
    floatPos.y = clamp(floatPos.y, 0, wh - 50);
  }

  function applyFloatPos() {
    if (!panelEl) return;
    panelEl.style.left = floatPos.x + 'px';
    panelEl.style.top = floatPos.y + 'px';
    panelEl.style.width = floatPos.w + 'px';
    panelEl.style.height = floatPos.h + 'px';
  }

  function showPanel(show) {
    panelVisible = show;
    if (!panelEl) return;
    if (show) {
      defaultFloatPos();
      applyFloatPos();
      panelEl.style.display = 'flex';
      panelEl.style.opacity = '1';
      panelEl.style.pointerEvents = 'auto';
      refreshPanel();
    } else {
      panelEl.style.opacity = '0';
      panelEl.style.pointerEvents = 'none';
      setTimeout(function () {
        if (!panelVisible) panelEl.style.display = 'none';
      }, 200);
    }
  }

  function createPanel() {
    loadFloatPos();

    panelEl = h('div', { id: 'vtc-panel', style: {
      position: 'fixed', zIndex: 100001,
      display: 'none', opacity: '0', pointerEvents: 'none',
      flexDirection: 'column',
      background: '#0e1116', border: '1px solid #1f2937', borderRadius: '10px',
      fontFamily: 'system-ui, -apple-system, sans-serif', color: '#e5e7eb', fontSize: '13px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      transition: 'opacity 0.2s ease',
      overflow: 'hidden',
    }});
    document.body.appendChild(panelEl);
  }

  // ---- 拖拽 ----
  var dragInfo = null;

  function startDrag(e) {
    if (e.button !== 0) return;
    dragInfo = { sx: e.clientX, sy: e.clientY, ox: floatPos.x, oy: floatPos.y };
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!dragInfo) return;
    floatPos.x = dragInfo.ox + (e.clientX - dragInfo.sx);
    floatPos.y = dragInfo.oy + (e.clientY - dragInfo.sy);
    clampFloatPos();
    applyFloatPos();
  }

  function onDragEnd() {
    if (dragInfo) { saveFloatPos(); dragInfo = null; }
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
  }

  // ---- 调大小 ----
  var resizeInfo = null;

  function startResize(e) {
    if (e.button !== 0) return;
    resizeInfo = { sx: e.clientX, sy: e.clientY, ow: floatPos.w, oh: floatPos.h };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
    e.preventDefault();
    e.stopPropagation();
  }

  function onResizeMove(e) {
    if (!resizeInfo) return;
    floatPos.w = clamp(resizeInfo.ow + (e.clientX - resizeInfo.sx), 320, Math.max(320, window.innerWidth - floatPos.x - 10));
    floatPos.h = clamp(resizeInfo.oh + (e.clientY - resizeInfo.sy), 280, Math.max(280, window.innerHeight - floatPos.y - 40));
    applyFloatPos();
  }

  function onResizeEnd() {
    if (resizeInfo) { saveFloatPos(); resizeInfo = null; }
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  }

  // ============================================================
  // 播放器内嵌按钮 (全屏可见)
  // ============================================================
  var playerBtn = null;
  var playerBtnParent = null;

  function createPlayerBtn() {
    if (playerBtn) return;
    playerBtn = h('button', {
      id: 'vtc-player-btn',
      title: '时间轴捕获 (F8 捕获 / F9 开关)',
      style: {
        position: 'absolute', top: '8px', right: '8px', zIndex: 999,
        display: 'flex', alignItems: 'center', gap: '4px',
        background: 'rgba(96, 165, 250, 0.88)', borderRadius: '8px',
        padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        border: 'none', color: '#fff', fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 1px 6px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
      },
      on: { click: function (e) { e.stopPropagation(); showPanel(!panelVisible); } },
    }, [
      h('span', { $: '⏱' }),
      h('span', { id: 'vtc-player-badge', $: String(segments.length), style: { background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '0 5px', fontSize: 10, minWidth: 16, textAlign: 'center' } }),
    ]);
    attachPlayerBtn();
  }

  function attachPlayerBtn() {
    if (!playerBtn) return;
    var container = findPlayerContainer();
    if (container && container !== playerBtnParent) {
      // remove from old parent
      if (playerBtn.parentNode) playerBtn.parentNode.removeChild(playerBtn);
      container.appendChild(playerBtn);
      playerBtnParent = container;
      log('按钮已挂载到播放器容器');
    }
  }

  function updatePlayerBadge() {
    var badge = document.getElementById('vtc-player-badge');
    if (badge) badge.textContent = String(segments.length);
  }

  // 监听全屏变化，重新挂载按钮
  function onFullscreenChange() {
    setTimeout(attachPlayerBtn, 300);
  }

  // ============================================================
  // 面板内容渲染
  // ============================================================
  function buildSelect(options, currentValue, onChange) {
    var sel = h('select', { style: inputStyle({ fontSize: 12, cursor: 'pointer', padding: '2px 6px' }) });
    sel.appendChild(h('option', { value: '', $: '—' }));
    for (var i = 0; i < options.length; i++) {
      var o = h('option', { value: options[i].v, $: options[i].l });
      if (options[i].v === currentValue) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', function () { onChange(sel.value); });
    return sel;
  }

  function refreshPanel() {
    if (!panelEl || !panelVisible) return;
    while (panelEl.firstChild) panelEl.removeChild(panelEl.firstChild);

    // ---- 标题栏 (可拖拽) ----
    var titleBar = h('div', { style: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', cursor: 'move', userSelect: 'none',
      background: '#111827', borderBottom: '1px solid #1f2937', flexShrink: 0,
    }, on: { mousedown: startDrag } });

    titleBar.appendChild(h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } }, [
      h('span', { $: '⏱ 时间轴捕获', style: { fontWeight: 700, fontSize: 14, color: '#60a5fa' } }),
      h('span', { $: segments.length + ' 段', style: { fontSize: 11, color: '#6b7280' } }),
    ]));

    var closeBtn = h('button', {
      $: '✕', style: btnStyle({ width: 26, height: 26, fontSize: 13, background: 'transparent', color: '#9ca3af', padding: 0 }),
      on: { mousedown: function (e) { e.stopPropagation(); }, click: function () { showPanel(false); } },
    });
    titleBar.appendChild(closeBtn);
    panelEl.appendChild(titleBar);

    // ---- 视频信息 ----
    var meta = getVideoMeta();
    if (meta.bvid || meta.title) {
      panelEl.appendChild(h('div', { style: { padding: '8px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0 } }, [
        h('div', { $: meta.title || meta.bvid, style: { fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }),
        h('div', { $: '@' + (meta.creator || 'UP主') + '  ·  ' + meta.bvid, style: { fontSize: 10, color: '#6b7280' } }),
      ]));
    }

    // ---- 当前时间 + 捕获 ----
    var timeBar = h('div', { style: { padding: '10px 14px', borderBottom: '1px solid #1f2937', flexShrink: 0 } });
    timeBar.appendChild(h('div', { $: '当前播放时间', style: { fontSize: 10, color: '#6b7280', marginBottom: 2 } }));
    timeBar.appendChild(h('div', { id: 'vtc-time', $: '--:--', style: { fontVariantNumeric: 'tabular-nums', fontSize: 28, fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace', marginBottom: 8 } }));

    var capRow = h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } });
    capRow.appendChild(h('button', { $: '📷 捕获当前时间 (F8)', style: btnStyle({ flex: 1, fontSize: 13, padding: '7px 12px' }), on: { click: doCapture } }));
    timeBar.appendChild(capRow);
    panelEl.appendChild(timeBar);

    // ---- 段落列表 ----
    var listWrap = h('div', { style: { flex: 1, overflowY: 'auto', minHeight: 0 } });
    if (segments.length === 0) {
      listWrap.appendChild(h('div', { $: '暂无捕获的段落\n播放视频，找到点位时按 F8 或点击捕获按钮', style: { padding: '36px 20px', textAlign: 'center', color: '#6b7280', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-line' } }));
    } else {
      for (var i = 0; i < segments.length; i++) {
        listWrap.appendChild(buildSegmentRow(segments[i], i));
      }
    }
    panelEl.appendChild(listWrap);

    // ---- 底部: 元信息 + 导出 ----
    var footer = h('div', { style: { borderTop: '1px solid #1f2937', padding: '10px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '200px', overflowY: 'auto' } });
    footer.appendChild(h('div', { $: '元信息 (用于 SourceJSON 导出)', style: { fontSize: 10, color: '#6b7280', fontWeight: 600 } }));

    var metaGrid = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 } });
    metaGrid.appendChild(buildMetaSelect('地图', 'map', MAP_LIST));
    metaGrid.appendChild(buildMetaSelect('英雄', 'agent', AGENT_LIST));
    metaGrid.appendChild(buildMetaInput('UP主UID', 'creatorUid'));
    metaGrid.appendChild(buildMetaInput('录制版本', 'recordedPatch'));
    footer.appendChild(metaGrid);
    footer.appendChild(buildMetaInput('备注', 'note'));

    // export buttons
    var row1 = h('div', { style: { display: 'flex', gap: 5, marginTop: 2 } });
    row1.appendChild(h('button', { $: '📋 复制纯文本', style: btnStyle({ flex: 1, fontSize: 11, background: '#1f2937' }), on: { click: function () { copyText(toTimelineText()); } } }));
    row1.appendChild(h('button', { $: '📋 复制 SourceJSON', style: btnStyle({ flex: 1, fontSize: 11, background: '#1f2937' }), on: { click: function () { copyText(toSourceJSON()); } } }));
    footer.appendChild(row1);

    var row2 = h('div', { style: { display: 'flex', gap: 5 } });
    row2.appendChild(h('button', { $: '⬇ 下载 .txt', style: btnStyle({ flex: 1, fontSize: 11 }), on: { click: function () { downloadText(toTimelineText(), (bvid || 'timeline') + '.txt'); } } }));
    row2.appendChild(h('button', { $: '⬇ 下载 .json', style: btnStyle({ flex: 1, fontSize: 11 }), on: { click: function () { downloadText(toSourceJSON(), (bvid || 'output') + '.json'); } } }));
    footer.appendChild(row2);

    panelEl.appendChild(footer);

    // ---- 右下角 resize 手柄 ----
    var resizeHandle = h('div', {
      style: {
        position: 'absolute', right: 0, bottom: 0, width: 24, height: 24,
        cursor: 'nwse-resize', zIndex: 10,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
      },
      on: { mousedown: startResize },
    });
    // 三角符号
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 14 14');
    svg.style.display = 'block';
    svg.style.marginBottom = '3px';
    svg.style.marginRight = '3px';
    svg.style.opacity = '0.4';
    var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '0,14 14,14 14,0');
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', '#6b7280');
    poly.setAttribute('stroke-width', '1.5');
    svg.appendChild(poly);
    resizeHandle.appendChild(svg);
    panelEl.appendChild(resizeHandle);
  }

  function buildSegmentRow(seg, idx) {
    var row = h('div', { style: { display: 'flex', alignItems: 'center', gap: 3, padding: '5px 14px', borderBottom: '1px solid #1f2937', fontSize: 11, minHeight: 34 } });
    row.appendChild(h('span', { $: String(idx + 1), style: { color: '#6b7280', minWidth: 18, textAlign: 'right', flexShrink: 0 } }));

    // time
    var dec = h('button', { $: '◀', title: '减 1 秒', style: btnStyle({ padding: '1px 2px', fontSize: 9, background: 'transparent', color: '#9ca3af' }), on: { click: function () { updateTime(seg.id, seg.startSec - 1); } } });
    var ti = h('input', { type: 'text', value: formatTime(seg.startSec), style: inputStyle({ width: 44, textAlign: 'center', fontSize: 10, padding: '2px 3px', color: '#60a5fa' }) });
    ti.addEventListener('change', function () {
      var parts = ti.value.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) updateTime(seg.id, parts[0] * 60 + parts[1]);
      else if (parts.length === 3) updateTime(seg.id, parts[0] * 3600 + parts[1] * 60 + parts[2]);
    });
    var inc = h('button', { $: '▶', title: '加 1 秒', style: btnStyle({ padding: '1px 2px', fontSize: 9, background: 'transparent', color: '#9ca3af' }), on: { click: function () { updateTime(seg.id, seg.startSec + 1); } } });
    row.appendChild(h('div', { style: { display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 } }, [dec, ti, inc]));

    // title
    var titleInput = h('input', { type: 'text', value: seg.title, placeholder: '输入标题...', style: inputStyle({ flex: 1, fontSize: 11, minWidth: 0 }) });
    var saveTimer = 0;
    titleInput.addEventListener('input', function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { updateTitle(seg.id, titleInput.value); }, 300);
    });
    row.appendChild(titleInput);

    // play seek
    row.appendChild(h('button', { $: '▶️', title: '跳转播放', style: btnStyle({ padding: '1px 3px', fontSize: 10, background: 'transparent', color: '#34d399' }), on: { click: function () { seekVideo(seg.startSec); } } }));

    // actions
    row.appendChild(h('button', { $: '↑', title: '上移', style: btnStyle({ padding: '1px 3px', fontSize: 10, background: 'transparent', color: '#9ca3af' }), on: { click: function () { moveSegment(seg.id, -1); } } }));
    row.appendChild(h('button', { $: '↓', title: '下移', style: btnStyle({ padding: '1px 3px', fontSize: 10, background: 'transparent', color: '#9ca3af' }), on: { click: function () { moveSegment(seg.id, 1); } } }));
    row.appendChild(h('button', { $: '✕', title: '删除', style: btnStyle({ padding: '1px 4px', fontSize: 10, background: 'transparent', color: '#f87171' }), on: { click: function () { deleteSegment(seg.id); } } }));

    return row;
  }

  function buildMetaSelect(label, key, options) {
    var wrap = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2 } });
    wrap.appendChild(h('span', { $: label, style: { fontSize: 10, color: '#9ca3af' } }));
    wrap.appendChild(buildSelect(options, metaFields[key] || '', function (v) { metaFields[key] = v; saveState(); }));
    return wrap;
  }

  function buildMetaInput(label, key) {
    var wrap = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2 } });
    wrap.appendChild(h('span', { $: label, style: { fontSize: 10, color: '#9ca3af' } }));
    var inp = h('input', { type: 'text', value: metaFields[key] || '', placeholder: label, style: inputStyle({ fontSize: 11 }) });
    inp.addEventListener('change', function () { metaFields[key] = inp.value; saveState(); });
    wrap.appendChild(inp);
    return wrap;
  }

  // ============================================================
  // 捕获
  // ============================================================
  function doCapture() {
    var video = findVideo();
    if (!video) { toast('未找到播放器'); return; }
    var startSec = video.currentTime;
    addSegment(startSec);
    setTimeout(function () {
      if (!panelEl) return;
      var inputs = panelEl.querySelectorAll('input[type="text"]');
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].placeholder === '输入标题...' && !inputs[i].value) {
          inputs[i].focus();
          inputs[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 150);
  }

  // ============================================================
  // 时间刷新
  // ============================================================
  var timeInterval = 0;
  function startTimeLoop() {
    if (timeInterval) clearInterval(timeInterval);
    timeInterval = setInterval(function () {
      var el = document.getElementById('vtc-time');
      if (!el) return;
      var video = findVideo();
      if (video && !video.paused) {
        el.textContent = fmtPrecise(video.currentTime);
      }
    }, 250);
  }

  // ============================================================
  // 键盘
  // ============================================================
  function handleKeydown(e) {
    var k = e.key;
    // F8 捕获
    if (k === KEY_CAPTURE) {
      var ae = document.activeElement;
      if (ae) {
        var tag = (ae.tagName || '').toLowerCase();
        if ((tag === 'input' || tag === 'textarea' || ae.isContentEditable) && !ae.closest('#vtc-panel')) return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (!panelVisible) showPanel(true);
      doCapture();
      return;
    }
    // F9 开关面板
    if (k === KEY_TOGGLE) {
      e.preventDefault();
      e.stopPropagation();
      showPanel(!panelVisible);
    }
  }

  // ============================================================
  // SPA 路由
  // ============================================================
  var lastHref = window.location.href;
  function checkRoute() {
    if (window.location.href === lastHref) return;
    lastHref = window.location.href;
    var newBvid = getBvid();
    if (newBvid && newBvid !== bvid) {
      loadState(newBvid);
    }
    // 路由变化时重新挂载按钮
    setTimeout(attachPlayerBtn, 500);
  }

  function patchHistory() {
    var origPush = history.pushState;
    var origReplace = history.replaceState;
    history.pushState = function () { origPush.apply(this, arguments); checkRoute(); };
    history.replaceState = function () { origReplace.apply(this, arguments); checkRoute(); };
    window.addEventListener('popstate', checkRoute);
    setInterval(checkRoute, 2000);
  }

  // ============================================================
  // 窗口 resize 时重新 clamp
  // ============================================================
  var resizeDebounce = 0;
  function onWindowResize() {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(function () {
      clampFloatPos();
      applyFloatPos();
      saveFloatPos();
    }, 300);
  }

  // ============================================================
  // 初始化
  // ============================================================
  function init() {
    try {
      log('init()');

      if (!document.body) { setTimeout(init, 200); return; }

      createPanel();
      createPlayerBtn();

      var meta = getVideoMeta();
      if (meta.bvid) loadState(meta.bvid);

      patchHistory();
      document.addEventListener('keydown', handleKeydown, true);
      document.addEventListener('fullscreenchange', onFullscreenChange);
      window.addEventListener('resize', onWindowResize);
      startTimeLoop();

      // 周期性重试挂载按钮 (页面可能异步加载播放器)
      var retryCount = 0;
      var retryInterval = setInterval(function () {
        attachPlayerBtn();
        retryCount++;
        if (retryCount > 20 || findPlayerContainer()) clearInterval(retryInterval);
      }, 1000);

      toast('时间轴工具已就绪 | F8 捕获  F9 开关面板');

      log('init() 完成');

    } catch (err) {
      console.error(LOG, 'init 失败', err);
    }
  }

  function boot() {
    if (document.body) init();
    else setTimeout(boot, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
