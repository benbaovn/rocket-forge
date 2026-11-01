// Mobile / tablet support: touch-device detection, collapsible HUD panels on small screens,
// and iOS gesture fixes. Camera rotation on touch is handled natively by OrbitControls
// (1 finger = rotate, 2 fingers = pinch zoom) – the HUD just has to stay out of the way.

const $ = (id) => document.getElementById(id);

/** true for phones / tablets (incl. iPadOS, which reports itself as "Macintosh") */
export function detectTouch() {
  const qs = new URLSearchParams(location.search).get('touch');
  if (qs === '1') return true;
  if (qs === '0') return false;
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const iPadOS = navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent);
  return !!(coarse || iPadOS);
}

const COMPACT_MQ = '(max-width: 760px), (max-height: 520px)';
export const isCompact = () => window.matchMedia && matchMedia(COMPACT_MQ).matches;

export function initMobile(app) {
  const body = document.body;
  const setTouch = (on) => body.classList.toggle('touch', on);
  setTouch(detectTouch());
  // touch-screen laptops / hybrid devices: switch to touch mode on the first real touch
  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') setTouch(true); }, { passive: true });

  // iOS Safari ignores user-scalable=no → block pinch-zoom of the page (the 3D canvas handles pinch itself)
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  }
  // (double-tap zoom on buttons is already disabled via CSS touch-action: manipulation / none)

  // phones: both flight HUD panels collapse into small icons (📊 telemetry / ⛽ stages & systems)
  initHudToggles();

  // VAB specs panel toggle (compact screens)
  const statsBtn = $('btn-stats-toggle');
  if (statsBtn) {
    statsBtn.addEventListener('click', () => {
      const open = $('stats').classList.toggle('open');
      statsBtn.classList.toggle('on', open);
    });
  }

  // scene flag for CSS (e.g. landscape hint only during flight) + live state of touch buttons
  let sasBtn = null, rcsBtn = null;
  const tick = () => {
    const inLaunch = !!app.launch && app.current === app.launch;
    body.classList.toggle('scene-launch', inLaunch);
    if (inLaunch && sasBtn) sasBtn.classList.toggle('on', !!app.launch.sas);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  ({ sasBtn, rcsBtn } = buildFlightControls(app));
}

/**
 * Compact screens: hide the two flight HUD panels behind icon buttons.
 * The Fire / Auto / Map / Warp buttons are moved out of the right panel into the icon row
 * so they stay reachable while the panel is hidden (and moved back on larger screens).
 */
function initHudToggles() {
  const root = $('launch-ui');
  const left = root && root.querySelector('.hud-left');
  const right = root && root.querySelector('.hud-right');
  const actions = right && right.querySelector('.hud-actions-grid');
  if (!left || !right || !actions) return;
  const anchor = right.querySelector('.gpu-launch');   // original spot of the actions grid

  const mk = (cls, html) => { const d = document.createElement('div'); d.className = `hud-quick ${cls}`; d.innerHTML = html; root.appendChild(d); return d; };
  const qLeft = mk('left', '<button type="button" class="hud-tg" id="hud-tg-left" aria-label="Telemetry">📊</button>');
  const qRight = mk('right', '<button type="button" class="hud-tg" id="hud-tg-right" aria-label="Stages & systems">⛽</button>');
  const tgLeft = qLeft.querySelector('button');
  const tgRight = qRight.querySelector('button');

  // only one panel open at a time
  const pairs = [[tgLeft, left], [tgRight, right]];
  const bind = (btn, hud) => btn.addEventListener('click', () => {
    const on = !hud.classList.contains('shown');
    for (const [b, h] of pairs) { h.classList.remove('shown'); b.classList.remove('on'); }
    hud.classList.toggle('shown', on);
    btn.classList.toggle('on', on);
  });
  for (const [b, h] of pairs) bind(b, h);

  const place = () => {
    if (isCompact()) {
      if (actions.parentElement !== qRight) qRight.insertBefore(actions, tgRight);
    } else if (actions.parentElement !== right) {
      right.insertBefore(actions, anchor || null);
    }
  };
  place();
  if (window.matchMedia) matchMedia(COMPACT_MQ).addEventListener('change', place);
}

