const { callZhipuJson } = require('./llm-client');
const { generateImageToImage, generateTextToImage } = require('./sd-client');
const {
  buildChatMessages,
  buildFeedbackMessages,
  buildFusionPrompt,
  buildRoundMessages,
  buildTextToImagePrompt,
  defaultNegativePrompt,
} = require('./prompt-skill');
const { createSession, getSession, saveSession, serializeSession } = require('./session-store');
const { feedback: mockFeedback, fuseDishes: mockFuseDishes, generateDish: mockGenerateDish, guide } = require('./mock-service');
const { useMock } = require('./env');

function clampScore(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function normalizeRoundOutput(output, fallback) {
  return {
    assistantText: output.assistantText || fallback.assistantText,
    emotionConcepts: Array.isArray(output.emotionConcepts) ? output.emotionConcepts : fallback.emotionConcepts,
    visualConcepts: Array.isArray(output.visualConcepts) ? output.visualConcepts : fallback.visualConcepts,
    dishName: output.dishName || fallback.dishName,
    imagePrompt: output.imagePrompt || fallback.imagePrompt,
    negativePrompt: output.negativePrompt || fallback.negativePrompt,
    fusionHint: output.fusionHint || fallback.fusionHint,
  };
}

function makeMockRoundOutput({ guest, playerInput, round }) {
  return {
    assistantText: round === 1
      ? '我抓住了第一层味道，再告诉我它入口时会留下什么画面。'
      : '两份灵感已经成形，可以开始烹调了。',
    emotionConcepts: [guest.mood, playerInput].filter(Boolean).slice(0, 4),
    visualConcepts: [playerInput, round === 1 ? '柔软发光' : '更深的回忆', '幻想料理'].filter(Boolean),
    dishName: '',
    imagePrompt: `cozy hand-drawn pixel art fantasy dish inspired by ${playerInput}, centered transparent game asset`,
    negativePrompt: defaultNegativePrompt(),
    fusionHint: `merge the emotional flavor of ${playerInput} into the final fantasy dish`,
  };
}

function toDish({ session, roundOutput, imageUrl, round }) {
  const mockDish = mockGenerateDish({
    guestId: session.guest.id,
    answers: [roundOutput.visualConcepts.join(' '), roundOutput.emotionConcepts.join(' ')],
    index: round,
  });

  return {
    ...mockDish,
    name: roundOutput.dishName || mockDish.name,
    ingredient: roundOutput.visualConcepts[0] || mockDish.ingredient,
    imageUrl: imageUrl || '',
    prompt: roundOutput.imagePrompt,
    concepts: {
      emotionConcepts: roundOutput.emotionConcepts,
      visualConcepts: roundOutput.visualConcepts,
      fusionHint: roundOutput.fusionHint,
    },
    status: imageUrl ? 'generated' : 'mocked',
  };
}

function normalizeFeedback(output, fallback) {
  return {
    text: output.text || fallback.text,
    scores: {
      satisfaction: clampScore(output.scores?.satisfaction, fallback.scores.satisfaction),
      creativity: clampScore(output.scores?.creativity, fallback.scores.creativity),
      rarity: clampScore(output.scores?.rarity, fallback.scores.rarity),
    },
    rarity: ['R', 'SR', 'SSR'].includes(output.rarity) ? output.rarity : fallback.rarity,
  };
}

function ensureSession(id) {
  const session = getSession(id);
  if (!session) {
    const error = new Error('Session not found or expired.');
    error.statusCode = 404;
    error.code = 'session_not_found';
    throw error;
  }
  return session;
}

async function startSession({ guestId }) {
  const session = createSession({ guestId });
  const firstGuide = guide({ guestId: session.guest.id, round: 1 });
  session.status = 'awaiting_round_1';
  saveSession(session);

  return {
    ...serializeSession(session),
    prompt: firstGuide.prompt,
    nextPrompt: firstGuide.prompt,
    maxRounds: 2,
  };
}

async function chatRound({ sessionId, playerInput }) {
  const session = ensureSession(sessionId);
  if (!playerInput || !String(playerInput).trim()) {
    const error = new Error('playerInput is required.');
    error.statusCode = 400;
    error.code = 'validation_error';
    throw error;
  }

  const round = session.rounds.length + 1;
  if (round > 2) {
    const error = new Error('This session already has two rounds.');
    error.statusCode = 409;
    error.code = 'round_limit_reached';
    throw error;
  }

  // 获取当前轮次的对话历史
  const chatHistoryKey = `chat_history_${round}`;
  if (!session[chatHistoryKey]) {
    session[chatHistoryKey] = [];
  }

  // 将玩家输入添加到对话历史
  session[chatHistoryKey].push({
    role: 'player',
    content: playerInput,
  });

  // 调用 LLM 进行对话
  // Mock fallback: 检测是否为名词，或超过3轮强制结束
  const chatTurns = session[chatHistoryKey].filter(m => m.role === 'assistant').length;
  const isNoun = playerInput.length <= 6 && !playerInput.includes('我') && !playerInput.includes('想') && !playerInput.includes('很');
  const shouldEnd = isNoun || chatTurns >= 3;
  const fallback = {
    assistantText: shouldEnd
      ? `「${playerInput}」...我感受到了，这就是你要的食材。`
      : '我抓住了第一层味道，再告诉我它入口时会留下什么画面。',
    shouldGenerateDish: shouldEnd,
    keywords: shouldEnd ? playerInput : '',
  };

  const chatOutput = useMock()
    ? fallback
    : normalizeChatOutput(await callZhipuJson(buildChatMessages({
      guest: session.guest,
      chatHistory: session[chatHistoryKey],
      playerInput,
      round,
    })), fallback);

  // 将 AI 回复添加到对话历史
  session[chatHistoryKey].push({
    role: 'assistant',
    content: chatOutput.assistantText,
  });

  // 保存关键词
  session[`keywords_${round}`] = chatOutput.keywords || playerInput;

  saveSession(session);

  return {
    ...serializeSession(session),
    assistantText: chatOutput.assistantText,
    shouldGenerateDish: chatOutput.shouldGenerateDish,
    round,
  };
}

function normalizeChatOutput(output, fallback) {
  return {
    assistantText: output.assistantText || fallback.assistantText,
    shouldGenerateDish: output.shouldGenerateDish === true,
    keywords: output.keywords || fallback.keywords,
  };
}

async function submitRound({ sessionId, playerInput }) {
  const session = ensureSession(sessionId);
  if (!playerInput || !String(playerInput).trim()) {
    const error = new Error('playerInput is required.');
    error.statusCode = 400;
    error.code = 'validation_error';
    throw error;
  }

  const round = session.rounds.length + 1;
  if (round > 2) {
    const error = new Error('This session already has two rounds.');
    error.statusCode = 409;
    error.code = 'round_limit_reached';
    throw error;
  }

  session.status = `generating_dish_${round}`;
  saveSession(session);

  const fallback = makeMockRoundOutput({ guest: session.guest, playerInput, round });
  const roundOutput = useMock()
    ? fallback
    : normalizeRoundOutput(await callZhipuJson(buildRoundMessages({
      guest: session.guest,
      round,
      playerInput,
      previousRounds: session.rounds,
    })), fallback);

  const imageResult = useMock()
    ? { imageUrl: '' }
    : await generateTextToImage({
      prompt: buildTextToImagePrompt({ roundOutput }),
      negativePrompt: roundOutput.negativePrompt || defaultNegativePrompt(),
    });

  const dish = toDish({
    session,
    roundOutput,
    imageUrl: imageResult.imageUrl,
    round,
  });

  const roundRecord = {
    round,
    playerInput,
    ...roundOutput,
    dishId: dish.id,
  };

  session.rounds.push(roundRecord);
  session.dishes[round - 1] = dish;
  session.status = round === 1 ? 'awaiting_round_2' : 'ready_for_fusion';
  saveSession(session);

  return {
    ...serializeSession(session),
    round,
    concepts: dish.concepts,
    dish,
    nextPrompt: round === 1 ? roundOutput.assistantText || guide({ guestId: session.guest.id, round: 2 }).prompt : '',
  };
}

async function fuseSession({ sessionId }) {
  const session = ensureSession(sessionId);
  if (session.dishes.length < 2 || !session.dishes[0] || !session.dishes[1]) {
    const error = new Error('Two generated dishes are required before fusion.');
    error.statusCode = 409;
    error.code = 'fusion_not_ready';
    throw error;
  }

  session.status = 'fusing';
  saveSession(session);

  const [dish1, dish2] = session.dishes;
  const mockFinal = mockFuseDishes({ guestId: session.guest.id, dish1, dish2 });
  const fusionPrompt = buildFusionPrompt({ guest: session.guest, dish1, dish2, rounds: session.rounds });

  let imageResult;
  if (useMock()) {
    imageResult = { imageUrl: '' };
  } else {
    try {
      imageResult = await generateImageToImage({
        prompt: fusionPrompt,
        negativePrompt: defaultNegativePrompt(),
        imageUrls: [dish1.imageUrl, dish2.imageUrl].filter(Boolean),
      });
    } catch {
      // CogView-3-Flash 等不支持图生图的 provider 回退到文生图
      imageResult = await generateTextToImage({
        prompt: fusionPrompt,
        negativePrompt: defaultNegativePrompt(),
      });
    }
  }

  const finalDish = {
    ...mockFinal,
    imageUrl: imageResult.imageUrl || '',
    prompt: useMock() ? '' : buildFusionPrompt({ guest: session.guest, dish1, dish2, rounds: session.rounds }),
    concepts: {
      emotionConcepts: session.rounds.flatMap((round) => round.emotionConcepts || []),
      visualConcepts: session.rounds.flatMap((round) => round.visualConcepts || []),
      fusionHint: session.rounds.map((round) => round.fusionHint).filter(Boolean).join('; '),
    },
    status: imageResult.imageUrl ? 'generated' : 'mocked',
  };

  session.finalDish = finalDish;
  session.status = 'ready_for_feedback';
  saveSession(session);

  return {
    ...serializeSession(session),
    finalDish,
  };
}

async function createFeedback({ sessionId }) {
  const session = ensureSession(sessionId);
  if (!session.finalDish) {
    const error = new Error('finalDish is required before feedback.');
    error.statusCode = 409;
    error.code = 'feedback_not_ready';
    throw error;
  }

  const fallback = mockFeedback({
    guestId: session.guest.id,
    answers: session.rounds.map((round) => round.playerInput),
    finalDish: session.finalDish,
  });

  const result = useMock()
    ? fallback
    : normalizeFeedback(await callZhipuJson(buildFeedbackMessages({
      guest: session.guest,
      answers: session.rounds.map((round) => round.playerInput),
      finalDish: session.finalDish,
    })), fallback);

  session.feedback = result;
  session.status = 'completed';
  saveSession(session);

  return {
    ...serializeSession(session),
    feedback: result,
  };
}

module.exports = {
  chatRound,
  createFeedback,
  fuseSession,
  startSession,
  submitRound,
};
