# AI Kitchen Game Workspace

这是 AI 产品设计大赛项目的工作入口。项目目标是在 2026-05-14 前完成一个可演示的 AI 厨房游戏：客人提出抽象情感需求，玩家输入创意食材概念，AI 生成像素风动态菜品，客人给出情感反馈和数值评价。

## 快速开始

```powershell
npm install
cd demo
npm install
cd ..
npm run check
npm run dev
```

本地开发默认地址：

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
```

## 目录地图

- `docs/`：产品、玩法、美术、接口、计划等设计文档。
- `demo/`：当前可运行的 React + Tailwind demo。
- `api/`：Vercel 风格 API routes 与本地 mock 服务。
- `assets/`：像素风美术素材与 manifest。
- `scripts/`：本地开发、文档生成、健康检查等脚本。
- `tests/`：mock 服务与关键逻辑测试。

## 当前 demo 能力

- 6 个情绪客人：失恋、加班、旅行、观星、上台紧张、记忆唤醒。
- 两轮文字创作：每轮生成一道情绪料理。
- 融合与反馈：两道菜融合为最终料理，客人给出文字反馈和评分。
- 双链路：默认 mock 稳定演示，可切换 Qwen Flash + Stable Diffusion WebUI / PixelRTXL 真实链路。
- 展示材料：[docs/比赛展示脚本.md](docs/比赛展示脚本.md)。

## 协作方式

先看 [docs/工作环境指南.md](docs/工作环境指南.md)，再按 [docs/协作看板.md](docs/协作看板.md) 认领下一步。需要 Codex 接手时，尽量说明目标、文件范围、验收方式；我会优先复用现有文档和脚本，保持改动可回看、可验证。
