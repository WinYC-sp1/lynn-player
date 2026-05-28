# Tasks

## Phase 1: 项目脚手架与基础架构

- [x] Task 1: 初始化 Tauri 2 + React + TypeScript 项目
  - [x] SubTask 1.1: 使用 `npm create tauri-app` 初始化项目，选择 React + TypeScript 模板
  - [x] SubTask 1.2: 配置 Vite 构建工具，优化开发体验
  - [x] SubTask 1.3: 配置 TypeScript 严格模式（strict: true）
  - [x] SubTask 1.4: 配置 ESLint + Prettier，统一代码风格
  - [x] SubTask 1.5: 建立项目目录结构（src/components, src/modules, src/utils, src/types, src/styles 等）
  - [x] SubTask 1.6: 配置版本信息 v0.0.15.0.LPCANARY / 构建号 2627.0527

- [x] Task 2: 设计并实现应用基础框架
  - [x] SubTask 2.1: 实现主窗口布局（侧边栏导航 + 内容区 + 底部播放栏）
  - [x] SubTask 2.2: 实现路由系统（React Router），定义各功能模块路由
  - [x] SubTask 2.3: 实现全局状态管理（Zustand），定义核心 Store 结构
  - [x] SubTask 2.4: 实现主题系统（亮色/暗色/跟随系统）
  - [x] SubTask 2.5: 实现国际化（i18n）基础框架

- [ ] Task 3: 实现 Windows 视觉集成
  - [ ] SubTask 3.1: 检测当前 Windows 版本，确定可用视觉效果
  - [ ] SubTask 3.2: 实现 Windows 11 Mica 材质效果（通过 Tauri Rust 后端调用 Windows API）
  - [ ] SubTask 3.3: 实现 Windows 10 亚克力效果
  - [ ] SubTask 3.4: 实现 Windows 7/8 降级视觉效果
  - [ ] SubTask 3.5: 实现视觉效果设置面板（切换 Mica/亚克力/标准、自定义透明度/颜色）
  - [ ] SubTask 3.6: 实现系统主题自动切换监听

## Phase 2: 本地音乐播放模块

- [ ] Task 4: 实现音频解码与播放引擎
  - [ ] SubTask 4.1: 集成 Rust 端音频解码库（symphonia），支持 .mp3、.flac、.wav、.aac 格式
  - [ ] SubTask 4.2: 集成 .wmv 音频解码支持
  - [ ] SubTask 4.3: 实现前端音频播放控制器（播放/暂停/上一曲/下一曲/进度/音量/播放模式）
  - [ ] SubTask 4.4: 实现无缝播放（gapless playback）支持
  - [ ] SubTask 4.5: 实现音频均衡器（EQ）基础功能

- [x] Task 5: 实现元数据提取系统
  - [x] SubTask 5.1: 使用 Rust 端库（lofty）提取音频元数据（标题/艺术家/专辑/年份/流派/时长）
  - [x] SubTask 5.2: 实现多位艺术家正确解析与显示
  - [x] SubTask 5.3: 实现封面图片提取（内嵌封面 + 高清优先）
  - [x] SubTask 5.4: 实现缺失封面自动下载（从在线源匹配）
  - [x] SubTask 5.5: 实现 .lrc 歌词文件解析与内置歌词提取
  - [x] SubTask 5.6: 实现歌词逐行同步滚动显示组件

- [ ] Task 6: 实现音乐库管理系统
  - [ ] SubTask 6.1: 实现文件系统扫描引擎（Rust 端，支持首次全量扫描与增量更新）
  - [ ] SubTask 6.2: 实现本地数据库（SQLite），存储音乐元数据与索引
  - [ ] SubTask 6.3: 实现多条件搜索（按标题/艺术家/专辑/歌词全文搜索）
  - [ ] SubTask 6.4: 实现自定义播放列表创建与管理（增删改查、拖拽排序）
  - [ ] SubTask 6.5: 实现音乐分类与标签功能（按流派/年代/自定义标签）
  - [ ] SubTask 6.6: 实现音乐库 UI（列表/网格/专辑视图切换）

## Phase 3: 本地视频播放模块