/**
 * On-screen flight buttons (touch only, shown via CSS):
 *  left  – attitude pad (W/A/S/D); centre button switches it to RCS translation (I/K/J/L + H/N) for docking
 *  right – throttle ▲▼ / MAX / 0, STAGE, SAS, SAS-mode, camera, legs/chute, time-warp, pause menu
 * Hold buttons write straight into LaunchScene.keys (same as a held keyboard key);
 * tap buttons dispatch a synthetic keydown/keyup so every existing shortcut keeps a single code path.
 */
function buildFlightControls(app) {
  const root = $('launch-ui');
  if (!root) return {};
  const L = () => app.launch;
  const tap = (key, code = '') => {
    const o = { key, code, bubbles: true, cancelable: true };
    window.dispatchEvent(new KeyboardEvent('keydown', o));
    window.dispatchEvent(new KeyboardEvent('keyup', o));
  };

  const wrap = document.createElement('div');
  wrap.id = 'touch-ctl';
  wrap.innerHTML = `
    <div class="tc-pad" id="tc-pad">
      <button type="button" class="tc-btn tc-rcs-only" data-hold="h" data-pos="tl" aria-label="RCS up">⤒</button>
      <button type="button" class="tc-btn tc-arrow" data-hold="w" data-rcs="i" data-pos="t" aria-label="Pitch">▲</button>
      <span></span>
      <button type="button" class="tc-btn tc-arrow" data-hold="a" data-rcs="j" data-pos="l" aria-label="Left">◀</button>
      <button type="button" class="tc-btn tc-mid" id="tc-rcs" aria-label="RCS mode"><small>RCS</small></button>
      <button type="button" class="tc-btn tc-arrow" data-hold="d" data-rcs="l" data-pos="r" aria-label="Right">▶</button>
      <button type="button" class="tc-btn tc-rcs-only" data-hold="n" data-pos="bl" aria-label="RCS down">⤓</button>
      <button type="button" class="tc-btn tc-arrow" data-hold="s" data-rcs="k" data-pos="b" aria-label="Pitch back">▼</button>
      <span></span>
    </div>
    <div class="tc-cluster">
      <button type="button" class="tc-btn" data-tap="," aria-label="Warp slower">⏪</button>
      <button type="button" class="tc-btn" data-tap="." aria-label="Warp faster">⏩</button>
      <button type="button" class="tc-btn" data-tap="Escape" aria-label="Menu">⏸</button>

      <button type="button" class="tc-btn" id="tc-sas" data-tap="t">🧭<small>SAS</small></button>
      <button type="button" class="tc-btn" data-tap="f">🎯<small>MODE</small></button>
      <button type="button" class="tc-btn" data-tap="c">🎥<small>CAM</small></button>

      <button type="button" class="tc-btn tc-thr" data-hold="shift">▲<small>THR</small></button>
      <button type="button" class="tc-btn tc-thr" data-tap="z"><small>MAX</small></button>
      <button type="button" class="tc-btn" data-tap="p">🪂<small>LEGS</small></button>

      <button type="button" class="tc-btn tc-thr" data-hold="control">▼<small>THR</small></button>
      <button type="button" class="tc-btn tc-thr" data-tap="x"><small>0%</small></button>
      <button type="button" class="tc-btn tc-stage" data-tap=" " data-code="Space">🚀<small>STAGE</small></button>
    </div>`;
  root.appendChild(wrap);

  const pad = wrap.querySelector('#tc-pad');
  const rcsBtn = wrap.querySelector('#tc-rcs');
  const keyOf = (btn) => (pad.classList.contains('rcs') && btn.dataset.rcs) || btn.dataset.hold;

  // hold buttons (multi-touch safe: each finger is captured by its own button)
  wrap.querySelectorAll('[data-hold]').forEach((btn) => {
    let held = null;
    const release = () => {
      if (held && L()) L().keys[held] = false;
      held = null;
      btn.classList.remove('on');
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!L()) return;
      try { btn.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      release();
      held = keyOf(btn);
      L().keys[held] = true;
      btn.classList.add('on');
    });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // tap buttons → synthetic keyboard shortcut
  wrap.querySelectorAll('[data-tap]').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => e.preventDefault());
    btn.addEventListener('click', () => tap(btn.dataset.tap, btn.dataset.code || ''));
  });

  rcsBtn.addEventListener('click', () => {
    const on = pad.classList.toggle('rcs');
    rcsBtn.classList.toggle('on', on);
  });

  return { sasBtn: wrap.querySelector('#tc-sas'), rcsBtn };
}
