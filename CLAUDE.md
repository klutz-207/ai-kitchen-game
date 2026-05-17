# AI游戏设计大赛项目

## 项目概述
参加AI产品设计大赛（截止2026-05-14），设计一个AI厨房游戏。

## 核心玩法
- 客人提出抽象情感需求（如"想要甜的东西"）
- 玩家通过文字输入创意食材概念
- 大模型生成像素风格动态菜品图片
- 客人给出情感反馈和数值评价

## 技术栈
- 前端：React + Tailwind CSS + Vite demo
- 后端：Vercel Serverless API routes + Node.js
- 大模型：智谱 GLM-4.7-flash（文本理解/反馈）+ CogView-3-Flash（云端图像生成），Stable Diffusion WebUI 作为可选图生图/本地方案
- 兜底：Mock API，保证无真实 key 时也能完整演示
- 部署：Vercel（前端与轻 API），真实生图服务建议本地或独立 GPU 服务

## 项目结构
```
docs/           - 设计文档
demo/           - React 可演示前端
api/            - API routes 与 AI/mock pipeline
assets/         - 设计素材
scripts/        - 工具脚本
tests/          - Node mock/service 测试
```

## 当前状态
可演示 demo 收口阶段。已具备 6 个客人、两轮创作、两道菜生成、融合、客人反馈、mock fallback、真实 AI 接入骨架和基础测试。
