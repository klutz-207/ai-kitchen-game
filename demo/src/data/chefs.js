const chefBase = '/assets/art-library/characters/chefs/slices';
const avatarBase = '/assets/art-library/characters/chefs/avatars';

export const chefs = [
  {
    id: 'classic-red',
    name: '红围巾主厨',
    description: '经典高帽，适合稳重的试营业开场。',
    accent: '#ef6b5b',
    avatar: `${avatarBase}/chef-classic-red-avatar.png`,
    actions: {
      idle: `${chefBase}/chef-classic-red-idle.png`,
      explain: `${chefBase}/chef-classic-red-explain.png`,
      thinking: `${chefBase}/chef-classic-red-thinking.png`,
    },
  },
  {
    id: 'cozy-green',
    name: '绿围裙主厨',
    description: '温暖放松，像会认真听客人说完的人。',
    accent: '#4aa36f',
    avatar: `${avatarBase}/chef-cozy-green-avatar.png`,
    actions: {
      idle: `${chefBase}/chef-cozy-green-idle.png`,
      explain: `${chefBase}/chef-cozy-green-explain.png`,
      thinking: `${chefBase}/chef-cozy-green-thinking.png`,
    },
  },
  {
    id: 'bakery-pink',
    name: '粉烘焙主厨',
    description: '甜点气质更强，画面会更轻盈。',
    accent: '#e58aaa',
    avatar: `${avatarBase}/chef-bakery-pink-avatar.png`,
    actions: {
      idle: `${chefBase}/chef-bakery-pink-idle.png`,
      explain: `${chefBase}/chef-bakery-pink-explain.png`,
      thinking: `${chefBase}/chef-bakery-pink-thinking.png`,
    },
  },
];

export const defaultChef = chefs[0];
