# 溯泠 AI 工具室

> 一个用心筛选与评测的 AI 工具导航站，覆盖 AI 对话、绘画、编程、设计、营销、办公、视频、音频、搜索全场景，附深度评测与官网直达。

纯静态网站，零后端依赖，可直接部署到 GitHub Pages、Vercel、Netlify、Cloudflare Pages 等任意静态托管平台。

## ✨ 功能特性

- **精选工具库**：内置 30+ 款真实 AI 工具，每个都附核心功能、优缺点与编辑评测
- **多维筛选**：按分类、价格（免费 / Freemium / 付费）筛选
- **智能搜索**：支持中英文，按名称、描述、功能、优点全文检索
- **灵活排序**：按评分或名称排序
- **详情模态框**：点击卡片查看完整评测，键盘 ESC / 点击遮罩可关闭
- **深色 / 浅色模式**：自动跟随系统，可手动切换并记忆偏好
- **响应式布局**：手机 1 列、平板 2 列、桌面 3-4 列自适应
- **SEO 优化**：语义化 HTML、Meta 标签、Open Graph、JSON-LD 结构化数据
- **零依赖**：仅使用 Tailwind CDN，无需构建工具
- **无障碍**：跳转链接、ARIA 标签、键盘导航、reduced-motion 支持

## 📁 项目结构

```
ai-nav/
├── index.html       # 首页（导航 / Hero / 分类 / 工具网格 / 关于 / 底部）
├── blog.html        # 评测博客列表页
├── tools.json       # 工具数据源（30+ 真实 AI 工具）
├── app.js           # 核心逻辑（加载 / 筛选 / 搜索 / 排序 / 详情 / 主题）
├── style.css        # 自定义样式（渐变 / 毛玻璃 / 深浅色 / 响应式）
└── README.md        # 项目说明（本文件）
```

## 🚀 本地预览

由于 `app.js` 使用 `fetch` 加载 `tools.json`，直接双击 HTML 打开会因 `file://` 协议限制而无法加载数据。请使用任意静态服务器预览：

**方式一：Python（已安装）**
```bash
cd tools/ai-nav
python -m http.server 8080
# 浏览器访问 http://localhost:8080
```

**方式二：Node.js**
```bash
cd tools/ai-nav
npx serve .
# 或 npx http-server -p 8080
```

**方式三：VS Code**
安装 `Live Server` 扩展，右键 `index.html` → `Open with Live Server`。

## 🌐 部署到 GitHub Pages

### 1. 创建 GitHub 仓库
新建一个公开仓库，例如 `ai-nav`，将本项目所有文件推送至仓库根目录（或 `docs/` 子目录）。

### 2. 推送代码
```bash
git init
git add .
git commit -m "feat: 初始化溯泠 AI 工具室导航站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/ai-nav.git
git push -u origin main
```

### 3. 开启 GitHub Pages
进入仓库 `Settings` → `Pages`：
- **Source** 选择 `Deploy from a branch`
- **Branch** 选择 `main`，文件夹选 `/ (root)`（若代码在 `docs/` 下则选 `/docs`）
- 点击 `Save`

等待 1-2 分钟，站点将通过 `https://<你的用户名>.github.io/ai-nav/` 访问。

> ⚠️ 若部署在子路径（如 `/ai-nav/`），`tools.json` 的相对路径 `fetch("tools.json")` 已经兼容，无需修改。`index.html` 中的 canonical 与 og:url 占位为 `https://eeyzs1.github.io/ai-nav/`，请替换为你的实际域名。

### 4.（可选）自定义域名
在 `Pages` 设置中添加 Custom domain，并在域名 DNS 添加 CNAME 记录指向 `<你的用户名>.github.io`。

## ➕ 如何添加新工具

所有工具数据集中在 `tools.json`，按以下格式追加一条记录即可，无需改动其他文件：

```json
{
  "id": "unique-id",            // 唯一 ID，建议用英文短横线，如 "notion-ai"
  "name": "工具名称",            // 显示名称，支持中文
  "description": "一句话描述",    // 卡片上的简介，建议 30-60 字
  "category": "AI对话",          // 分类，需与现有分类一致：AI对话/AI图片/AI编程/AI设计/AI营销/AI办公/AI视频/AI音频/AI搜索
  "pricing": "freemium",        // 价格模式：free / paid / freemium
  "rating": 4.5,                // 评分 0-5，支持一位小数
  "url": "https://example.com", // 官网地址，必须真实有效
  "features": ["功能1", "功能2"],// 核心功能列表，3-5 项
  "pros": ["优点1", "优点2"],    // 优点列表，2-4 项
  "cons": ["不足1", "不足2"],    // 不足列表，2-3 项，保持客观
  "review": "一段编辑评测文字"   // 评测正文，100-200 字，给出适用人群与结论
}
```

### 注意事项

1. **JSON 格式**：最后一个字段不能有逗号，字符串中的引号需转义。
2. **分类一致性**：`category` 字段需使用上方列出的标准分类名，否则分类筛选将无法匹配。新增分类需同时修改 `app.js` 中 `renderCategoryPills` 的 `order` 数组。
3. **URL 真实性**：`url` 必须为工具的真实官网，禁止使用占位链接。
4. **图标自动生成**：工具图标取自 `name` 的首字符，无需准备图片资源。
5. **数据校验**：保存后建议用 [JSONLint](https://jsonlint.com/) 校验格式，避免语法错误导致页面空白。

### 添加新分类

如需新增分类（如「AI法律」）：

1. 在 `tools.json` 中将工具的 `category` 设为 `AI法律`
2. 打开 `app.js`，找到 `renderCategoryPills` 函数中的 `order` 数组，按显示顺序加入 `"AI法律"`
3. 分类标签会自动统计数量并出现在筛选栏

## 🎨 自定义品牌

- **站点名称**：修改 `index.html` 与 `blog.html` 中的 `溯泠 AI 工具室` 文本，以及 `logo-mark` 中的「溯」字
- **主题色**：修改 `style.css` 顶部 `:root` 与 `html.dark` 中的 `--brand-1` / `--brand-2` / `--brand-3` 三个变量
- **站点图标**：修改 HTML `<head>` 中的内联 SVG favicon
- **SEO 信息**：修改各 HTML 的 `<title>`、`<meta name="description">`、`og:url`、`canonical` 等

## 📊 数据统计

当前收录工具 **30 款**，分类分布：

| 分类 | 数量 |
|------|------|
| AI对话 | 6 |
| AI图片 | 5 |
| AI编程 | 4 |
| AI办公 | 3 |
| AI视频 | 3 |
| AI音频 | 3 |
| AI营销 | 2 |
| AI设计 | 2 |
| AI搜索 | 2 |

## 🔧 技术栈

- HTML5 + 语义化标签
- Tailwind CSS（CDN 引入，零构建）
- 原生 JavaScript（ES6+，无框架依赖）
- CSS 自定义属性（CSS Variables）实现主题化
- `fetch` 加载 JSON 数据
- `localStorage` 记忆主题偏好

## 📝 浏览器兼容性

支持所有现代浏览器（Chrome / Edge / Firefox / Safari 最新两个版本）。不兼容 IE。

## 📜 许可证

本导航站代码采用 MIT 协议开源。收录工具的名称、Logo、官网等版权归各自所有者所有，本站仅做导航与评测推荐。

## 🤝 贡献

欢迎通过 Issue 或 Pull Request 推荐新的 AI 工具或修正评测内容。提交前请确认：
1. 工具确实存在且官网可访问
2. 描述与评测客观真实，不夸大不贬低
3. `tools.json` 格式正确，可通过 JSON 校验
