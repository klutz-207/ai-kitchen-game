# 「料理厨神，只剩个锅」UI 素材使用说明

这组素材是透明底 PNG，配套保留 SVG 源文件，风格对齐当前 demo 的暖色像素厨房：奶油底、木质厚边、珊瑚红强调、少量叶片和星光点缀。

## 路径

源素材目录：

```text
assets/art-library/ui/title-kit/
```

demo 可直接引用目录：

```text
demo/public/assets/art-library/ui/title-kit/
```

在 React/Vite 里推荐用 public 路径：

```jsx
<img
  src="/assets/art-library/ui/title-kit/title-logo-mascot.png"
  alt="料理厨神，只剩个锅"
  className="pixelated game-title-logo"
/>
```

## 素材清单

| 文件 | 用途 | 推荐显示尺寸 |
| --- | --- | --- |
| `title-logo-mascot.png` | 首屏主 logo，最推荐。锅仔在上、标题在中、标语在下，适合开场页或宣传截图。 | 宽 360-620px |
| `title-lockup-large.png` | 横版主标题，适合宽屏顶部、开场面板、结算页标题。 | 宽 420-760px |
| `title-lockup-compact.png` | 紧凑横版标题，适合移动端、窄面板、弹窗顶部。 | 宽 300-520px |
| `pot-mark.png` | 锅仔图标/吉祥物，可用于 loading、favicon 参考、空状态。 | 64-180px |
| `only-pot-badge.png` | 「只剩个锅」小徽章，可用于章节标题、角标、活动标签。 | 宽 180-360px |
| `start-cauldron-button.png` | 开始按钮视觉素材，可作为图片按钮或按钮内装饰。 | 宽 220-420px |
| `service-ribbon.png` | 「灵感下锅」丝带，可用于创作阶段、输入区标题。 | 宽 220-420px |
| `kitchen-ticket.png` | 票据说明牌，适合规则提示、小教程、等待状态。 | 宽 220-380px |
| `steam-sparkles.png` | 蒸汽和星光装饰，可叠在锅、菜品生成、融合动画附近。 | 宽 90-220px |

预览图：

```text
ai-kitchen-previews/title-kit-preview.png
```

## 使用建议

1. 首屏主标题优先用 `title-logo-mascot.png`，不要再额外叠中文标题文字，避免信息重复。
2. 移动端首屏建议改用 `title-lockup-compact.png`，或把 `title-logo-mascot.png` 宽度控制在 `min(86vw, 420px)`。
3. 所有素材都是透明 PNG，可以直接叠在背景图、面板、按钮上。
4. CSS 里继续保留 `image-rendering: pixelated;`，但 logo 类素材不要放大到超过原图太多，否则中文字边缘会显粗。
5. 背景图不要烘入顶部白色「AI厨房」栏；当前 demo 已在 CSS 末尾强制隐藏 `.topbar`，素材本身也不包含这条栏。
6. 如果需要改字、改颜色或调整锅仔位置，修改 `scripts/generate-title-kit.cjs` 后运行：

```powershell
node scripts\generate-title-kit.cjs
```

脚本会同时更新：

```text
assets/art-library/ui/title-kit/
demo/public/assets/art-library/ui/title-kit/
ai-kitchen-previews/title-kit-preview.png
```

## 示例 CSS

```css
.game-title-logo {
  display: block;
  width: min(620px, 88vw);
  height: auto;
  image-rendering: pixelated;
  filter: drop-shadow(0 16px 18px rgba(60, 34, 22, 0.22));
}

.pot-loading-mark {
  width: 104px;
  height: auto;
  image-rendering: pixelated;
}
```
