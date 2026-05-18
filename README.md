# AI Kitchen Game

AI Kitchen Game 是一个 AI 产品设计大赛项目：玩家面对带有抽象情绪需求的客人，用文字输入创意食材概念，系统通过大模型生成像素风料理，并让客人给出情感反馈和数值评价。

当前项目已经进入可演示 demo 收口阶段。仓库 `main` 分支是 Vercel 部署来源，也是前后端协作的主线；远端协作者的多轮对话修改已经合并，本地的前端体验、美术素材、音效、mock fallback 和真实 AI 接入骨架也已经推送到 GitHub。

## 当前能力

- 6 个情绪客人：失恋、加班、旅行、观星、上台紧张、记忆唤醒。
- 多轮灵感对话：AI 可以继续追问，直到灵感足够进入生成流程。
- 两轮料理创作：生成两道情绪料理，再融合成最终料理。
- 客人反馈：根据料理概念生成文字反馈、满意度、创意度和稀有度评分。
- 美术与音效：包含像素风角色、菜品预设、到店页素材、Pot-kun UI 和本地音效。
- 双运行模式：默认 mock 可稳定演示；配置 key 后可切到智谱 GLM-4.7-flash + CogView-3-Flash。

## 技术栈

- 前端：React + Tailwind CSS + Vite
- 后端：Vercel Serverless API routes + Node.js
- 文本模型：智谱 GLM-4.7-flash
- 图像模型：智谱 CogView-3-Flash
- 可选本地生图：Stable Diffusion WebUI
- 兜底策略：Mock API，保证无真实 key 时也能完整跑完 demo

## 快速开始

```powershell
npm install
cd demo
npm install
cd ..
npm run check
npm run dev
```

本地默认地址：

- Demo 前端：http://127.0.0.1:5174
- Mock API：http://127.0.0.1:3001

## 常用命令

```powershell
npm run check       # 检查关键目录、文档、环境模板和依赖状态
npm test            # 运行 Node mock/service 测试
npm run build:demo  # 构建 React + Vite demo
npm run dev:api     # 只启动本地 API mock
npm run dev:demo    # 只启动 demo 前端
npm run dev         # 同时启动 API mock 和 demo 前端
npm run check:ai    # 检查 AI 环境变量配置
npm run check:ai:live # 实际测试智谱 GLM 连通性
```

## AI 配置

没有真实 key 时保持默认 mock 模式即可：

```bash
AI_KITCHEN_USE_MOCK=true
```

需要真实调用智谱时，复制 `.env.example` 为 `.env`，填入：

```bash
ZHIPU_API_KEY=你的智谱AI_APIKey
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_MODEL=glm-4.7-flash

IMAGE_PROVIDER=zhipu
ZHIPU_IMAGE_MODEL=cogview-3-flash
ZHIPU_IMAGE_SIZE=1024x1024
ZHIPU_IMAGE_QUALITY=standard

AI_KITCHEN_USE_MOCK=false
AI_KITCHEN_REQUEST_TIMEOUT_MS=60000
AI_KITCHEN_RETRY_COUNT=1
AI_KITCHEN_SESSION_TTL_MS=1800000
```

真实密钥只放本地 `.env` 或 Vercel Environment Variables，不要提交到 Git。详细交接见 [docs/AI接口获取与前后端交接书.md](docs/AI接口获取与前后端交接书.md)。

## API 概览

前端优先使用 session API：

- `POST /api/v1/sessions`：创建一局 session。
- `POST /api/v1/sessions/:id/chat`：多轮灵感对话，判断是否进入生成。
- `POST /api/v1/sessions/:id/rounds`：提交一轮创作并生成料理。
- `POST /api/v1/sessions/:id/fusion`：融合两道料理。
- `POST /api/v1/sessions/:id/feedback`：生成客人反馈与评分。
- `GET /api/v1/health`：检查 AI 配置状态。

旧版兼容接口仍保留：`/guide`、`/dishes`、`/fusions`、`/feedback`。

## 部署

项目已经配置 `vercel.json`：

- 构建命令：`cd demo && npm install && npm run build`
- 输出目录：`demo/dist`
- `/api/*` 请求走仓库内的 Vercel API routes
- 其他路径回退到前端 `index.html`

协作时以 GitHub `main` 为准：先拉取远端修改，在本地完成前后端整合和验证，再 push 到 `main`，由 Vercel 接收 GitHub commit 自动部署。

## 目录地图

- `docs/`：产品、玩法、美术、接口、计划和展示文档。
- `demo/`：可运行的 React + Tailwind demo。
- `api/`：Vercel 风格 API routes、AI pipeline、mock service 和 session store。
- `assets/`：像素风美术素材、音效和 manifest。
- `scripts/`：本地开发、健康检查、素材生成等工具脚本。
- `tests/`：mock 服务与关键 AI pipeline 测试。

## 协作入口

- 环境和运行方式：[docs/工作环境指南.md](docs/工作环境指南.md)
- 当前优先级：[docs/协作看板.md](docs/协作看板.md)
- 展示脚本：[docs/比赛展示脚本.md](docs/比赛展示脚本.md)
- 后端与 mock 策略：[docs/后端接口与Mock策略.md](docs/后端接口与Mock策略.md)
