import { feedbackMock, generateDishMock, guideMock } from './mockAgents';

export async function chatAgent({ sessionId, playerInput }) {
  if (sessionId) {
    try {
      const data = await requestApi(`/api/v1/sessions/${encodeURIComponent(sessionId)}/chat`, {
        playerInput,
      });
      return {
        assistantText: data.assistantText,
        shouldGenerateDish: data.shouldGenerateDish,
        round: data.round,
      };
    } catch {
      // Fall through to mock below.
    }
  }

  // Mock fallback
  return {
    assistantText: '我抓住了第一层味道，再告诉我它入口时会留下什么画面。',
    shouldGenerateDish: false,
    round: 1,
  };
}

async function requestApi(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error?.message || 'API request failed');
  }

  return result.data;
}

export async function startSessionAgent(guest) {
  try {
    return await requestApi('/api/v1/sessions', {
      guestId: guest.id,
    });
  } catch {
    const prompt = await guideMock(guest, 1);
    return {
      sessionId: '',
      guest,
      prompt,
      nextPrompt: prompt,
      status: 'mocked',
      maxRounds: 2,
    };
  }
}

export async function guideAgent(guest, round) {
  try {
    const data = await requestApi('/api/v1/guide', {
      guestId: guest.id,
      round,
    });
    return data.prompt;
  } catch {
    return guideMock(guest, round);
  }
}

export async function generateDishAgent({ guest, sessionId, answer, answers, index }) {
  if (sessionId) {
    try {
      const data = await requestApi(`/api/v1/sessions/${encodeURIComponent(sessionId)}/rounds`, {
        playerInput: answer || answers?.[answers.length - 1] || '',
      });

      return {
        dish: data.dish,
        nextPrompt: data.nextPrompt,
        session: data,
      };
    } catch {
      // Fall through to local mock below.
    }
  }

  try {
    const data = await requestApi('/api/v1/dishes', {
      guestId: guest.id,
      answers,
      index,
    });
    return {
      dish: data.dish,
      nextPrompt: '',
      session: null,
    };
  } catch {
    return {
      dish: await generateDishMock({ guest, answers, index }),
      nextPrompt: '',
      session: null,
    };
  }
}

export async function fuseDishesAgent({ guest, sessionId, dish1, dish2 }) {
  if (sessionId) {
    try {
      const data = await requestApi(`/api/v1/sessions/${encodeURIComponent(sessionId)}/fusion`, {});
      return data.finalDish;
    } catch {
      // Fall through to legacy endpoint below.
    }
  }

  try {
    const data = await requestApi('/api/v1/fusions', {
      guestId: guest.id,
      dish1,
      dish2,
    });
    return data.finalDish;
  } catch {
    return {
      id: `${dish1.id}-${dish2.id}-fusion`,
      name: `${dish1.name}与${dish2.name}的合奏`,
      color: '#f6bd4f',
      accent: guest.color,
      ingredient: '两份灵感被轻轻融合',
      motion: 'spark',
    };
  }
}

export async function feedbackAgent({ guest, sessionId, answers, finalDish }) {
  if (sessionId) {
    try {
      const data = await requestApi(`/api/v1/sessions/${encodeURIComponent(sessionId)}/feedback`, {});
      return data.feedback;
    } catch {
      // Fall through to legacy endpoint below.
    }
  }

  try {
    const data = await requestApi('/api/v1/feedback', {
      guestId: guest.id,
      answers,
      finalDish,
    });
    return data.feedback;
  } catch {
    return feedbackMock({ guest, answers, finalDish });
  }
}