- [ ] Task 7: 实现视频解码与播放引擎
  - [ ] SubTask 7.1: 集成视频解码方案（基于系统 Media Foundation 或 ffmpeg），支持 .mp4、.avi、.mkv、.flv、.mov 格式
  - [ ] SubTask 7.2: 集成 .wmv 视频解码支持
  - [ ] SubTask 7.3: 实现视频播放控制器（播放/暂停/进度/音量/全屏/画中画）
  - [ ] SubTask 7.4: 实现视频硬件加速解码（GPU 加速）
  - [ ] SubTask 7.5: 实现多清晰度/多音轨切换

- [x] Task 8: 实现字幕系统
  - [x] SubTask 8.1: 实现 .srt 字幕解析与渲染
  - [x] SubTask 8.2: 实现 .ass 字幕解析与渲染（含样式支持）
  - [x] SubTask 8.3: 实现 .sub 字幕解析与渲染
  - [x] SubTask 8.4: 实现字幕自定义选项（字体/大小/颜色/位置/描边）
  - [x] SubTask 8.5: 实现字幕时间轴同步调整（提前/延后偏移）

- [x] Task 9: 实现弹幕系统
  - [x] SubTask 9.1: 实现弹幕渲染引擎（Canvas/WebGL 方案）
  - [x] SubTask 9.2: 实现弹幕发送功能（输入框 + 发送逻辑）
  - [x] SubTask 9.3: 实现弹幕自定义选项（速度/透明度/字体大小/密度）
  - [x] SubTask 9.4: 实现弹幕屏蔽与过滤（关键词过滤/用户屏蔽/类型过滤）
  - [x] SubTask 9.5: 实现弹幕密度自适应与防重叠算法

## Phase 4: 在线音乐集成模块

- [ ] Task 10: 实现网易云音乐 API 集成
  - [ ] SubTask 10.1: 部署网易云音乐 API 服务（基于 https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced）
  - [ ] SubTask 10.2: 封装网易云 API 客户端（TypeScript），实现请求/响应类型定义
  - [ ] SubTask 10.3: 实现音乐搜索功能（关键词/歌手/专辑搜索）
  - [ ] SubTask 10.4: 实现在线播放功能（流式播放 + 缓存）
  - [ ] SubTask 10.5: 实现收藏功能（收藏/取消收藏/收藏列表）
  - [ ] SubTask 10.6: 实现歌单浏览与创建（推荐歌单/用户歌单/创建歌单）
  - [ ] SubTask 10.7: 实现音乐下载功能（标准/高品质/无损音质选择）
  - [ ] SubTask 10.8: 实现评论系统（查看评论/发表评论/点赞）
  - [ ] SubTask 10.9: 实现网络异常处理（超时重试/离线提示/缓存降级）

- [ ] Task 11: 实现酷狗概念版 API 集成
  - [ ] SubTask 11.1: 部署酷狗概念版 API 服务（基于 https://github.com/MakcRe/KuGouMusicApi）
  - [ ] SubTask 11.2: 封装酷狗 API 客户端（TypeScript），实现请求/响应类型定义
  - [ ] SubTask 11.3: 实现音乐搜索功能
  - [ ] SubTask 11.4: 实现在线播放功能
  - [ ] SubTask 11.5: 实现个性化推荐功能
  - [ ] SubTask 11.6: 实现网络异常处理

- [x] Task 12: 实现在线音乐统一界面
  - [x] SubTask 12.1: 设计在线音乐统一搜索界面（多源聚合搜索）
  - [x] SubTask 12.2: 实现音乐源切换（网易云/酷狗）
  - [x] SubTask 12.3: 实现在线音乐与本地音乐库的无缝切换

## Phase 5: 哔哩哔哩集成模块

