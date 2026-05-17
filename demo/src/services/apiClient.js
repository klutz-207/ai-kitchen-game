import { feedbackMock, generateDishMock, guideMock } from './mockAgents';
import { presetDishArt } from '../data/mockDishes';

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

function applyPresetDishArt(guest, dish, index) {
  const preset = presetDishArt[guest.id]?.dishes?.[index];
  if (!preset) return dish;

  return {
    ...dish,
    name: preset.name,
    ingredient: preset.ingredient,
    imageUrl: preset.imageUrl,
    imageFit: preset.imageFit,
  };
}

function applyPresetFusionArt(guest, finalDish) {
  const preset = presetDishArt[guest.id]?.fusion;
  if (!preset) return finalDish;

  return {
    ...finalDish,
    name: preset.name,
    ingredient: preset.ingredient,
    imageUrl: preset.imageUrl,
    imageFit: preset.imageFit,
  };
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
        dish: applyPresetDishArt(guest, data.dish, index),
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
      dish: applyPresetDishArt(guest, data.dish, index),
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
      return applyPresetFusionArt(guest, data.finalDish);
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
    return applyPresetFusionArt(guest, data.finalDish);
  } catch {
    return applyPresetFusionArt(guest, {
      id: `${dish1.id}-${dish2.id}-fusion`,
      name: `${dish1.name}与${dish2.name}的合奏`,
      color: '#f6bd4f',
      accent: guest.color,
      ingredient: '两份灵感被轻轻融合',
      motion: 'spark',
    });
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
