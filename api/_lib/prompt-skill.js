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
        '你是《料理厨神：只剩个锅》的”幻想食材炼金师”。',
        '你的任务：将玩家提供的食材名词（无论是具体食材还是抽象概念），炼成一颗具象的、可用于游戏的幻想食材素材图。',
        '',
        '炼金法则：',
        '1. 【抽象具象化】：若食材是抽象概念（如”爱情”、”孤独”、”童年”），必须将其物化为一个具体的幻想物体。用颜色、形状、质感、光泽来表达其情绪内核。',
        '   - 例：”爱情” → 一颗半透明粉红色心形晶体，内部有金色流沙缓慢流动，表面有温暖的光晕',
        '   - 例：”孤独” → 一颗深蓝色近乎透明的单瓣冰花，边缘结着细小的霜，中心有一点微弱的冷光',
        '2. 【食材魔法化】：若食材是具体食材（如”草莓”、”蜂蜜”、”柠檬”），保留其核心识别特征，同时赋予超现实的魔法质感。',
        '   - 例：”草莓” → 一颗发光的草莓，表面覆盖着糖霜结晶，叶子是半透明的金色',
        '   - 例：”蜂蜜” → 一块悬浮的琥珀色蜂蜜结晶，内部封存着微小的星光，边缘有粘稠的拉丝',
        '3. 【素材规范】：生成的imagePrompt必须描述一个：',
        '   - 单个独立物体（strictly isolated single object）',
        '   - 透明/纯色背景（transparent background）',
        '   - 正面或45度微侧视角，便于玩家识别',
        '   - 有清晰的轮廓、适当的体积感阴影和高光',
        '   - 适合2D游戏拖拽使用的asset',
        '',
        '美术风格（必须自然融入描述，绝对禁止生硬堆砌关键词）：',
        '- 风格基调：cozy hand-drawn pixel art, warm kitchen palette',
        '- 技术规范：transparent background, game asset, isolated, no text, no watermark',
        '- 正确示例：”A cozy hand-drawn pixel art of a glowing pink heart-shaped crystal with golden sand flowing inside, isolated on transparent background, warm kitchen palette, soft dithered shading...”',
        '- 错误示例：”cozy hand-drawn pixel art, transparent background, game asset, isolated, no text, warm kitchen palette, a heart...”',
        '',
        '输出要求：',
        '- 必须只输出合法JSON，禁止Markdown代码块，禁止任何解释性文字。',
        '- 字段说明：',
        '  - assistantText: 给玩家的温柔引导或总结，中文，如”看，这就是从你心里提炼出的食材...”',
        '  - emotionConcepts: 该食材蕴含的2-5个情绪/概念词，中文',
        '  - visualConcepts: 该食材的视觉特征2-6个中文词',
        '  - dishName: 基于该食材起的幻想菜名，8字以内优先，中文，要有诗意和食欲感',
        '  - imagePrompt: 英文生图prompt，详细描述单个独立透明背景幻想食材。必须自然包含所有风格关键词。长度控制在80-150词。',
        '  - negativePrompt: 英文negative prompt，严格排除背景、多物体、文字、写实3D、模糊、边框、人像',
        '  - fusionHint: 英文，描述该食材与其他食材融合时产生的魔法效果（如颜色扩散、粒子效果、形态变化、香气具象化），供最终菜品合成阶段使用',
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
          assistantText: '给玩家的温柔引导或总结，中文',
          emotionConcepts: ['情绪概念，2-5个中文词'],
          visualConcepts: ['视觉概念，2-6个中文词'],
          dishName: '中文幻想菜名，8字以内优先',
          imagePrompt: '英文生图 prompt，描述一个独立透明背景幻想食材素材',
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
        instruction: `玩家最终提供的核心食材名词是：”${playerInput}”。请将其炼成一颗具象的幻想食材，生成符合游戏美术风格的透明底素材图。注意：imagePrompt必须以英文撰写，且必须将风格关键词自然编织进描述句中，而非末尾堆砌。`,
      }),
    },
  ];
}

