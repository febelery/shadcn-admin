# 管理后台模板

这是一个基于 React + TypeScript + Vite + Shadcn/UI 构建的管理后台模板。

## 特性

- 🚀 基于 Vite 构建,开发体验极佳
- 💪 使用 TypeScript 编写,类型安全
- 🎨 集成 Shadcn/UI + TailwindCSS,美观易用
- 🌓 支持浅色/深色主题切换
- 📱 响应式设计,支持移动端
- 🔐 内置登录认证流程
- 🎯 Mock 数据支持

## 技术栈

- React 19
- TypeScript
- Vite
- TailwindCSS
- Shadcn/UI
- Framer Motion
- msw

## 项目结构

```
src/
├── components/ # 通用组件
├── hooks/ # 自定义 Hooks
├── lib/ # 工具函数
├── mock/ # Mock 数据
├── pages/ # 页面组件
├── router/ # 路由配置
├── services/ # API 服务
└── main.tsx # 入口文件
```

## 注意

当使用msw时，如果cookie中存在`:`，会导致无法正常加载组件
