'use strict';
/**
 * Exécute le code JavaScript d'origine de la PWA (legacy/js) dans un bac à sable
 * `vm`, avec un DOM factice, une horloge figée et des minuteries capturées.
 * Sert de référence pour les tests de caractérisation : le TypeScript doit
 * produire exactement les mêmes résultats que ce code.
 */
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const LOAD_ORDER = [
  'core', 'theme', 'progress', 'home', 'mood', 'report', 'habits', 'account', 'reminders',
  'wellness', 'pause', 'challenges', 'shortcuts', 'backup', 'archive', 'times', 'reorder',
  'detail', 'review', 'day', 'a11y',
];

/** Objet « attrape-tout » : accepte lectures, écritures et appels sans jamais échouer. */
function makeStub() {
  const target = function () {};
  const handler = {
    get(_t, key) {
      if (key === Symbol.toPrimitive) return () => '';
      if (key === Symbol.iterator) return function* () {};
      if (key === 'then') return undefined;
      if (key === 'length') return 0;
      return makeStub();
    },
    set: () => true,
    apply: () => makeStub(),
    construct: () => makeStub(),
    has: () => true,
  };
  return new Proxy(target, handler);
}

function createLegacy({ now, db, dayStartHour = 0 }) {
  const NOW = now.getTime();
  class FakeDate extends Date {
    constructor(...args) {
      if (args.length === 0) super(NOW);
      else super(...args);
    }
    static now() {
      return NOW;
    }
  }

  const timers = [];
  const sounds = [];
  const toasts = [];
  const sandbox = {
    Date: FakeDate,
    console: { log() {}, warn() {}, error() {}, info() {} },
    document: makeStub(),
    navigator: makeStub(),
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: makeStub(),
    history: makeStub(),
    Notification: undefined,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame() {},
    performance: { now: () => 0 },
    alert() {},
    confirm: () => true,
    setInterval: () => 0,
    clearInterval() {},
    clearTimeout() {},
    setTimeout: (fn, ms = 0) => {
      timers.push({ fn, ms, n: timers.length });
      return timers.length;
    },
    addEventListener() {},
    removeEventListener() {},
    CSS: makeStub(),
    Image: function () {},
    URL: { createObjectURL: () => '', revokeObjectURL() {} },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);

  for (const name of LOAD_ORDER) {
    const file = path.join(__dirname, '..', 'legacy', 'js', `${name}.js`);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: `legacy/${name}.js` });
  }

  // Remplace les effets de bord visuels : on capture sons et toasts, on ignore le reste.
  const noop = () => {};
  for (const fn of [
    'renderActivePage', 'showPage', 'launchConfetti', 'saveData', 'renderSleepSummary',
    'scheduleLocalNotifications', 'renderMyHabits', 'announceReorder', 'closeHabitForm',
    'renderWeeklyTab', 'renderBackupNudge', 'renderPauseBanner', 'renderReport',
  ]) {
    sandbox[fn] = noop;
  }
  let lastUndo = null;
  sandbox.showUndoToast = (_msg, fn) => {
    lastUndo = fn;
  };
  sandbox.playSound = (s) => sounds.push(s);
  sandbox.showToast = (msg) => toasts.push(msg);

  vm.runInContext(
    `_dayStartHour = ${Number(dayStartHour)}; DB = ${JSON.stringify(db)}; HABITS = DB.habitDefs;`,
    ctx,
  );

  /** Évalue une expression et renvoie son résultat « décontaminé » (objets du royaume principal). */
  const call = (expr) => {
    const v = vm.runInContext(expr, ctx);
    return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  };
  return {
    ctx,
    sounds,
    toasts,
    call,
    get db() {
      return JSON.parse(JSON.stringify(call('DB')));
    },
    /** Exécute les minuteries en attente (dans l'ordre des délais). */
    flush() {
      let guard = 0;
      while (timers.length && guard++ < 500) {
        timers.sort((a, b) => a.ms - b.ms || a.n - b.n);
        const t = timers.shift();
        t.fn();
      }
    },
    /** Exécute l'action « Annuler » proposée par le dernier toast d'annulation. */
    runUndo() {
      if (lastUndo) lastUndo();
    },
    /** Exécute la prochaine minuterie en attente (la plus ancienne). Renvoie `false` s'il n'y en a pas. */
    step() {
      if (!timers.length) return false;
      timers.sort((a, b) => a.n - b.n);
      timers.shift().fn();
      return true;
    },
    /** Délai (ms) de la prochaine minuterie en attente, ou `null`. */
    peek() {
      if (!timers.length) return null;
      timers.sort((a, b) => a.n - b.n);
      return timers[0].ms;
    },
    resetCaptures() {
      sounds.length = 0;
      toasts.length = 0;
      timers.length = 0;
    },
  };
}

module.exports = { createLegacy };