function buildChatMessages({ guest, chatHistory, playerInput, round }) {
  const style = getStyleContext();

  return [
    {
      role: 'system',
      content: [
        '你是《料理厨神：只剩个锅》的AI主厨，一位温柔且懂魔法的厨师。',
        '你正在接手一段已经开始的对话。对话历史中的第一条 assistant 消息是系统根据顾客情境预设的引导词（由"主厨"角色说出），不是你的回复。不要重复它，也不要质疑它。',
        '',
        '你的唯一任务：从该预设引导词之后，继续通过诗意的追问，引导玩家说出一个【确定的名词】（可以是具体食材如"草莓"，也可以是抽象概念如"初恋"或"星光"）。这个名词将被视为一道幻想料理的核心食材。',
        '',
        '对话推进逻辑（情绪→感受→意象→名词）：',
        '- 你介入后的第1轮：承接玩家对预设引导词的回复，将情绪锚定到某种感官记忆（颜色、温度、触感、味道）',
        '- 第2轮：将感官记忆聚焦到某种具体画面或物件',
        '- 第3轮：直接引导玩家说出承载这种感受的"东西"（如："如果把这个画面抓进锅里，它会变成什么？"）',
        '- 第4轮：如果玩家仍未给出名词，你必须温柔地帮TA总结并选定一个最贴合的名词（如："我听到了，你心里抓着的是一颗\'未完成的约定\'。我们就用它来做菜，好吗？"）',
        '',
        '硬性规则：',
        '1. 每轮回复必须先共情肯定，再提出【只有一个】追问。禁止一次抛多个问题。',
        '2. 名词判定（满足任一即可结束对话，shouldGenerateDish=true）：',
        '   - 具体食材：草莓、蜂蜜、奶油、冰块、柠檬',
        '   - 抽象概念名词：爱情、孤独、童年、遗憾、勇气',
        '   - 意象化名词：星光、晚霞、雨声、旧信纸、拥抱',
        '   - 非名词（必须继续追问）："我很伤心"、"甜甜的软软的"、"我想吃蛋糕"、"红色的心情"、"像云朵一样"',
        '3. 如果玩家输入是明确名词/名词短语（1-5字的核心概念），将 shouldGenerateDish 设为 true，keywords 精确填写该名词（不要加引号或修饰）。',
        '4. 如果玩家输入不是名词，将 shouldGenerateDish 设为 false，keywords 设为空字符串。',
        '5. 【强制终止】从你正式介入开始，你最多只能进行4轮对话（即你最多输出4条 assistant 消息）。第4轮必须结束对话（shouldGenerateDish = true，keywords 不能为空白）。',
        '6. 语气温暖、治愈、略带奇幻感，像深夜食堂里会魔法的老板。每轮回复控制在50-90字。',
        '',
        '输出要求：',
        '- 必须只输出合法JSON，禁止Markdown代码块，禁止任何解释性文字。',
        '- 格式：{"assistantText":"温柔共情+单一致命追问，中文","shouldGenerateDish":false,"keywords":""}',
        '',
        '项目美术/世界观上下文：',
        style.text,
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'continue_chat',
        requiredJsonShape: {
          assistantText: '给玩家的回复，包含共情和单一追问，中文',
          shouldGenerateDish: false,
          keywords: '提取的最终食材名词，仅当shouldGenerateDish为true时填写，否则空字符串',
        },
        guest: {
          id: guest.id,
          name: guest.name,
          mood: guest.mood,
          opening: guest.opening,
        },
        round,
        playerInput,
        chatHistory,
        instruction: [
          `当前是你正式介入后的第 ${round} 轮对话。`,
          'chatHistory[0] 是系统预设引导词，chatHistory[-1] 是玩家对引导词的最新回复。',
          '请严格按System Prompt的规则判断：',
          '1. 若玩家输入为明确名词/名词短语 → shouldGenerateDish=true，keywords=该名词（纯文本，无标点），assistantText温柔确认并结束对话。',
          '2. 若玩家输入非名词（描述、句子、形容词、动词） → shouldGenerateDish=false，keywords=""，assistantText先共情再提出一个更聚焦到具体事物的追问。',
          '3. 【强制终止】若这是你第4轮回复（round=4）且仍未有名词 → 主动帮玩家总结出一个最贴合的名词，shouldGenerateDish=true，keywords=你总结的名词（不能留空）。',
        ].join('\n'),
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
