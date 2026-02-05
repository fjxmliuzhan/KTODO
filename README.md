# TODO - 双人协同 Todo 系统

一个现代化的双人协同任务管理系统，支持实时同步、标签管理、好友协作和共享看板。

## ✨ 功能特性

### 核心功能
- ✅ **用户认证** - 邮箱密码登录、OAuth（GitHub/Google）登录
- ✅ **任务管理** - 创建、编辑、删除、标记完成
- ✅ **优先级** - 高、中、低三个优先级别
- ✅ **任务排序** - 支持拖拽排序和多种排序方式
- ✅ **标签系统** - 自定义标签，任务可添加多个标签
- ✅ **好友管理** - 搜索用户、发送好友请求、管理好友列表
- ✅ **共享看板** - 与好友创建共享看板，实时协作
- ✅ **实时同步** - 使用 Supabase Realtime 实现任务实时更新
- ✅ **任务筛选** - 按完成状态、优先级、标签筛选
- ✅ **响应式设计** - 支持桌面端和移动端

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- Supabase 项目（免费账户即可）

### 1. 克隆项目

```bash
cd TODO
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 Supabase

#### 3.1 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并创建新项目
2. 在项目设置中获取以下信息：
   - Project URL
   - Anon/Public Key

#### 3.2 创建环境变量

创建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 3.3 运行数据库迁移

1. 在 Supabase Dashboard 中进入 SQL Editor
2. 复制 `supabase/migrations/001_initial_schema.sql` 的内容
3. 点击 "RUN" 执行脚本

这将创建以下表：
- `profiles` - 用户配置
- `tags` - 标签
- `tasks` - 任务
- `task_tags` - 任务标签关联
- `friend_requests` - 好友请求
- `friendships` - 好友关系
- `shared_boards` - 共享看板
- `shared_board_members` - 共享看板成员

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
TODO/
├── app/                      # Next.js App Router 页面
│   ├── (auth)/              # 认证相关页面
│   │   ├── login/          # 登录页面
│   │   └── register/       # 注册页面
│   ├── auth/                # 认证 API 路由
│   │   ├── callback/       # OAuth 回调
│   │   └── signout/        # 登出
│   ├── api/                # API 路由
│   │   ├── tasks/          # 任务 API
│   │   ├── friends/        # 好友 API
│   │   └── boards/         # 看板 API
│   ├── dashboard/          # 仪表板页面
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页（重定向）
│   └── globals.css          # 全局样式
├── components/              # React 组件
│   ├── TaskItem.tsx        # 任务项组件
│   ├── CreateTaskForm.tsx  # 创建任务表单
│   ├── TagManager.tsx      # 标签管理组件
│   ├── FriendRequest.tsx   # 好友请求组件
│   ├── FriendList.tsx      # 好友列表组件
│   └── AddFriend.tsx       # 添加好友组件
├── lib/                     # 工具库
│   └── supabase/           # Supabase 配置
│       ├── client.ts        # 浏览器端客户端
│       ├── server.ts        # 服务端客户端
│       ├── middleware.ts    # 中间件
│       └── types.ts         # TypeScript 类型
├── supabase/migrations/     # 数据库迁移
│   └── 001_initial_schema.sql
├── middleware.ts           # Next.js 中间件
├── next.config.ts          # Next.js 配置
├── tailwind.config.ts       # Tailwind CSS 配置
├── tsconfig.json           # TypeScript 配置
└── package.json
```

## 🛠️ 技术栈

- **框架** - Next.js 14 (App Router)
- **语言** - TypeScript
- **样式** - Tailwind CSS
- **数据库** - Supabase (PostgreSQL + Realtime)
- **认证** - Supabase Auth
- **状态管理** - React Hooks
- **API** - Next.js Route Handlers

## 📊 数据库设计

### 主要表结构

#### profiles (用户配置)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 用户ID (关联 auth.users) |
| username | TEXT | 用户名（唯一） |
| full_name | TEXT | 全名 |
| avatar_url | TEXT | 头像 URL |

#### tasks (任务)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 任务ID |
| user_id | UUID | 创建者 ID |
| title | TEXT | 任务标题 |
| description | TEXT | 任务描述 |
| priority | TEXT | 优先级 (low/medium/high) |
| completed | BOOLEAN | 是否完成 |
| completed_at | TIMESTAMP | 完成时间 |
| sort_order | INTEGER | 排序顺序 |
| shared_board_id | UUID | 关联的共享看板 ID |

#### shared_boards (共享看板)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 看板 ID |
| name | TEXT | 看板名称 |
| created_by | UUID | 创建者 ID |

#### friendships (好友关系)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 关系 ID |
| user_id | UUID | 用户 ID |
| friend_id | UUID | 好友 ID |

## 🔐 安全特性

- 行级安全策略 (RLS)
- 用户只能访问自己的数据
- 好友关系验证
- 共享看板成员权限控制
- OAuth 安全流程
- CSRF 保护

## 🌐 部署

### Vercel

```bash
# 1. 连接 GitHub 仓库到 Vercel
# 2. 设置环境变量
# 3. 部署
```

### 环境变量

在 Vercel 项目设置中添加：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📝 开发计划

- [x] 项目初始化
- [x] 用户认证系统
- [x] 任务 CRUD 功能
- [x] 标签管理
- [x] 好友管理
- [x] 共享看板
- [x] 实时同步
- [ ] 拖拽排序
- [ ] 任务通知
- [ ] 移动端优化

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👥 作者

TODO Team

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
