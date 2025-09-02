# Quicker Git 🚀

一个简化和增强 Git 操作的 TypeScript 命令行工具，让您的 Git 工作流更加高效！

[![npm version](https://badge.fury.io/js/quicker-git.svg)](https://badge.fury.io/js/quicker-git)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## ✨ 功能特性

- **🎯 快捷指令管理**：自定义 Git 命令快捷方式，支持一键执行
- **🌿 智能分支管理**：分支描述、批量删除、创建分支、工作树显示
- **📝 快速提交**：交互式提交类型选择，支持修改最后一次提交
- **🌳 工作树管理**：创建、删除、查看多个工作树
- **🍒 Cherry-pick 支持**：交互式选择提交进行 cherry-pick
- **🎨 美观输出**：彩色终端输出，清晰易读
- **⚡ 不阻塞终端**：提交开始后立即返回，可继续其他操作
- **🔍 完整透明度**：显示 lint 检查过程，就像直接使用 `git commit`

## 📦 安装

```bash
# 全局安装
npm install -g quicker-git

# 或者使用 yarn
yarn global add quicker-git
```

## 🚀 快速开始

```bash
# 初始化配置并同步分支信息
qg init

# 查看所有快捷指令
qg list

# 设置快捷指令
qg set gco "git checkout"
qg set gst "git status"

# 直接执行快捷指令
qg gco main
qg gst

# 交互式提交
qg commit
```

## 📋 主要命令

### 快捷指令管理

```bash
qg list                    # 查看所有快捷指令
qg set <key> <command>     # 设置快捷指令
qg remove <key>            # 删除快捷指令
qg <key> [args...]         # 直接执行快捷指令
```

### 快速提交

```bash
qg commit                  # 交互式提交，支持类型选择
qg c                       # 简写形式
qg amend                   # 修改最后一次提交
```

**提交流程特性：**
- 🔍 **显示 lint 检查过程**：完整显示项目配置的 pre-commit 钩子执行过程
- ⚡ **不阻塞终端**：提交开始后立即返回，可继续其他操作
- 🎯 **原生体验**：就像直接使用 `git commit` 一样的透明度

### 分支管理

```bash
qg gbr                     # 显示所有分支和描述（包含工作树路径）
qg bdesc "分支描述"         # 设置当前分支描述
qg branch-desc <branch> "描述"  # 设置指定分支描述
qg bd <branch1> <branch2>  # 批量删除分支（带确认）
qg create-branch           # 交互式创建分支
qg switch-branch           # 交互式切换分支
```

### 工作树管理

```bash
qg wt -l                   # 显示所有工作树
qg wt -a                   # 添加新工作树
qg wt -r                   # 删除工作树
qg wt -p                   # 清理工作树引用
```

### Cherry-pick 操作

```bash
qg cp -p                   # 执行 cherry-pick
qg cp -c                   # 继续 cherry-pick（解决冲突后）
qg cp -s                   # 跳过当前提交
qg cp -a                   # 取消 cherry-pick 操作
qg cp -b                   # 批量 cherry-pick
```

## 🎨 提交类型

支持标准的提交类型：

- `feat` - 新功能
- `fix` - 修复bug
- `docs` - 文档更新
- `style` - 代码格式调整
- `refactor` - 重构代码
- `test` - 测试相关
- `chore` - 构建/工具链
- `perf` - 性能优化
- `ci` - CI/CD相关
- `build` - 构建系统
- `revert` - 回滚提交

## 📁 默认快捷指令

工具预设了13个常用快捷指令：

| 快捷键 | Git 命令 | 描述 |
|--------|----------|------|
| `gco` | `git checkout` | 切换分支或恢复文件 |
| `gst` | `git status` | 查看工作区状态 |
| `gaa` | `git add .` | 添加所有文件到暂存区 |
| `gcm` | `git commit -m` | 提交更改 |
| `gps` | `git push` | 推送到远程仓库 |
| `gpl` | `git pull` | 从远程仓库拉取 |
| `gbr` | `git branch -v` | 查看分支详情 |
| `gbd` | `git branch -d` | 删除分支 |
| `glog` | `git log --oneline -10` | 查看最近10条提交 |
| `gdiff` | `git diff` | 查看文件差异 |
| `gstash` | `git stash` | 暂存工作区更改 |
| `gpop` | `git stash pop` | 恢复暂存的更改 |
| `greset` | `git reset --hard HEAD` | 重置到最新提交 |

## 🔧 配置文件

配置文件存储在用户主目录下：

- **快捷指令配置**：`~/.quicker-git/shortcuts.json`
- **分支描述**：`~/.quicker-git/branch-descriptions.json`
- **配置备份**：`~/.quicker-git/backup/` （自动备份）

```bash
# 查看配置信息
qg config

# 卸载工具（会备份配置）
qg uninstall
```

## 📚 完整文档

查看 [docs](./docs/) 目录获取完整文档：

- [安装指南](./docs/installation.md) - 详细安装说明
- [快速开始](./docs/quick-start.md) - 快速上手指南
- [功能特性](./docs/features.md) - 完整功能清单
- [命令参考](./docs/commands.md) - 所有命令详细说明
- [配置说明](./docs/configuration.md) - 配置文件和自定义设置

## 🛠 开发

```bash
# 克隆项目
git clone <repository-url>
cd quicker-git

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 本地安装进行测试
npm link
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🙏 致谢

本项目灵感来源于 [git-quicker](https://www.npmjs.com/package/git-quicker)，使用 TypeScript 重新实现并增强了功能。

---

让 Git 操作更简单，让开发更高效！ 🎉
