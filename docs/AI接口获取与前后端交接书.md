# AI 接口获取与前后端交接书

更新时间：2026-05-16

## 目标

本项目要接通一条自动化 AI 料理生成链路：

```text
玩家第 1 轮输入
→ 智谱 GLM-4.7-flash 理解情绪与视觉概念
→ 智谱 CogView-3-Flash 云端生成菜品图 1
→ 玩家第 2 轮输入
→ 智谱 GLM-4.7-flash 理解更深概念
→ 智谱 CogView-3-Flash 云端生成菜品图 2
→ 图生图模型融合最终料理（待定）
→ 智谱 GLM-4.7-flash 生成客人反馈与评分
```

当前代码已实现后端 pipeline、session API、mock fallback 和前端最小接入。现在需要补齐真实模型服务的账号、权限和运行地址。

2026-05-16 更新：已新增 API 接入健康检查：

- `GET /api/v1/health`：查看当前配置，不发起远程调用。
- `GET /api/v1/health?live=true`：实际测试智谱 GLM，并验证当前图像提供方配置。
- `npm run check:ai`：命令行查看配置状态。
- `npm run check:ai:live`：命令行实际连通性测试。云端图像生成会在真实游戏流程中产生费用，因此健康检查只做配置校验。

## 需要你获取的内容

### 1. 智谱 GLM-4.7-flash API

用途：

- 对话引导
- 情绪理解
- 关键词/概念提取
- 结构化 JSON 输出
- 生图 prompt 生成
- 客人反馈生成

需要提供到 `.env` 的变量：

```bash
ZHIPU_API_KEY=
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_MODEL=glm-4.7-flash
```

你需要操作：

1. 注册/登录智谱 AI 开放平台：https://open.bigmodel.cn
2. 进入控制台，创建 API Key。
3. 确认账号有调用 GLM-4.7-flash 模型的权限。
4. 将 API Key 填入项目根目录 `.env`，不要提交到 Git。

官方参考：

- 智谱 AI 开放平台：https://open.bigmodel.cn
- API 文档：https://open.bigmodel.cn/dev/api

### 2. 智谱 CogView-3-Flash 图像 API

用途：

- 文生图：生成菜品图 1 和菜品图 2
- 云端运行：适合发行 demo，不依赖本机 GPU 或本地 WebUI
- 注意：CogView-3-Flash 不直接支持图生图，融合阶段需要额外配置

需要提供到 `.env` 的变量：

```bash
IMAGE_PROVIDER=zhipu
ZHIPU_IMAGE_MODEL=cogview-3-flash
ZHIPU_IMAGE_SIZE=1024x1024
ZHIPU_IMAGE_QUALITY=standard
```

你需要操作：

1. 使用同一个智谱 AI API Key。
2. 确认账号有调用 CogView-3-Flash 模型的权限和可用额度。

官方参考：

- CogView API 文档：https://open.bigmodel.cn/dev/api/image/cogview-3

### 3. 可选：Stable Diffusion WebUI 本地模式

本地 SD WebUI 仅建议作为开发备用，不作为发行版默认方案。若要切回本地：

```bash
IMAGE_PROVIDER=sd-webui
SD_WEBUI_BASE_URL=http://127.0.0.1:7860
SD_WEBUI_USERNAME=
SD_WEBUI_PASSWORD=
PIXELRTXL_CHECKPOINT=
SD_FUSION_CHECKPOINT=
```

### 4. Runtime 配置

真实调用 AI 时：

```bash
AI_KITCHEN_USE_MOCK=false
AI_KITCHEN_REQUEST_TIMEOUT_MS=60000
AI_KITCHEN_RETRY_COUNT=1
AI_KITCHEN_SESSION_TTL_MS=1800000
```

演示兜底 / 没有 key 时：

```bash
AI_KITCHEN_USE_MOCK=true
```

## 推荐 `.env` 模板

复制 `.env.example` 为 `.env`，然后填写：

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

## 后端已提供的 API

前端优先使用 session API：

- `POST /api/v1/sessions`
  - 创建一局 session。
  - 输入：`{ "guestId": "heartbreak" }`
  - 输出：`sessionId`、客人信息、第一句 prompt。

- `POST /api/v1/sessions/:id/rounds`
  - 提交玩家一轮输入。
  - 第 1 次调用生成菜品 1；第 2 次调用生成菜品 2。
  - 输入：`{ "playerInput": "初恋下午的阳光和透明糖霜" }`
  - 输出：`concepts`、`dish`、`nextPrompt`、session 状态。

- `POST /api/v1/sessions/:id/fusion`
  - 融合两道菜。
  - 输出：`finalDish`。

- `POST /api/v1/sessions/:id/feedback`
  - 生成客人反馈与评分。
  - 输出：`feedback`。

旧接口仍保留兼容：

- `POST /api/v1/guide`
- `POST /api/v1/dishes`
- `POST /api/v1/fusions`
- `POST /api/v1/feedback`

## 前端对接说明

前端只需要关心这些字段：

```js
dish = {
  id,
  name,
  ingredient,
  motion,
  imageUrl,
  prompt,
  concepts,
  status
}

feedback = {
  text,
  scores: {
    satisfaction,
    creativity,
    rarity
  },
  rarity
}
```

如果 `dish.imageUrl` 存在，前端展示真实生成图片；如果不存在，继续展示当前 CSS 占位菜品。

## 全栈统筹注意事项

1. 本轮不接数据库，session 存在后端内存 `Map` 中，适合本地 demo 和短时演示。
2. 图片先用 `data:image/png;base64,...` 返回，后续如需线上稳定部署，应接对象存储。
3. Vercel Serverless 可能受执行时长影响；如果真实生图超过平台限制，应升级为任务队列 + 轮询。
4. `AI_KITCHEN_USE_MOCK=true` 是比赛演示兜底，不能删除。
5. 所有密钥只放 `.env`，不要写入文档、聊天记录或 Git。

## 联调步骤

1. 复制 `.env.example` 为 `.env`。
2. 填写 Qwen 和 DashScope 万相配置。
3. 确认阿里云百炼账号有可用额度。
4. 先检查配置：

```powershell
npm run check:ai
```

5. 再检查真实连通性：

```powershell
npm run check:ai:live
```

6. 启动项目：

```powershell
npm run dev
```

7. 打开：

```text
http://127.0.0.1:5174/
```

8. 走完整流程：

```text
开始营业
→ 第 1 轮输入
→ 生成菜品 1
→ 第 2 轮输入
→ 生成菜品 2
→ 融合
→ 端给客人
→ 查看反馈
```

9. 验证：

```powershell
npm run check
npm run check:ai
npm test
npm run build:demo
```

如果 `npm run check:ai:live` 失败，优先看：

- Qwen 失败：确认 `QWEN_API_KEY` 是否填入 `.env`，账号是否开通百炼模型服务，`QWEN_BASE_URL` 是否为兼容模式地址。
- DashScope 图像失败：确认 `IMAGE_PROVIDER=dashscope`，账号是否有万相图像模型权限和可用额度。
- 如切回本地 SD：确认 WebUI 是否用 `--api` 启动，`SD_WEBUI_BASE_URL` 是否能打开 `/docs`，如设置了用户名密码需同步填写。

## 你需要回填给后端的信息

请不要把真实 key 发到群里或提交到 Git。你只需要完成 `.env` 填写，然后告诉后端：

```text
Qwen API Key 已填
DashScope 图像额度可用
IMAGE_PROVIDER=dashscope
```

后端收到后负责做连通性测试、修参数、确认完整流程。
