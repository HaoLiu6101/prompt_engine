# Prompt Engine
Languages / 语言: [English](#english) | [中文](#中文)

## English
### Overview
Internal platform for authoring, approving, and consuming reusable prompts. Current status: desktop spotlight prototype (React + Vite + Tauri/Rust with a local SQLite library and platform shortcuts), architecture/data model specs, backend not yet implemented.

### Structure
- `frontend/`: React + TypeScript + Vite desktop app with a Tauri host in `src-tauri/` (Rust). The host seeds and queries a local SQLite library, exposes IPC commands, and registers a global shortcut for the Spotlight window (macOS: Cmd+Option+L, Windows: Ctrl+Alt+L).
- `specs/`: Architecture, data models, and placeholders for API/flows.
- `backend/`: Empty placeholder for FastAPI backend.

### Frontend quickstart
```bash
cd frontend
npm install
# Desktop (Tauri) with global shortcut + local library
npm run tauri dev

# Web-only fallback (no global shortcut; uses in-memory fallback items)
npm run dev
```
Open the shown URL (defaults to `http://localhost:5173`) or use the spawned desktop window. Default route: Welcome. Additional routes: `/home`, `/prompts`.

### Windows build prerequisites
- Rust toolchain `x86_64-pc-windows-msvc`
- Visual Studio Build Tools with the C++ workload (needed for bundled SQLite via `rusqlite`)
- Node.js 18+
- WebView2 runtime (preinstalled on GitHub runners; install manually if missing)
- Build: `cd frontend && npm install && npm run tauri build`

### Spotlight
- Shortcut: `Cmd+Option+L` (macOS) or `Ctrl+Alt+L` (Windows) opens the Spotlight window centered on the active monitor; if the dedicated Tauri window is unavailable, the inline overlay opens instead.
- Search: 220ms debounced query hitting the local SQLite library via Rust IPC (`search_library`), merged with fallback in-memory data for web-only mode.
- Navigation: Arrow keys or click; Esc closes. Dev builds auto-open devtools for the spotlight window.
- Copy: Enter or “Copy & close” copies the active prompt/snippet; clipboard uses Tauri in desktop mode and the browser Clipboard API on the web.
- Close: Esc (capture listener) or clicking the backdrop hides the overlay/window without touching the host shell.

### Tauri
Config: `frontend/src-tauri/tauri.conf.json`. The Rust host wires IPC commands for library search/reseed and clipboard handling; macOS-only text insertion uses AppleScript and requires Accessibility permission if enabled later.

### Coding standards
- React + TypeScript, Vite.
- Zustand for client state, React Router for navigation.
- Lint: `npm run lint` (ESLint with TypeScript + React Hooks; import plugin available if we later enable its rules).

### Internationalization
- UI strings are migrating to `react-i18next` with locales under `frontend/src/i18n/locales/` (`en`, `zh` namespaces such as `common`, `nav`, `welcome`, `home`, `prompts`).
- Language detection order: stored preference (localStorage) → browser/OS locale → fallback `en`. Language switcher in the top nav; missing keys fall back to English and log in dev.
- When adding new UI, prefer translation keys (`t('namespace:key')`) and avoid hardcoded strings. Do not translate user-generated prompt content—only chrome/labels.

### Next steps
- Implement backend (FastAPI + Postgres) per `specs/`.
- Wire frontend API client to real endpoints and add auth flows.
- Build Tauri Rust host and OS integrations (secure token storage, shortcuts).

## 中文
### 概览
Prompt Engine 是内部平台，用于编写、审批、复用提示词。目前进度：桌面 Spotlight 原型（React + Vite + Tauri/Rust + 本地 SQLite 库与全局快捷键），架构/数据模型规格已提交，后端尚未实现。

### 目录结构
- `frontend/`：React + TypeScript + Vite 桌面端，Tauri 宿主在 `src-tauri/`（Rust），负责种子/查询本地 SQLite、暴露 IPC、注册 Spotlight 全局快捷键（macOS: Cmd+Option+L，Windows: Ctrl+Alt+L）。
- `specs/`：架构与数据模型说明，API/流程占位。
- `backend/`：预留的 FastAPI 后端目录。

### 前端快速开始
```bash
cd frontend
npm install
# 桌面模式（Tauri，带全局快捷键 + 本地库）
npm run tauri dev

# 纯 Web（无全局快捷键，使用内存数据兜底）
npm run dev
```
打开提示的地址（默认 `http://localhost:5173`）或直接使用桌面窗口。默认路由：Welcome；其他路由：`/home`、`/prompts`。

### Windows 构建依赖
- Rust 工具链 `x86_64-pc-windows-msvc`
- Visual Studio Build Tools（含 C++ 工作负载，用于 `rusqlite` 绑定）
- Node.js 18+
- WebView2 运行时（GitHub runner 预装，缺失时需手动安装）
- 构建：`cd frontend && npm install && npm run tauri build`

### Spotlight
- 快捷键：`Cmd+Option+L`（macOS）或 `Ctrl+Alt+L`（Windows）在当前屏幕居中弹出 Spotlight；若 Tauri 专用窗口不可用，则回退为页面内 overlay。
- 搜索：220ms 防抖，走 Rust IPC `search_library` 查询本地 SQLite，并合并内存兜底数据保证纯 Web 可用。
- 导航：方向键或点击；Esc 关闭。开发模式自动打开 Spotlight 窗口 DevTools。
- 复制：Enter 或 “Copy & close” 复制选中提示词；桌面模式用 Tauri 剪贴板，Web 用浏览器 Clipboard API。
- 关闭：Esc（捕获监听）或点击背景隐藏 overlay/窗口，不影响宿主 shell。

### Tauri
配置位于 `frontend/src-tauri/tauri.conf.json`。Rust 宿主已封装库搜索/重置与剪贴板 IPC；如启用 macOS 文本插入，将通过 AppleScript 触发并需要辅助权限。

### 代码规范
- 技术栈：React + TypeScript + Vite。
- 状态与路由：Zustand、React Router。
- Lint：`npm run lint`（TypeScript + React Hooks；可按需开启 import 插件规则）。

### 国际化
- UI 使用 `react-i18next`，语言包存放在 `frontend/src/i18n/locales/`（`en`、`zh`，命名空间如 `common`、`nav`、`welcome`、`home`、`prompts`）。
- 语言检测顺序：本地偏好（localStorage）→ 浏览器/系统语言 → 回退 `en`。顶部导航提供语言切换，缺失键在开发模式会提示并回退英文。
- 新增界面请使用翻译键（`t('namespace:key')`），不要自动翻译用户输入或提示词内容，仅翻译界面文案。

### 下一步
- 按 `specs/` 实现 FastAPI + Postgres 后端。
- 将前端 API 客户端接入真实端点并补齐认证流程。
- 完善 Tauri Rust 宿主与 OS 集成（安全令牌存储、快捷键）。
