# 后端接口与 Mock 策略

## 当前目标

当前 demo 后端采用 Vercel Serverless API 形态，支持两套运行方式：

1. `AI_KITCHEN_USE_MOCK=true`：使用本地 Mock，保证没有模型 key 时也能完整演示。
2. `AI_KITCHEN_USE_MOCK=false`：使用智谱 GLM-4.7-flash + CogView-3-Flash 的真实 AI cuisine pipeline。

真实 pipeline 的顺序是：

```text
创建 session
→ 第 1 轮玩家输入
→ 智谱 GLM-4.7-flash 提取情绪/视觉概念并生成 image prompt
→ 智谱 CogView-3-Flash 生成菜品 1
→ 第 2 轮玩家输入
→ 智谱 GLM-4.7-flash 提取更深概念并生成 image prompt
→ 智谱 CogView-3-Flash 生成菜品 2
→ 图生图模型融合两张图（待定）
→ 智谱 GLM-4.7-flash 生成客人反馈
```

注意：CogView-3-Flash 不直接支持图生图，融合阶段需要额外配置图生图模型或使用 Stable Diffusion。

## API 约定

所有接口成功时返回：

```json
{ "ok": true, "data": {} }
```

失败时返回：

```json
{ "ok": false, "error": { "code": "validation_error", "message": "guestId is required." } }
```

## 接口列表

- `GET /api/v1/guests`：返回客人列表
- `POST /api/v1/sessions`：创建一局游戏 session
- `POST /api/v1/sessions/:id/rounds`：提交一轮玩家输入，生成对应菜品
- `POST /api/v1/sessions/:id/fusion`：融合两道菜为最终料理
- `POST /api/v1/sessions/:id/feedback`：生成客人反馈和评分
- `POST /api/v1/guide`：输入 `guestId`、`round`，返回引导话术
- `POST /api/v1/dishes`：输入 `guestId`、`answers`、`index`，返回单道菜
- `POST /api/v1/fusions`：输入 `guestId`、`dish1`、`dish2`，返回最终融合料理
- `POST /api/v1/feedback`：输入 `guestId`、`answers`、`finalDish`，返回客人反馈和评分

## 前端联调

前端统一通过 `demo/src/services/apiClient.js` 调用 API。普通 `vite dev` 环境下如果 `/api/v1/*` 不可用，会自动退回 `mockAgents.js`，保证 demo 仍可完整跑通。

本地真实 API 联调推荐开两个终端：

```bash
npm run dev:api
cd demo && npm run dev
```

此时页面地址为 `http://127.0.0.1:5174/`，Vite 会把 `/api` 代理到 `http://127.0.0.1:3001/`。

## Prompt Skill Layer

后端会自动读取这些项目风格来源，并注入到每次 LLM、txt2img 和 img2img prompt 中：

- `docs/美术风格定义.md`
- `docs/美术实现规范.md`
- `assets/art-library/manifest.json`

这层逻辑位于 `api/_lib/prompt-skill.js` 和 `api/_lib/style-context.js`。

## 真实模型配置

复制 `.env.example` 为 `.env`，至少配置：

```bash
ZHIPU_API_KEY=
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_MODEL=glm-4.7-flash
IMAGE_PROVIDER=zhipu
ZHIPU_IMAGE_MODEL=cogview-3-flash
AI_KITCHEN_USE_MOCK=false
```

如果需要使用 Stable Diffusion WebUI 进行图生图融合，配置：

```bash
IMAGE_PROVIDER=sd-webui
SD_WEBUI_BASE_URL=http://127.0.0.1:7860
PIXELRTXL_CHECKPOINT=你的PixelRTXL模型名称
SD_FUSION_CHECKPOINT=你的融合模型名称
```

## 后续替换服务的位置

如果后续改用 ComfyUI 或独立图片服务，优先替换：

- `api/_lib/sd-client.js`

如果后续改用其他文本模型，优先替换：

- `api/_lib/llm-client.js`

外部 API shape 保持不变，避免影响前端。
