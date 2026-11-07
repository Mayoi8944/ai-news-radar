# ⚡ AI Pulse Radar (一手科技前沿雷达)

> 全天候自动追踪全球顶尖实验室与一手信源（OpenAI、Google DeepMind、Hugging Face、GitHub Trending、Reddit r/LocalLLaMA），基于 **Google AI Studio (Gemini Flash)** 自动进行去重、翻译并提炼 3 点硬核技术突破。

![UI Style](https://img.shields.io/badge/Theme-Obsidian%20Dark-cyan)
![Powered by](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-blue)
![Deployment](https://img.shields.io/badge/Deploy-Vercel%20%2B%20GitHub%20Actions-black)

---

## 🌟 核心特性

- 🎯 **打破信息差**：直采第一手源头发布，拒绝二手营销号清洗与阉割。
- 🤖 **Gemini 智能省流**：保留原生英文标题对照，自动提炼 3 条参数级硬核技术事实（TL;DR）。
- ⏱️ **动态脉冲时间轴**：现代黑曜石质感界面，支持脉冲节点、实时搜索与标签筛选。
- 🔄 **全天候无人值守**：GitHub Actions 定时静默抓取与提炼，自动推送到 Vercel 实现秒开渲染，全程 0 服务器费用。

---

## 🛠️ 本地运行指南

### 1. 克隆与安装依赖
```bash
# 1. 安装前端依赖
npm install

# 2. 安装 Python 采集依赖
pip install -r scripts/requirements.txt
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env`：
```env
GEMINI_API_KEY=你的Google_AI_Studio_Key
GEMINI_MODEL=gemini-flash-lite-latest
```

### 3. 本地运行
```bash
# 抓取并生成最新资讯
python scripts/pipeline.py

# 启动前端本地预览
npm run dev
```
打开浏览器访问 `http://localhost:5173/`。

---

## 🚀 部署到 GitHub & Vercel（全自动化）

### 第一步：推送到你的 GitHub 仓库
在 GitHub 上新建一个仓库（例如 `ai-news-radar`），然后运行：
```bash
git remote add origin https://github.com/你的用户名/ai-news-radar.git
git branch -M main
git push -u origin main
```

### 第二步：配置 GitHub Secrets（供自动化定时使用）
1. 打开 GitHub 仓库页面，点击 **Settings** -> **Secrets and variables** -> **Actions**。
2. 点击 **New repository secret**：
   - Name: `GEMINI_API_KEY`
   - Value: `你的Google_AI_Studio_Key`
3. 仓库权限设置：进入 **Settings** -> **Actions** -> **General**，找到 **Workflow permissions**，勾选 **Read and write permissions**，保存。

### 第三步：在 Vercel 导入
1. 打开 [Vercel 控制台](https://vercel.com)。
2. 点击 **Add New...** -> **Project**，导入刚推送的 `ai-news-radar` 仓库。
3. Framework Preset 选择 **Vite**，点击 **Deploy** 即可！
4. 部署完成后，你将获得一个全球免费的专属域名（如 `https://your-radar.vercel.app`）。
