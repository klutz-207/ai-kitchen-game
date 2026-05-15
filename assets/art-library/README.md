# 美术素材库

本目录用于集中管理当前 demo 可用的美术素材。素材风格遵循 `docs/美术风格定义.md`：

```text
温暖手绘感像素童话厨房风
cozy hand-drawn pixel art
storybook pixel art
warm Nintendo Switch indie game style
transparent background game asset
```

## 目录结构

```text
assets/art-library/
  backgrounds/  背景图
  characters/   角色素材
  ui/           对话框、按钮、面板等 UI 素材表
  effects/      蒸汽、星星、融合光效等特效素材表
  sources/      原始生图源文件或抠图前 chroma-key 文件
```

为了让 demo 前端可以直接调用，当前素材也同步到了：

```text
demo/public/assets/art-library/
```

前端可使用 `/assets/art-library/...` 路径引用。

---

## 当前素材

### 背景图

```text
backgrounds/kitchen-main.png
```

用途：主厨房场景背景。适合客人到来、主厨站位、菜品展示等阶段。

前端路径：

```text
/assets/art-library/backgrounds/kitchen-main.png
```

规格：

```text
1672x941
PNG
横向 16:9 近似比例
不透明背景
```

```text
backgrounds/creation-thought-space.png
```

用途：创作/思考/对话阶段背景。中间留有较干净区域，适合叠加聊天面板和输入框。

前端路径：

```text
/assets/art-library/backgrounds/creation-thought-space.png
```

规格：

```text
1672x941
PNG
横向 16:9 近似比例
不透明背景
```

### 主厨角色

当前有三位主厨角色，每张图都是同一角色的 3 个动作横向素材表。角色统一为斜后方视角，朝右前方看向顾客，手中不拿菜品。

```text
characters/chefs/chef-classic-red-actions.png
```

用途：经典白色厨师服 + 高厨师帽 + 红围巾/红围裙主厨。

前端路径：

```text
/assets/art-library/characters/chefs/chef-classic-red-actions.png
```

规格：

```text
1717x916
PNG
透明背景
横向三动作素材表
```

```text
characters/chefs/chef-cozy-green-actions.png
```

用途：绿色长衣 + 头巾 + 黄色围巾 + 白围裙主厨。

前端路径：

```text
/assets/art-library/characters/chefs/chef-cozy-green-actions.png
```

规格：

```text
1760x894
PNG
透明背景
横向三动作素材表
```

```text
characters/chefs/chef-bakery-pink-actions.png
```

用途：粉色蝴蝶结 + 蓬松厨师帽 + 深棕围裙主厨。

前端路径：

```text
/assets/art-library/characters/chefs/chef-bakery-pink-actions.png
```

规格：

```text
1774x887
PNG
透明背景
横向三动作素材表
```

### 主厨头像

三位主厨各有一张正面 1:1 小头像，适合用于角色选择、对话头像、状态栏或 debug 面板。

```text
characters/chefs/avatars/chef-classic-red-avatar.png
characters/chefs/avatars/chef-cozy-green-avatar.png
characters/chefs/avatars/chef-bakery-pink-avatar.png
```

前端路径：

```text
/assets/art-library/characters/chefs/avatars/chef-classic-red-avatar.png
/assets/art-library/characters/chefs/avatars/chef-cozy-green-avatar.png
/assets/art-library/characters/chefs/avatars/chef-bakery-pink-avatar.png
```

规格：

```text
1254x1254
PNG
透明背景
正面头像
```

### 客人角色

```text
characters/guests/guest-heartbroken-girl.png
```

用途：第一位流程测试客人，哭红眼睛的失恋女生。

角色设定：

```text
哭红眼睛的失恋女生：
“哭了一整晚，心里又咸又苦，能不能给我一份能盖住所有难过的味道。”
```

引导词：

```text
我来给她加点狠料……
os: 或许我可以把榴莲、腐乳、臭豆腐拼起来试一试呢
```

前端路径：

```text
/assets/art-library/characters/guests/guest-heartbroken-girl.png
```

规格：

```text
1024x1536
PNG
透明背景
正面偏斜视角
面向左前方，适合放在屏幕右侧看向主厨
```

### UI 素材表

```text
ui/ui-dialogue-sheet.png
```

内容：

```text
左尾巴对话气泡
右尾巴对话气泡
思考气泡
羊皮纸对话面板
订单标签
姓名牌
提示气泡
```

前端路径：

```text
/assets/art-library/ui/ui-dialogue-sheet.png
```

规格：

```text
1774x887
PNG
透明背景
```

```text
ui/ui-controls-sheet.png
```

内容：

```text
按钮框
开始按钮框
融合按钮框
配方托盘
评分条
稀有度徽章
圆形图标框
物品槽
```

前端路径：

```text
/assets/art-library/ui/ui-controls-sheet.png
```

规格：

```text
1663x946
PNG
透明背景
```

### 特效素材表

```text
effects/effects-kitchen-sheet.png
```

内容：

```text
蒸汽
星星
融合光效
烹饪粉尘
爱心反馈
面粉烟雾
香气轨迹
上菜光迹
```

前端路径：

```text
/assets/art-library/effects/effects-kitchen-sheet.png
```

规格：

```text
1774x887
PNG
透明背景
```

---

## 前端调用示例

### 作为背景图

```tsx
<section
  className="game-scene"
  style={{
    backgroundImage: 'url("/assets/art-library/backgrounds/kitchen-main.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  ...
</section>
```

### 作为普通图片

```tsx
<img
  src="/assets/art-library/characters/chefs/chef-classic-red-actions.png"
  alt=""
  className="pixelated"
/>
```

### 使用客人立绘

```tsx
<img
  src="/assets/art-library/characters/guests/guest-heartbroken-girl.png"
  alt="哭红眼睛的失恋女生"
  className="h-[68vh] object-contain pixelated"
/>
```

### 临时使用主厨整张动作表

如果只是先把素材放进页面看风格，可以直接整张图展示：

```tsx
<img
  src="/assets/art-library/characters/chefs/chef-cozy-green-actions.png"
  alt="主厨动作素材"
  className="w-full max-w-xl object-contain pixelated"
/>
```

正式使用时建议把三动作素材表切成单个动作 PNG，例如：

```text
chef-classic-red-idle.png
chef-classic-red-explain.png
chef-classic-red-thinking.png
```

### 使用主厨头像

```tsx
<img
  src="/assets/art-library/characters/chefs/avatars/chef-classic-red-avatar.png"
  alt="经典红围裙主厨头像"
  className="size-16 rounded-full object-contain pixelated"
/>
```

### 像素渲染建议

```css
.pixelated {
  image-rendering: pixelated;
}
```

---

## 备注

当前 UI 和特效素材还是“素材表”形式，适合先做风格统一和视觉取样。进入正式开发时，可以进一步切分为单个 PNG，例如：

```text
ui/dialogue-left.png
ui/dialogue-right.png
ui/thought-bubble.png
effects/steam-01.png
effects/sparkle-01.png
```

如果需要做九宫格缩放按钮或对话框，建议后续单独产出可拉伸边框素材。
