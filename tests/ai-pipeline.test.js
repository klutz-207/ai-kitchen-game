const assert = require('node:assert/strict');
const test = require('node:test');

process.env.AI_KITCHEN_USE_MOCK = 'true';

const { startSession, submitRound, fuseSession, createFeedback } = require('../api/_lib/ai-pipeline');
const { extractJson } = require('../api/_lib/llm-client');
const { buildRoundMessages, buildTextToImagePrompt } = require('../api/_lib/prompt-skill');
const { toDataUrl, stripDataUrl } = require('../api/_lib/sd-client');
const { getStyleContext } = require('../api/_lib/style-context');
const { getGuest } = require('../api/_lib/mock-service');

test('style context reads project art direction sources', () => {
  const context = getStyleContext();

  assert.equal(context.sources.includes('美术风格定义'), true);
  assert.match(context.text, /温暖手绘感像素童话厨房风/);
  assert.match(context.text, /transparent background/);
});

test('prompt skill injects guest input and style context', () => {
  const guest = getGuest('heartbreak');
  const messages = buildRoundMessages({
    guest,
    round: 1,
    playerInput: '初恋的晚风和透明糖霜',
    previousRounds: [],
  });

  assert.equal(messages.length, 2);
  assert.match(messages[0].content, /Prompt Skill/);
  assert.match(messages[0].content, /温暖手绘感像素童话厨房风/);
  assert.match(messages[1].content, /初恋的晚风和透明糖霜/);
});

test('prompt skill builds txt2img prompt from structured output', () => {
  const prompt = buildTextToImagePrompt({
    roundOutput: {
      imagePrompt: 'cozy pixel art dish made of moonlight jelly',
    },
  });

  assert.match(prompt, /moonlight jelly/);
  assert.match(prompt, /Style contract/);
});

test('llm client extracts raw or fenced JSON-like content', () => {
  assert.deepEqual(extractJson('{"ok":true,"value":3}'), { ok: true, value: 3 });
  assert.deepEqual(extractJson('prefix {"ok":true} suffix'), { ok: true });
});

test('sd client converts base64 and data URLs', () => {
  const raw = Buffer.from('fake').toString('base64');
  const dataUrl = toDataUrl(raw);

  assert.equal(dataUrl, `data:image/png;base64,${raw}`);
  assert.equal(stripDataUrl(dataUrl), raw);
});

test('mock session pipeline creates two dishes, fusion, and feedback', async () => {
  const session = await startSession({ guestId: 'heartbreak' });

  assert.equal(Boolean(session.sessionId), true);
  assert.equal(session.status, 'awaiting_round_1');
  assert.match(session.prompt, /甜/);

  const round1 = await submitRound({
    sessionId: session.sessionId,
    playerInput: '初恋下午的阳光和透明糖霜',
  });

  assert.equal(round1.round, 1);
  assert.equal(round1.status, 'awaiting_round_2');
  assert.equal(round1.dishes.length, 1);
  assert.equal(round1.dish.status, 'mocked');
  assert.equal(Boolean(round1.nextPrompt), true);

  const round2 = await submitRound({
    sessionId: session.sessionId,
    playerInput: '旧信、晚风和一点刺痛的果冻',
  });

  assert.equal(round2.round, 2);
  assert.equal(round2.status, 'ready_for_fusion');
  assert.equal(round2.dishes.length, 2);

  const fusion = await fuseSession({ sessionId: session.sessionId });

  assert.equal(fusion.status, 'ready_for_feedback');
  assert.match(fusion.finalDish.name, /的合奏/);

  const feedback = await createFeedback({ sessionId: session.sessionId });

  assert.equal(feedback.status, 'completed');
  assert.equal(typeof feedback.feedback.text, 'string');
  assert.match(feedback.feedback.rarity, /^(R|SR|SSR)$/);
});
