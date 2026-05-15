import { dishNameSets, fallbackDishNames, scoreBands } from '../data/mockDishes';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pickBySeed(items, seed) {
  return items[Math.abs(seed) % items.length];
}

function textSeed(parts) {
  return parts.join('|').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function score(seed, [min, max]) {
  return min + (seed % (max - min + 1));
}

function getDishNames(guestId, index) {
  const set = dishNameSets[guestId] || fallbackDishNames;
  return index === 1 ? set.first : set.second;
}

export async function guideMock(guest, round) {
  await wait(360);
  return guest.prompts[Math.min(round - 1, guest.prompts.length - 1)];
}

export async function generateDishMock({ guest, answers, index }) {
  await wait(900);
  const seed = textSeed([guest.id, index, ...answers]);
  const names = getDishNames(guest.id, index);

  return {
    id: `${guest.id}-dish-${index}-${seed}`,
    name: pickBySeed(names, seed + index),
    color: guest.dishPalette[(index - 1) % guest.dishPalette.length],
    accent: guest.dishPalette[index % guest.dishPalette.length],
    ingredient: pickBySeed(answers, seed) || guest.mood,
    motion: index === 1 ? 'float' : 'spark',
  };
}

export async function feedbackMock({ guest, answers, finalDish }) {
  await wait(700);
  const seed = textSeed([guest.id, finalDish.name, ...answers]);

  return {
    text: guest.feedback,
    scores: {
      satisfaction: score(seed, scoreBands.satisfaction),
      creativity: score(seed + 9, scoreBands.creativity),
      rarity: score(seed + 17, scoreBands.rarity),
    },
    rarity:
      seed % 7 === 0 ? 'SSR' : seed % 3 === 0 ? 'SR' : 'R',
  };
}
