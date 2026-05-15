const { dishNameSets, fallbackDishNames, fallbackGuest, guests, scoreBands } = require('./game-data');

function pickBySeed(items, seed) {
  return items[Math.abs(seed) % items.length];
}

function textSeed(parts) {
  return parts.join('|').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function score(seed, [min, max]) {
  return min + (seed % (max - min + 1));
}

function getGuest(guestId) {
  return guests.find((guest) => guest.id === guestId) || fallbackGuest;
}

function getGuests() {
  return guests;
}

function getDishNames(guestId, index) {
  const set = dishNameSets[guestId] || fallbackDishNames;
  return index === 1 ? set.first : set.second;
}

function guide({ guestId, round }) {
  const guest = getGuest(guestId);
  const safeRound = Math.max(1, Number(round) || 1);
  return {
    prompt: guest.prompts[Math.min(safeRound - 1, guest.prompts.length - 1)],
    round: safeRound,
    maxRounds: 3,
  };
}

function generateDish({ guestId, answers, index }) {
  const guest = getGuest(guestId);
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const safeIndex = Number(index) === 2 ? 2 : 1;
  const seed = textSeed([guest.id, safeIndex, ...safeAnswers]);
  const names = getDishNames(guest.id, safeIndex);

  return {
    id: `${guest.id}-dish-${safeIndex}-${seed}`,
    name: pickBySeed(names, seed + safeIndex),
    color: guest.dishPalette[(safeIndex - 1) % guest.dishPalette.length],
    accent: guest.dishPalette[safeIndex % guest.dishPalette.length],
    ingredient: pickBySeed(safeAnswers, seed) || guest.mood,
    motion: safeIndex === 1 ? 'float' : 'spark',
  };
}

function fuseDishes({ guestId, dish1, dish2 }) {
  const guest = getGuest(guestId);
  const first = dish1 || {};
  const second = dish2 || {};

  return {
    id: `${first.id || 'dish-1'}-${second.id || 'dish-2'}-fusion`,
    name: `${first.name || '第一道灵感'}与${second.name || '第二道灵感'}的合奏`,
    color: '#f6bd4f',
    accent: guest.color,
    ingredient: '两份灵感被轻轻融合',
    motion: 'spark',
  };
}

function feedback({ guestId, answers, finalDish }) {
  const guest = getGuest(guestId);
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const dish = finalDish || {};
  const seed = textSeed([guest.id, dish.name || '最终料理', ...safeAnswers]);

  return {
    text: guest.feedback,
    scores: {
      satisfaction: score(seed, scoreBands.satisfaction),
      creativity: score(seed + 9, scoreBands.creativity),
      rarity: score(seed + 17, scoreBands.rarity),
    },
    rarity: seed % 7 === 0 ? 'SSR' : seed % 3 === 0 ? 'SR' : 'R',
  };
}

module.exports = {
  feedback,
  fuseDishes,
  generateDish,
  getGuest,
  getGuests,
  guide,
};
