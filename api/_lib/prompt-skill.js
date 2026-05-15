const { getStyleContext } = require('./style-context');

function listText(items) {
  return Array.isArray(items) ? items.join('、') : '';
}

function buildRoundMessages({ guest, round, playerInput, previousRounds = [] }) {
  const style = getStyleContext();

  return [
    {
      role: 'system',
      content: [
        '你是 AI 厨房游戏的“情绪料理 Prompt Skill”。',
        '你要理解玩家输入，把抽象情绪转译为可生图的幻想料理概念。',
        '必须只输出 JSON，不要输出 Markdown，不要解释。',
        '生成的 imagePrompt 必须自然融合项目世界观和美术规范。',
        '',
        '项目美术/世界观上下文：',
        style.text,
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'analyze_round_and_create_image_prompt',
        requiredJsonShape: {
          assistantText: '给玩家的下一句温柔引导或总结，中文',
          emotionConcepts: ['情绪概念，2-5个中文词'],
          visualConcepts: ['视觉概念，2-6个中文词'],
          dishName: '中文幻想菜名，8字以内优先',
          imagePrompt: '英文生图 prompt，描述一个独立透明背景幻想菜品素材',
          negativePrompt: '英文 negative prompt',
          fusionHint: '给最终融合阶段使用的英文融合提示',
        },
        guest: {
          id: guest.id,
          name: guest.name,
          mood: guest.mood,
          opening: guest.opening,
          feedbackStyle: guest.feedback,
        },
        round,
        playerInput,
        previousRounds,
      }),
    },
  ];
}

function buildFeedbackMessages({ guest, answers, finalDish }) {
  const style = getStyleContext();

  return [
    {
      role: 'system',
      content: [
        '你是 AI 厨房游戏的客人反馈智能体。',
        '你要根据客人的情绪需求、玩家回答和最终料理，输出情感反馈与评分。',
        '必须只输出 JSON，不要输出 Markdown，不要解释。',
        '',
        '项目风格上下文：',
        style.text,
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'create_guest_feedback',
        requiredJsonShape: {
          text: '符合客人性格的中文反馈，一到两句话',
          scores: {
            satisfaction: '0-100整数',
            creativity: '0-100整数',
            rarity: '0-100整数',
          },
          rarity: 'R/SR/SSR之一',
        },
        guest: {
          id: guest.id,
          name: guest.name,
          mood: guest.mood,
          opening: guest.opening,
          feedbackStyle: guest.feedback,
        },
        answers,
        finalDish,
      }),
    },
  ];
}

function buildTextToImagePrompt({ roundOutput }) {
  const style = getStyleContext();
  return [
    roundOutput.imagePrompt,
    '',
    'Style contract from project documents:',
    style.text,
    '',
    'Strict output: one centered fantasy dish game asset, transparent background, no text.',
  ].join('\n');
}

function buildFusionPrompt({ guest, dish1, dish2, rounds }) {
  const style = getStyleContext();
  const hints = rounds.map((round) => round.fusionHint).filter(Boolean);

  return [
    'A single surreal fantasy fusion dish created by merging two emotional dishes into one unified cuisine artwork.',
    `Guest emotional request: ${guest.mood}`,
    `Dish one: ${dish1.name}, concepts: ${listText(dish1.concepts?.visualConcepts)}`,
    `Dish two: ${dish2.name}, concepts: ${listText(dish2.concepts?.visualConcepts)}`,
    `Fusion hints: ${hints.join('; ')}`,
    '',
    'Project style contract:',
    style.text,
    '',
    'Strict output: one final centered dish, unified art style, transparent background, no text, no logo.',
  ].join('\n');
}

function defaultNegativePrompt(extra = '') {
  return [
    'realistic, photorealistic, anime, 3D render, cyberpunk, dark fantasy',
    'high detail illustration, hard 8-bit, black outline cartoon, flat vector',
    'neon colors, busy background, logo, text, watermark, realistic lighting',
    extra,
  ].filter(Boolean).join(', ');
}

module.exports = {
  buildFeedbackMessages,
  buildFusionPrompt,
  buildRoundMessages,
  buildTextToImagePrompt,
  defaultNegativePrompt,
};
