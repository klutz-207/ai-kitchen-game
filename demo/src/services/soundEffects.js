const basePath = '/assets/audio/';

const sounds = {
  ambience: 'amb_kitchen_loop.wav',
  hover: 'sfx_ui_hover.wav',
  chefSelect: 'sfx_chef_select.wav',
  serviceStart: 'sfx_service_start.wav',
  guestArrival: 'sfx_guest_arrival.wav',
  speechBubble: 'sfx_speech_bubble.wav',
  typeTick: 'sfx_type_tick.wav',
  understand: 'sfx_understand.wav',
  thinkingDots: 'sfx_thinking_dots_loop.wav',
  bubbleExpand: 'sfx_bubble_expand.wav',
  creationReveal: 'sfx_creation_reveal.wav',
  inputFocus: 'sfx_input_focus.wav',
  sendIdea: 'sfx_send_idea.wav',
  aiGuide: 'sfx_ai_guide.wav',
  cookingStart: 'sfx_cooking_start.wav',
  cookingLoop: 'sfx_cooking_loader_loop.wav',
  dishReveal: 'sfx_dish_reveal.wav',
  pageFlip: 'sfx_page_flip.wav',
  fusionButton: 'sfx_fusion_button.wav',
  fusionStart: 'sfx_fusion_start.wav',
  fusionOrbit: 'sfx_fusion_orbit_loop.wav',
  fusionBurst: 'sfx_fusion_burst.wav',
  serveDish: 'sfx_serve_dish.wav',
  guestThinking: 'sfx_guest_thinking.wav',
  satisfied: 'sfx_satisfied.wav',
  scorePop: 'sfx_score_pop.wav',
  rarityReveal: 'sfx_rarity_reveal.wav',
  settlementSlide: 'sfx_settlement_slide.wav',
  nextGuest: 'sfx_next_guest.wav',
  errorSoft: 'sfx_error_soft.wav',
};

const defaultVolumes = {
  ambience: 0.045,
  hover: 0.14,
  typeTick: 0.075,
  cookingLoop: 0.105,
  fusionOrbit: 0.12,
  fusionBurst: 0.36,
  serviceStart: 0.34,
  dishReveal: 0.34,
  satisfied: 0.32,
  errorSoft: 0.22,
};

const cache = new Map();
const loops = new Map();
let unlocked = false;

function getAudio(key) {
  const file = sounds[key];
  if (!file) return null;

  if (!cache.has(key)) {
    const audio = new Audio(`${basePath}${file}`);
    audio.preload = 'auto';
    audio.volume = defaultVolumes[key] ?? 0.32;
    cache.set(key, audio);
  }

  return cache.get(key);
}

export function unlockSound() {
  if (unlocked) return;
  unlocked = true;
  Object.keys(sounds).forEach(getAudio);
}

export function playSound(key, options = {}) {
  const source = getAudio(key);
  if (!source) return;

  const audio = source.cloneNode();
  audio.volume = options.volume ?? defaultVolumes[key] ?? 0.32;
  audio.play().catch(() => {});
}

export function startLoop(key, options = {}) {
  const existing = loops.get(key);
  if (existing) return;

  const audio = getAudio(key)?.cloneNode();
  if (!audio) return;

  audio.loop = true;
  audio.volume = options.volume ?? defaultVolumes[key] ?? 0.2;
  audio.play().catch(() => {});
  loops.set(key, audio);
}

export function stopLoop(key) {
  const audio = loops.get(key);
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  loops.delete(key);
}

export function stopAllLoops() {
  Array.from(loops.keys()).forEach(stopLoop);
}
