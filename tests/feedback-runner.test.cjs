'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../.build/state');

function harness() {
  const log = [];
  const queue = [];
  const ports = {
    playSound: (s) => log.push(`sound:${s}`),
    haptic: (s) => log.push(`haptic:${s}`),
    toast: (t) => log.push(`toast:${t.text}`),
    confetti: () => log.push('confetti'),
    flash: (id) => log.push(`flash:${id}`),
  };
  const timers = { set: (fn, ms) => { queue.push({ fn, ms }); return queue.length; }, clear() {} };
  return { log, queue, ports, timers, flush: () => queue.sort((a, b) => a.ms - b.ms).splice(0).forEach((t) => t.fn()) };
}

test('exécuteur : immédiat pour délai 0, différé sinon, dans l’ordre des délais', () => {
  const h = harness();
  S.runFeedback(S.eventsToFeedback([
    { type: 'sound', sound: 'done' },
    { type: 'level_up', level: 2, name: 'Apprenti' },
    { type: 'perfect_day', bonusXp: 50 },
  ]), h.ports, { soundEnabled: true, timers: h.timers });
  assert.deepEqual(h.log, ['sound:done', 'haptic:light', 'confetti', 'sound:fanfare', 'haptic:success']);
  assert.deepEqual(h.queue.map((t) => t.ms).sort((a, b) => a - b), [300, 300, 300, 600]);
  h.flush();
  assert.ok(h.log.includes('toast:Niveau 2 atteint : Apprenti'));
  assert.ok(h.log.includes('toast:Journée parfaite ! +50 XP'));
});

test('exécuteur : effets sonores coupés → plus de son, mais toasts et vibrations conservés', () => {
  const h = harness();
  S.runFeedback(S.eventsToFeedback([
    { type: 'sound', sound: 'fail' },
    { type: 'goal_reached', habitId: 'drink', habitName: 'Eau', kind: 'drink', xp: 10 },
  ]), h.ports, { soundEnabled: false, timers: h.timers });
  assert.deepEqual(h.log, ['haptic:warning', "toast:Objectif d'hydratation atteint ! +10 XP"]);
});

test('bus : abonnement, désabonnement, émission pendant l’itération', () => {
  const bus = S.createBus();
  const got = [];
  const off = bus.subscribe((v) => got.push(`a${v}`));
  bus.subscribe((v) => got.push(`b${v}`));
  bus.emit(1);
  off();
  bus.emit(2);
  assert.deepEqual(got, ['a1', 'b1', 'b2']);
});
