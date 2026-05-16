# AI 厨房小游戏交付说明

更新时间：2026-05-16

## 一句话

我们做了一个可以演示的 AI 厨房小游戏：玩家输入脑洞食材，AI 帮忙理解、画菜、融合菜，最后客人给评价。

## 我们已经完成了什么

1. 前端 demo 已经能跑。
2. 已经有 6 个客人。
3. 玩家可以玩两轮创作。
4. 每轮会生成一道菜。
5. 两道菜可以融合成最终料理。
6. 客人会给文字反馈和分数。
7. 没有真实 API 时，也有 mock 兜底，保证能演示。
8. 文本 AI 已接智谱 GLM-4.7-flash。
9. 图片 AI 已接智谱 CogView-3-Flash 云端接口。
10. 本地 Stable Diffusion 不是默认方案了，发行 demo 不需要队友电脑跑本地模型。

## 现在的状态

代码已经改成：

```text
玩家输入
→ 智谱 GLM-4.7-flash 理解内容
→ 智谱 CogView-3-Flash 云端生成图片
→ 智谱 GLM-4.7-flash 生成反馈
```

注意：CogView-3-Flash 不直接支持图生图，融合阶段需要额外配置图生图模型或使用 Stable Diffusion。

## 队友拿到后怎么跑

先装依赖：

```powershell
npm install
cd demo
npm install
cd ..
```

再复制环境文件：

```powershell
copy .env.example .env
```

然后把自己的智谱 AI API Key 填进 `.env`：

```text
ZHIPU_API_KEY=你的key
AI_KITCHEN_USE_MOCK=false
IMAGE_PROVIDER=zhipu
```

启动：

```powershell
npm run dev
```

打开：

```text
http://127.0.0.1:5174/
```

## 如果 API 额度不够

把 `.env` 里这一行改成：

```text
AI_KITCHEN_USE_MOCK=true
```

这样不花钱，也能完整演示流程，只是图片和反馈会走假数据。

## 接下来要做什么

1. 申请智谱 AI API Key 并确认额度。
2. 跑一次真实完整流程：开始营业 → 第 1 轮 → 第 2 轮 → 融合 → 客人反馈。
3. 挑 1 到 2 个最好看的案例截图，放进比赛展示材料。
4. 确认上线前 `.env` 不要发给别人，不要提交真实 key。
5. 最后跑三条检查命令：

```powershell
npm run check
npm test
npm run build:demo
```

## 不要做什么

1. 不要把 `.env` 发到群里。
2. 不要把真实 API Key 写进文档。
3. 不要提交 `node_modules`。
4. 不要再要求每个人本地装 Stable Diffusion。

## 这次交付包里有什么

```text
api/       后端接口和 AI 流程
demo/      前端小游戏 demo
docs/      项目文档
assets/    美术和设定素材
scripts/   检查和启动脚本
tests/     自动测试
.env.example  环境变量模板，没有真实密钥
```

这就是当前能交给队友继续推进的版本。
