# 项目架构与技术栈概览 (Project Architecture & Tech Stack)

这份文档旨在为开发者和 AI 模型提供 `shadcn-admin` 项目的快速理解指南，涵盖核心技术选型、目录结构、架构模式及关键库。

---

## 🚀 核心技术栈 (Core Tech Stack)

| 类别                  | 技术/库                                                      |
| :-------------------- | :----------------------------------------------------------- |
| **基础框架**          | **React 19** (TypeScript)                                    |
| **构建工具**          | **Vite**, **PostCSS**, **Tailwind CSS v4**                   |
| **路由管理**          | **TanStack Router** (基于文件的路由, `src/routes`)           |
| **状态管理 (Server)** | **TanStack Query (React Query)**                             |
| **状态管理 (Client)** | **Zustand** (全局 UI/Auth 状态)                              |
| **UI 组件库**         | **shadcn/ui** (基于 Base UI (@base-ui/react) & Tailwind CSS) |
| **表单处理**          | **@tanstack/react-form** + **Zod** (模式校验)                |
| **数据展示**          | **TanStack Table v9**, **TanStack Virtual**, **Recharts**    |
| **动画效果**          | **Motion** (framer-motion), **tw-animate-css**               |
| **图标库**            | **Lucide React**                                             |
| **其他增强**          | **Axios**, **date-fns**, **dnd-kit** (拖拽)                  |

---

## 📂 项目结构指南 (Structure)

项目采用 **Feature-based Architecture (基于功能的架构)**，逻辑按照业务模块划分，而非简单的代码类型。

```text
src/
├── api/            # API 请求接口定义 (Axios 拦截器、请求服务)
├── assets/         # 静态资源 (图片, SVG 等)
├── components/     # 共享 UI 组件
│   ├── ui/         # shadcn 原始原子组件 (Button, Input 等)
│   ├── data-table/ # 复杂的通用数据表格组件
│   ├── layout/     # 应用整体布局 (Sidebar, Topbar, Content)
│   └── ...         # 其他高内聚业务无关组件 (DatePicker, Cropper 等)
├── config/         # 全局配置 (环境变量、菜单配置等)
├── constants/      # 全局常量
├── context/        # React Context (轻量局部状态)
├── features/       # 🚀 业务领域模型 (核心文件夹)
│   ├── auth/       # 登录、权限管理逻辑
│   ├── dashboard/  # 仪表盘相关逻辑/组件
│   ├── tasks/      # 任务管理模块
│   └── ...         # 其他业务模块 (每个 feature 包含自己的 components, logic, types)
├── hooks/          # 通用自定义 Hooks
├── lib/            # 工具库封装 (utils.ts, queryClient, router 等)
├── mocks/          # MSW (Mock Service Worker) 拦截请求与模拟数据
├── routes/         # TanStack Router 文件式路由定义 (__root.tsx 为根布局)
├── stores/         # Zustand 全局状态存储 (authStore, settingsStore)
├── styles/         # 全局样式 (index.css)
├── types/          # 全局 TypeScript 类型声明
└── main.tsx        # 应用入口
```

---

## ✨ 特色组件详解 (Featured Components)

为了避免重复造轮子，开发新功能前请优先查看以下已实现的重型组件：

### 1. 🚀 Data Grid (高性能数据网格)

_路径：`src/components/data-grid`_

- **核心能力**：支持海量数据的虚拟滚动网格。
- **特色功能**：
  - **单元格变体 (Cell Variants)**：内置多种渲染模式（文本、徽章、进度条、操作按钮等）。
  - **上下文菜单 (Context Menu)**：右键支持快速复制、编辑、删除等操作。
  - **粘贴支持 (Paste Dialog)**：支持从 Excel 或其他表格直接粘贴数据。
  - **动态行高**：用户可自定义行高（Compact / Standard / Tall）。
  - **复杂排序/过滤**：集成高级排序菜单。

### 2. 📊 Data Table (通用数据表格)

_路径：`src/components/data-table`_