- [x] Task 13: 实现哔哩哔哩 API 集成
  - [x] SubTask 13.1: 集成哔哩哔哩 API 库（基于 https://github.com/Nemo2011/bilibili-api）
  - [x] SubTask 13.2: 封装哔哩哔哩 API 客户端（TypeScript），实现请求/响应类型定义
  - [x] SubTask 13.3: 实现用户账户功能（登录/登出/个人信息/收藏同步）
  - [x] SubTask 13.4: 实现视频搜索功能
  - [x] SubTask 13.5: 实现在线视频流播放（多清晰度选择：360P/480P/720P/1080P/4K）
  - [x] SubTask 13.6: 实现视频下载功能（多线程下载 + 清晰度/格式选择）
  - [x] SubTask 13.7: 实现弹幕获取与显示（复用本地弹幕引擎）
  - [x] SubTask 13.8: 实现评论功能（查看/发表/点赞）
  - [x] SubTask 13.9: 实现网络异常处理

## Phase 6: 质量保障与性能优化

- [x] Task 14: 实现测试体系
  - [x] SubTask 14.1: 配置 Vitest 单元测试框架
  - [x] SubTask 14.2: 编写核心播放引擎单元测试
  - [x] SubTask 14.3: 编写元数据提取单元测试
  - [x] SubTask 14.4: 编写 API 客户端单元测试（含 Mock）
  - [x] SubTask 14.5: 编写音乐库管理单元测试
  - [x] SubTask 14.6: 编写字幕解析单元测试
  - [x] SubTask 14.7: 编写弹幕系统单元测试
  - [x] SubTask 14.8: 配置 Playwright 集成测试框架
  - [x] SubTask 14.9: 编写主要功能路径集成测试
  - [x] SubTask 14.10: 确保核心功能测试覆盖率 ≥ 80%

- [x] Task 15: 实现错误处理与故障恢复
  - [x] SubTask 15.1: 实现全局错误边界（React Error Boundary）
  - [x] SubTask 15.2: 实现 Rust 端 panic hook 与错误恢复
  - [x] SubTask 15.3: 实现播放状态持久化（崩溃后恢复播放进度）
  - [x] SubTask 15.4: 实现网络请求统一重试机制
  - [x] SubTask 15.5: 实现日志系统（结构化日志 + 错误上报）

- [x] Task 16: 性能优化
  - [x] SubTask 16.1: 实现音频解码 Rust Worker 线程，避免阻塞主线程
  - [x] SubTask 16.2: 实现视频解码硬件加速
  - [x] SubTask 16.3: 优化音乐库扫描性能（并行扫描 + 增量索引）
  - [x] SubTask 16.4: 优化前端渲染性能（虚拟列表 + 懒加载）
  - [x] SubTask 16.5: 优化内存使用（媒体资源及时释放 + 缓存策略）
  - [x] SubTask 16.6: 进行长时间运行测试（24h+），确保无内存泄漏

## Phase 7: 发布与部署

- [x] Task 17: 构建与发布
  - [x] SubTask 17.1: 配置 Tauri 构建管道（CI/CD）
  - [x] SubTask 17.2: 生成 Windows 安装程序（MSI + NSIS），支持静默安装
  - [x] SubTask 17.3: 实现自动更新机制（Tauri Updater）
  - [x] SubTask 17.4: 在 Windows 7/8/10/11 上进行兼容性测试
  - [x] SubTask 17.5: 进行性能测试、安全测试
  - [x] SubTask 17.6: 准备发布说明文档

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 2]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 2]
- [Task 8] depends on [Task 7]
- [Task 9] depends on [Task 7]
- [Task 10] depends on [Task 2]
- [Task 11] depends on [Task 2]
- [Task 12] depends on [Task 10, Task 11]
- [Task 13] depends on [Task 9, Task 2]
- [Task 14] depends on [Task 4, Task 5, Task 6, Task 7, Task 8, Task 9, Task 10, Task 11, Task 13]
- [Task 15] depends on [Task 2]
- [Task 16] depends on [Task 4, Task 6, Task 7]
- [Task 17] depends on [Task 14, Task 15, Task 16]

# Parallelizable Work
- Task 4, Task 7 可并行开发（本地音频与本地视频模块独立）
- Task 10, Task 11 可并行开发（网易云与酷狗 API 集成独立）
- Task 8, Task 9 可并行开发（字幕与弹幕系统独立）
- Task 15, Task 16 可部分并行（错误处理与性能优化侧重点不同）
