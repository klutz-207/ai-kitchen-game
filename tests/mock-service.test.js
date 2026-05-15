const assert = require('node:assert/strict');
const test = require('node:test');

const {
  feedback,
  fuseDishes,
  generateDish,
  getGuests,
  guide,
} = require('../api/_lib/mock-service');

test('returns the seeded guest list', () => {
  const guests = getGuests();

  assert.equal(guests.length >= 6, true);
  assert.equal(guests[0].id, 'heartbreak');
  for (const guest of guests) {
    assert.equal(typeof guest.id, 'string');
    assert.equal(typeof guest.name, 'string');
    assert.equal(typeof guest.opening, 'string');
    assert.equal(Array.isArray(guest.prompts), true);
    assert.equal(guest.prompts.length >= 3, true);
    assert.equal(Array.isArray(guest.dishPalette), true);
    assert.equal(guest.dishPalette.length >= 2, true);
    assert.equal(typeof guest.feedback, 'string');
  }
});

test('returns a stable guide prompt for a guest and round', () => {
  const result = guide({ guestId: 'programmer', round: 2 });

  assert.equal(result.round, 2);
  assert.match(result.prompt, /深夜写代码/);
});

test('generates a deterministic dish for the same input', () => {
  const input = {
    guestId: 'traveler',
    answers: ['窗边的光', '一张小小车票', '像云一样软'],
    index: 1,
  };

  const first = generateDish(input);
  const second = generateDish(input);

  assert.deepEqual(first, second);
  assert.equal(first.motion, 'float');
  assert.equal(typeof first.name, 'string');
});

test('generates guest-specific dish names for newer guests', () => {
  const stargazerDish = generateDish({
    guestId: 'stargazer',
    answers: ['一小口银河', '凌晨观测站的热茶'],
    index: 1,
  });
  const childDish = generateDish({
    guestId: 'child',
    answers: ['跳跳糖', '小旗子'],
    index: 2,
  });

  assert.match(stargazerDish.name, /流星|月尘|银河|观测站/);
  assert.match(childDish.name, /不发抖|铅笔盒|盾牌|第一句话/);
});

test('fuses two dishes into a final dish shape', () => {
  const dish1 = generateDish({
    guestId: 'heartbreak',
    answers: ['初恋的味道', '透明糖霜', '一点刺痛'],
    index: 1,
  });
  const dish2 = generateDish({
    guestId: 'heartbreak',
    answers: ['旧信', '晚风', '会融化'],
    index: 2,
  });

  const finalDish = fuseDishes({ guestId: 'heartbreak', dish1, dish2 });

  assert.equal(finalDish.id.endsWith('-fusion'), true);
  assert.match(finalDish.name, /的合奏/);
  assert.equal(finalDish.motion, 'spark');
});

test('returns feedback scores and rarity', () => {
  const finalDish = {
    id: 'final-dish',
    name: '旧信酥塔与晚风奶冻的合奏',
  };

  const result = feedback({
    guestId: 'heartbreak',
    answers: ['旧信', '晚风', '糖霜'],
    finalDish,
  });

  assert.equal(typeof result.text, 'string');
  assert.equal(result.scores.satisfaction >= 82, true);
  assert.equal(result.scores.creativity >= 76, true);
  assert.equal(result.scores.rarity >= 70, true);
  assert.match(result.rarity, /^(R|SR|SSR)$/);
});