- **核心能力**：基于 `TanStack Table` 的标准列表封装。
- **特色功能**：
  - **批量操作 (Bulk Actions)**：选定多行后自动浮现操作条。
  - **灵活分页**：内置完善的分页控制与每页显示条数选择。
  - **列显示控制**：支持动态切换列的显示/隐藏状态。

### 3. 🔍 Filter Menu (高级筛选器)

_路径：`src/components/filter-menu`_

- **核心能力**：解决多条件、多类型的复杂搜索。
- **特色功能**：
  - **DSL 式过滤**：支持多种操作符（包含、等于、大于、范围等）。
  - **动态输入**：根据选择的字段自动切换输入控件（Select, DatePicker, Range Input）。

### 4. 🎨 Image Cropper (专业图片裁剪)

_路径：`src/components/image-cropper.tsx`_

- **核心能力**：零配置的图片裁剪对话框。
- **特色功能**：
  - **双源支持**：无缝处理本地 `File` 对象和远程 `URL` 地址。
  - **比例预设**：支持 1:1, 4:3, 16:9 切换。
  - **高质量输出**：使用 Canvas Canvas 2D 渲染，支持平滑缩放和高质量 Blob 输出。

### 5. 🧱 页面布局容器 (PageLayout)

_路径：`src/components/layout/page-layout.tsx`_

`PageLayout` 是所有业务页面的核心容器，统一封装了页眉（`PageHeader`）、操作区、加载态骨架屏（`Suspense`）和错误拦截屏障（`ErrorBoundary`）。

#### 核心属性 (Props)

| 属性          | 类型                              | 默认值             | 说明                                                         |
| :------------ | :-------------------------------- | :----------------- | :----------------------------------------------------------- |
| `title`       | `string`                          | -                  | 页面主标题                                                   |
| `description` | `string`                          | -                  | 页面副标题描述                                               |
| `actions`     | `ReactNode`                       | -                  | 顶部操作栏右侧操作组件（如新建按钮、导入导出）               |
| `variant`     | `'default' \| 'fluid' \| 'fixed'` | `'default'`        | 页面高度与滚动模式（见下文说明）                             |
| `fluid`       | `boolean`                         | `false`            | 是否解除 `@7xl/content:max-w-7xl` 宽度限制，撑满可用容器全宽 |
| `className`   | `string`                          | -                  | 容器额外 Tailwind 类名                                       |
| `fallback`    | `ReactNode`                       | `<PageSkeleton />` | 异步加载时的降级骨架屏                                       |

#### 布局模式与宽度控制

布局系统通过 **高度/滚动模式 (`variant`)** 与 **宽度流式控制 (`fluid`)** 两个正交维度进行管理：

1. **常规内容页 (`variant='default'`，默认)**：
   - 页面高度随内容自适应，随浏览器外层滚动。
   - 默认限制最大宽度并居中（`@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl`），防止在大屏/超宽屏下视觉分散。
   - **典型场景**：Dashboard、Task 列表、User 列表、权限配置等常规管理页面。

2. **固定高度内滚页 (`variant='fixed'`)**：
   - 页面固定为视口高度（`has-data-[layout=fixed]:h-svh`），外层禁止滚动，内容区自身通过 `overflow-auto` / `ScrollArea` 处理滚动。
   - 默认同样保持居中与 `max-w-7xl` 限制。
   - **典型场景**：App 应用卡片页、Chat 聊天窗口、Setting 设置中心等。

3. **数据密集型全宽网格 (`variant='fixed' fluid`)**：
   - 既需要固定视口高度自适应滚动，又需要解除最大宽度限制以铺满屏幕。
   - **典型场景**：Product 高级数据网格、Survey 填写记录等包含大量数据列需要横向/纵向虚拟滚动的页面。

#### 使用示例

