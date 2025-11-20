# Shadcn Admin Dashboard

一个基于 Shadcn UI 和 Vite 构建的现代化管理后台系统，专注于响应式设计和可访问性。

## ✨ 特性

- 🎨 **现代化 UI** - 基于 Shadcn UI 组件库，提供美观且一致的界面设计
- ⚡ **极速开发** - 使用 Vite 构建工具，提供快速的开发体验和热模块替换
- 📱 **响应式设计** - 完美适配桌面、平板和移动设备
- ♿ **可访问性** - 遵循 WAI-ARIA 标准，确保良好的可访问性
- 🎯 **TypeScript** - 完整的类型支持，提供更好的开发体验和代码质量
- 🔄 **状态管理** - 使用 Zustand 进行轻量级状态管理
- 📊 **数据获取** - 集成 TanStack Query 进行数据获取和缓存
- 🛣️ **路由管理** - 使用 TanStack Router 进行类型安全的路由管理
- 📝 **表单处理** - 使用 React Hook Form 和 Zod 进行表单验证
- 🎨 **主题切换** - 支持亮色/暗色主题切换
- 🌐 **国际化支持** - 支持 RTL（从右到左）布局方向

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0（推荐使用 pnpm）

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

项目将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

### 代码检查

```bash
pnpm lint
```

### 代码格式化

```bash
# 检查格式
pnpm format:check

# 自动格式化
pnpm format
```

### 未使用代码检测

```bash
pnpm knip
```

## 📁 项目结构

```
shadcn-admin/
├── public/              # 静态资源
├── src/
│   ├── assets/         # 资源文件（图片、图标等）
│   ├── components/     # 可复用组件
│   │   ├── layout/     # 布局组件
│   │   └── ui/         # Shadcn UI 组件
│   ├── config/         # 配置文件
│   ├── context/        # React Context 提供者
│   ├── features/       # 功能模块
│   │   ├── apps/       # 应用管理
│   │   ├── auth/       # 认证相关
│   │   ├── chats/      # 聊天功能
│   │   ├── dashboard/  # 仪表板
│   │   ├── errors/     # 错误页面
│   │   ├── settings/   # 设置页面
│   │   ├── tasks/      # 任务管理
│   │   └── users/      # 用户管理
│   ├── hooks/          # 自定义 Hooks
│   ├── lib/            # 工具函数
│   ├── routes/         # 路由定义
│   ├── stores/         # Zustand 状态管理
│   ├── styles/         # 全局样式
│   └── main.tsx        # 应用入口
├── components.json     # Shadcn UI 配置
├── vite.config.ts      # Vite 配置
└── package.json        # 项目依赖
```

## 🛠️ 技术栈

### 核心框架

- **React 19** - 用于构建用户界面的 JavaScript 库
- **TypeScript 5.9** - 提供类型安全的 JavaScript
- **Vite 7** - 下一代前端构建工具

### UI 组件库

- **Shadcn UI** - 基于 Radix UI 和 Tailwind CSS 的组件库
- **Radix UI** - 无样式的、可访问的 UI 组件原语
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **Lucide React** - 精美的图标库

### 路由与数据

- **TanStack Router** - 类型安全的路由管理
- **TanStack Query** - 强大的数据同步库
- **TanStack Table** - 无头表格库

### 表单与验证

- **React Hook Form** - 高性能表单库
- **Zod** - TypeScript 优先的模式验证库
- **@hookform/resolvers** - React Hook Form 验证器解析器

### 状态管理

- **Zustand** - 轻量级状态管理库

### 工具库

- **Axios** - 基于 Promise 的 HTTP 客户端
- **date-fns** - 现代 JavaScript 日期工具库
- **recharts** - 基于 React 的图表库
- **sonner** - 优雅的 Toast 通知组件
- **cmdk** - 命令菜单组件

### 开发工具

- **ESLint** - JavaScript/TypeScript 代码检查工具
- **Prettier** - 代码格式化工具
- **Knip** - 未使用代码检测工具
- **TypeScript ESLint** - TypeScript 的 ESLint 插件

## 📦 主要功能模块

### 仪表板 (Dashboard)

- 数据可视化
- 统计图表
- 实时数据展示

### 任务管理 (Tasks)

- 任务列表
- 任务创建和编辑
- 任务状态管理

### 应用管理 (Apps)

- 应用列表展示
- 应用详情查看

### 聊天 (Chats)

- 实时聊天界面
- 消息管理

### 用户管理 (Users)

- 用户列表
- 用户信息管理
- 数据表格展示

### 设置 (Settings)

- **个人资料** - 用户信息设置
- **账户设置** - 账户相关配置
- **外观设置** - 主题和样式配置
- **通知设置** - 通知偏好设置
- **显示设置** - 显示相关配置

### 认证 (Auth)

- 登录页面
- 注册页面
- 忘记密码
- OTP 验证
- 多种登录布局

### 错误页面 (Errors)

- 401 - 未授权
- 403 - 禁止访问
- 404 - 页面未找到
- 500 - 服务器错误
- 503 - 服务不可用

## 🎨 主题定制

项目支持完整的主题定制，包括：

- 亮色/暗色主题切换
- CSS 变量配置
- 自定义颜色方案
- 字体配置
- 布局方向（LTR/RTL）

主题配置位于 `src/context/theme-provider.tsx`

## 🔧 配置

### Shadcn UI 配置

Shadcn UI 的配置位于 `components.json`，你可以通过以下命令添加新组件：

```bash
npx shadcn@latest add [component-name]
```

### 路径别名

项目使用 `@/` 作为 `src/` 目录的别名，配置在 `vite.config.ts` 和 `tsconfig.json` 中。

### 环境变量

创建 `.env.development` 文件来配置环境变量：

```env
# 应用配置
VITE_APP_NAME=Your Project Name

# API 配置
VITE_API_URL=your_api_url

# 路由配置
# 设置为 true 使用 hash 路由模式 (createHashHistory)
# 设置为 false 或不设置使用 history 路由模式 (默认)
VITE_HASH_ROUTER=false
```

## 📝 代码规范

项目使用以下工具确保代码质量：

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型检查
- **Knip** - 未使用代码检测

## 🚢 部署

项目已配置 Netlify 部署，`netlify.toml` 包含必要的重定向配置。

### 构建命令

```bash
pnpm build
```

构建产物将输出到 `dist/` 目录。

## 📄 许可证

查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📚 相关资源

- [Shadcn UI 文档](https://ui.shadcn.com)
- [TanStack Router 文档](https://tanstack.com/router)
- [TanStack Query 文档](https://tanstack.com/query)
- [Vite 文档](https://vite.dev)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)

---

**注意**: 这是一个管理后台模板项目，你可以基于此项目快速构建自己的管理后台系统。
