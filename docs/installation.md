# 安装指南

本文档详细介绍如何安装和配置 gIt-quicker。

## 系统要求

在安装之前，请确保您的系统满足以下要求：

### 必需软件

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0 或 **yarn** >= 1.0.0
- **Git** >= 2.0.0

### 支持的操作系统

- macOS 10.14+
- Linux (Ubuntu 18.04+, CentOS 7+, 其他主流发行版)
- Windows 10+ (推荐使用 WSL2)

## 安装方法

### 方法一：npm 全局安装（推荐）

```bash
# 使用 npm
npm install -g git-quicker

# 使用 yarn
yarn global add git-quicker
```

### 方法二：从源码安装

```bash
# 克隆仓库
git clone https://github.com/your-username/git-quicker.git
cd git-quicker

# 安装依赖
npm install

# 构建项目
npm run build

# 全局链接
npm link
```

### 方法三：使用 npx（临时使用）

```bash
# 直接运行，无需安装
npx git-quicker --help
```

## 验证安装

安装完成后，验证是否安装成功：

```bash
# 检查版本
gq --version

# 查看帮助信息
gq --help

# 检查命令是否可用
which gq
```

如果看到版本信息和帮助内容，说明安装成功。

## 初始化配置

首次使用前，需要初始化配置：

```bash
# 初始化配置文件和默认快捷指令
gq init
```

这个命令会：
- 创建配置目录 `~/.git-quicker/`
- 生成默认的快捷指令配置
- 初始化分支描述文件
- 创建备份目录

## 配置文件位置

gIt-quicker 的配置文件存储在用户主目录下：

```
~/.git-quicker/
├── shortcuts.json           # 快捷指令配置
├── branch-descriptions.json # 分支描述配置
└── backup/                  # 配置备份目录
    ├── shortcuts-*.json
    └── branch-descriptions-*.json
```

## 默认快捷指令

初始化后，系统会预设以下快捷指令：

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

## 环境变量配置

您可以通过环境变量自定义一些行为：

```bash
# 启用调试模式
export DEBUG=1

# 自定义配置目录（可选）
export QUICKER_GIT_CONFIG_DIR="$HOME/.config/git-quicker"
```

## 命令别名

gIt-quicker 提供两个命令别名：

- `gq` - 主要命令（推荐）
- `git-quicker` - 完整命令名

两个命令功能完全相同，推荐使用较短的 `gq`。

## 更新

### 更新到最新版本

```bash
# 使用 npm
npm update -g git-quicker

# 使用 yarn
yarn global upgrade git-quicker
```

### 检查更新

```bash
# 检查当前版本
gq --version

# 检查是否有新版本
npm outdated -g git-quicker
```

## 卸载

如果需要卸载 gIt-quicker：

```bash
# 备份配置（可选）
gq uninstall

# 卸载包
npm uninstall -g git-quicker

# 手动删除配置目录（如果需要）
rm -rf ~/.git-quicker
```

## 故障排除

### 常见问题

#### 1. 命令未找到

```bash
gq: command not found
```

**解决方案：**
- 确保 Node.js 和 npm 已正确安装
- 检查 npm 全局 bin 目录是否在 PATH 中
- 重新安装：`npm install -g git-quicker`

#### 2. 权限错误

```bash
EACCES: permission denied
```

**解决方案：**
- 使用 `sudo` 安装（不推荐）
- 配置 npm 使用不同的目录：
  ```bash
  mkdir ~/.npm-global
  npm config set prefix '~/.npm-global'
  echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
  source ~/.bashrc
  ```

#### 3. Git 仓库检测失败

```bash
当前目录不是 Git 仓库
```

**解决方案：**
- 确保在 Git 仓库目录中运行命令
- 初始化 Git 仓库：`git init`

#### 4. 配置文件损坏

如果配置文件损坏，可以重新初始化：

```bash
# 备份现有配置
mv ~/.git-quicker ~/.git-quicker.backup

# 重新初始化
gq init
```

### 获取帮助

如果遇到其他问题：

1. 查看详细帮助：`gq --help`
2. 检查配置信息：`gq config`
3. 查看 [常见问题](./faq.md)
4. 提交 Issue 到 GitHub 仓库

## 下一步

安装完成后，建议阅读：

- [快速开始](./quick-start.md) - 了解基本用法
- [功能特性](./features.md) - 探索所有功能
- [命令参考](./commands.md) - 查看详细的命令说明
