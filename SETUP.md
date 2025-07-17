# DocuMancer 设置指南

## 🚀 快速开始

### 1. 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册账户并登录
3. 在控制台中创建 API Key
4. 复制您的 API Key（格式类似：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 2. 配置环境变量

1. 复制环境变量模板：
   ```bash
   cp .env.local.example .env.local
   ```

2. 编辑 `.env.local` 文件，填入您的 DeepSeek API Key：
   ```env
   DEEPSEEK_API_KEY=sk-your-actual-deepseek-api-key-here
   DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
   ```

### 3. 安装依赖

```bash
npm install
```

### 4. 创建必要的目录

```bash
mkdir -p uploads data
```

### 5. 启动应用

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

## 📖 使用指南

### 上传论文

1. 点击 "Add Paper" 按钮
2. 拖拽 PDF 文件到上传区域，或点击选择文件
3. 等待文件处理完成
4. 论文将自动添加到您的图书馆

### AI 分析功能

#### 快速分析
在论文阅读界面，使用右侧的快速分析面板：

- **Summarize**: 生成论文综合摘要
- **Key Findings**: 提取主要发现和贡献
- **Methodology**: 分析研究方法
- **Key Concepts**: 识别关键概念和术语
- **Citations**: 分析引用和参考文献

#### 智能问答
在聊天界面中，您可以：

- 询问论文的具体内容
- 请求解释复杂概念
- 比较不同部分的内容
- 获取研究方法的详细说明

示例问题：
- "这篇论文的主要贡献是什么？"
- "作者使用了什么研究方法？"
- "论文中提到的局限性有哪些？"
- "能解释一下这个算法的工作原理吗？"

### 论文比较

1. 进入 "Compare" 视图
2. 选择两篇要比较的论文
3. 点击 "Compare Papers"
4. AI 将生成详细的比较分析

### 注释功能

在 PDF 阅读器中：

1. **高亮**: 选择文本后点击高亮按钮
2. **笔记**: 添加个人注释和想法
3. **书签**: 标记重要页面

## 🔧 高级配置

### 自定义 AI 提示

编辑 `src/lib/langchain.ts` 中的 `PROMPTS` 对象来自定义 AI 分析提示。

### 文件上传限制

在 `.env.local` 中调整：
```env
NEXT_PUBLIC_MAX_FILE_SIZE=20971520  # 20MB
```

### 支持的文件格式

目前支持：
- PDF 文件 (.pdf)

## 🐛 故障排除

### 常见问题

1. **API Key 错误**
   - 确保 API Key 格式正确（以 `sk-` 开头）
   - 检查 API Key 是否有效且有足够余额

2. **PDF 上传失败**
   - 确保文件是有效的 PDF 格式
   - 检查文件大小是否超过限制
   - 确保 `uploads` 目录存在且可写

3. **AI 分析失败**
   - 检查网络连接
   - 验证 DeepSeek API 服务状态
   - 查看浏览器控制台错误信息

### 日志查看

开发模式下，错误信息会显示在：
- 浏览器控制台
- 终端输出

## 📝 开发说明

### 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API 路由
│   └── globals.css     # 全局样式
├── components/         # React 组件
│   ├── analysis/       # 分析组件
│   ├── chat/          # 聊天界面
│   ├── common/        # 通用组件
│   ├── layout/        # 布局组件
│   ├── library/       # 图书馆组件
│   ├── pdf/           # PDF 查看器
│   ├── upload/        # 文件上传
│   └── views/         # 主要视图
├── hooks/             # 自定义 Hooks
├── lib/               # 工具库
└── store/             # 状态管理
```

### 添加新的分析类型

1. 在 `src/lib/constants.ts` 中添加新的分析类型
2. 在 `src/lib/langchain.ts` 中添加对应的提示模板
3. 更新相关组件以支持新的分析类型

## 🚀 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 在环境变量中设置 `DEEPSEEK_API_KEY`
4. 部署

### Docker 部署

```bash
# 构建镜像
docker build -t documancer .

# 运行容器
docker run -p 3000:3000 -e DEEPSEEK_API_KEY=your-key documancer
```

## 📞 支持

如果您遇到问题：

1. 检查本文档的故障排除部分
2. 查看 GitHub Issues
3. 提交新的 Issue 描述您的问题

---

享受使用 DocuMancer 进行学术研究！🎓