```tsx
// 1. 标准常规列表页（默认 max-w-7xl 居中 + 随页面滚动）
export function TaskPage() {
  return (
    <PageLayout
      title='任务列表'
      description='管理团队的所有日常研发任务'
      actions={<Button>新建任务</Button>}
    >
      <TaskTable />
    </PageLayout>
  )
}

// 2. 固定高度内滚页（如聊天、应用中心，保留 max-w-7xl 居中限制）
export function ChatPage() {
  return (
    <PageLayout variant='fixed'>
      <div className='flex h-full gap-6'>
        <ChatSidebar />
        <ChatContent />
      </div>
    </PageLayout>
  )
}

// 3. 高性能全宽数据网格（固定视口 + 解除最大宽度限制）
export function ProductPage() {
  return (
    <PageLayout
      title='产品数据网格'
      description='支持虚拟滚动、多列固定与即时编辑'
      variant='fixed'
      fluid
      className='flex flex-col gap-4'
    >
      <DataGrid />
    </PageLayout>
  )
}
```

### 6. 🏛️ 其他布局与导航组件

- **AuthenticatedLayout** (`src/components/layout/authenticated-layout.tsx`)：后台主骨架，管理侧栏（`AppSidebar`）、暗黑模式、全局主题与 `@container/content` 容器查询边界。
- **AppSidebar** (`src/components/layout/app-sidebar.tsx`)：高度集成的侧栏导航，支持展开/紧凑模式与多级折叠菜单。
- **TopNav / Header** (`src/components/layout/top-nav.tsx`)：顶部操作与二级快捷导航。

### 7. 🛠 其他实用组件

- **Can (权限守卫)** (`src/components/can.tsx`)：声明式权限控制，支持 `hide` (隐藏)、`disable` (禁用样式) 和 `fallback` (降级内容) 三种模式。
- **Navigation Progress** (`src/components/navigation-progress.tsx`)：利用 TanStack Router 状态实现的自渲染进度条，替代沉重的第三方库。
- **Confirm Dialog** (`src/components/confirm-dialog.tsx`)：标准化的异步确认弹窗，替代原生的 `window.confirm`。
- **Select Dropdown** (`src/components/select-dropdown.tsx`)：增强的下拉选择器，支持搜索和长列表渲染。
- **File Upload** (`src/components/file-upload`)：支持分片或批量上传的增强上传控件。

---

## 🏛️ 项目架构要点 (Architecture)

### 1. 路由体系 (TanStack Router)

- **文件式路由**：`src/routes` 下的结构直接映射到地址栏。
- **布局管理**：利用 `__root.tsx` 和带前缀或括号的文件夹（如 `_authenticated`, `(auth)`) 实现权限隔离和嵌套布局。
- **类型安全**：路由参数和状态具有完整的类型提示。

### 2. 状态管理策略

- **服务器状态**：由 TanStack Query 托管，处理缓存、同步和错误重试。
- **客户端全局状态**：由 Zustand 管理，主要负责侧边栏折叠、当前主题、用户凭证等轻量级应用状态。
- **局部状态**：首选 `useState`，表单状态由 `@tanstack/react-form` 隔离在表单内部。

### 3. 组件设计准则 (KISS/SOLID/YAGNI)

- **原子性**：遵循 `shadcn` 风格，所有 `components/ui` 组件都是颗粒化、高度可定制的。
- **数据驱动**：复杂的组件（如 `data-table`）高度依赖 `TanStack Table` 的状态控制，保持 UI 与逻辑的分离。
- **优雅退化**：集成了 `error-boundary` 和 `loading-states` 处理异常和加载。

### 4. 样式系统 (Tailwind v4)

- 深度集成 CSS 变量，支持无缝的 **Dark Mode** 切换。
- 使用 `class-variance-authority` (CVA) 管理组件的不同变体（Size, Variant, Color）。

---

## 🛠️ 后续开发者/模型接入建议

1. **新增功能**：应首先在 `src/features` 下创建对应文件夹，并在 `src/routes` 下添加路由。
2. **UI 逻辑**：如果想修改全局按钮样式，去 `src/components/ui/button.tsx`；如果是业务逻辑，去对应的 `features/`。
3. **数据请求**：首选在 `src/api` 定义 API 函数，再到业务组件中使用 `useQuery` 或 `useMutation`。
4. **Mock 数据**：项目包含 MSW，可以在 `src/mocks` 中定义新的 `handler` 方便离线开发。
