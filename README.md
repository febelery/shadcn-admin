# Shadcn Admin

一个基于 Shadcn UI 和 TanStack 构建的现代化管理后台系统。

## ✨ 特性

- 🎨 **现代化 UI** - 基于 Shadcn UI 组件库
- ⚡ **极速开发** - Vite 7 + React SWC
- 🔒 **类型安全** - TypeScript 5.9
- 📱 **响应式设计** - 完美适配各种设备
- 🛣️ **类型安全路由** - TanStack Router
- 📊 **数据管理** - TanStack Query + Table
- 🔐 **权限控制** - 基于资源标识的细粒度 RBAC 权限系统
- 🎨 **主题系统** - 支持亮色/暗色主题切换
- 🧪 **API 模拟** - MSW 支持开发环境模拟

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装

```bash
# 安装依赖
pnpm install
```

### 环境配置

创建 `.env.development` 文件：

```env
VITE_APP_TITLE=Shadcn Admin
VITE_API_URL=http://localhost:3000/api
VITE_HASH_ROUTER=false
```

### 开发

```bash
pnpm dev
```

项目将在 `http://localhost:5173` 启动

### 构建

```bash
pnpm build
pnpm preview
```

## 🛠️ 技术栈

### 核心

- **React 19** - UI 框架
- **TypeScript 5.9** - 类型系统
- **Vite 7** - 构建工具

### UI

- **Shadcn UI** - 组件库 (New York 风格)
- **Tailwind CSS 4** - CSS 框架
- **Radix UI** - UI 原语
- **Lucide React** - 图标库

### 数据与路由

- **TanStack Router** - 类型安全路由
- **TanStack Query** - 数据同步
- **TanStack Table** - 表格组件
- **TanStack Virtual** - 虚拟滚动

### 其他

- **Zustand** - 状态管理
- **React Hook Form + Zod** - 表单处理
- **MSW** - API 模拟
- **Recharts** - 图表库

## 📁 项目结构

```
src/
├── components/     # 组件
│   ├── layout/     # 布局组件
│   └── ui/         # UI 组件
├── features/       # 功能模块
│   ├── dashboard/  # 仪表板
│   ├── users/      # 用户管理
│   ├── permissions/# 权限管理
│   ├── tasks/      # 任务管理
│   └── ...
├── hooks/          # 自定义 Hooks
├── lib/            # 工具函数
├── routes/         # 路由定义
├── stores/         # 状态管理
└── context/        # Context 提供者
```

## 📦 功能模块

- **仪表板** - 数据可视化
- **用户管理** - 用户列表和信息管理
- **权限管理** - 角色、权限分配与 RBAC 管理
- **任务管理** - 任务创建和状态管理
- **应用管理** - 应用列表和详情
- **产品管理** - 产品信息管理
- **聊天** - 实时聊天界面
- **设置** - 个人资料、账户、外观等设置
- **认证** - 登录、注册、忘记密码等，支持 LocalStorage 持久化

## 🔧 开发指南

### 添加组件

```bash
npx shadcn@latest add [component-name]
```

### 路径别名

使用 `@/` 作为 `src/` 的别名：

```typescript
import { useMenuData } from '@/hooks/use-menu-data'
import { Button } from '@/components/ui/button'
```

### 代码质量

```bash
pnpm lint          # 代码检查
pnpm format        # 代码格式化
pnpm knip          # 未使用代码检测
```

## 🔒 权限系统

项目实现了一套完整的声明式权限控制系统：

### 权限声明
在路由定义中使用 `staticData` 声明所需权限：
```tsx
export const Route = createFileRoute('/_authenticated/users/')({
  staticData: {
    permission: 'users:access',
  },
})
```

### 组件级控制
使用 `<Can>` 组件进行细粒度的 UI 控制：
```tsx
<Can I="users:create">
  <Button>新增用户</Button>
</Can>
```

### 钩子函数
使用 `useCan` 钩子在逻辑中检查权限：
```typescript
const canEdit = useCan('users:edit')
```

## 📚 相关资源

- [Shadcn UI](https://ui.shadcn.com)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Vite](https://vite.dev)
- [React](https://react.dev)
