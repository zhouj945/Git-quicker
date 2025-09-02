# 快速开始

本指南将帮助您快速上手 gIt-quicker，在几分钟内掌握基本用法。

## 第一步：初始化

在开始使用之前，请确保已经 [安装](./installation.md) 了 gIt-quicker。

```bash
# 初始化配置
gq init
```

这会创建配置文件并设置默认的快捷指令。

## 第二步：查看可用命令

```bash
# 查看所有快捷指令
gq list

# 查看帮助信息
gq --help
```

## 基本用法示例

### 1. 使用快捷指令

```bash
# 查看状态（相当于 git status）
gq gst

# 切换分支（相当于 git checkout main）
gq gco main

# 添加所有文件（相当于 git add .）
gq gaa
```

### 2. 交互式提交

```bash
# 启动交互式提交流程
gq commit

# 或使用简写
gq c
```

这会引导您：
1. 选择提交类型（feat, fix, docs 等）
2. 输入提交范围（可选）
3. 输入提交描述
4. 输入详细描述（可选）
5. 确认并提交

### 3. 分支管理

```bash
# 查看所有分支和描述
gq gbr

# 为当前分支设置描述
gq bdesc "这是一个功能分支"

# 为指定分支设置描述
gq branch-desc feature/login "用户登录功能"
```

### 4. 自定义快捷指令

```bash
# 添加新的快捷指令
gq set gps "git push --set-upstream origin"

# 使用新的快捷指令
gq gps main

# 删除快捷指令
gq remove gps
```

## 常用工作流程

### 日常开发流程

```bash
# 1. 查看当前状态
gq gst

# 2. 切换到开发分支
gq gco develop

# 3. 拉取最新代码
gq gpl

# 4. 创建功能分支
gq create-branch
# 按提示输入分支名和描述

# 5. 开发完成后，查看更改
gq gdiff

# 6. 提交更改
gq commit

# 7. 推送分支
gq gps
```

### 分支管理流程

```bash
# 1. 查看所有分支
gq gbr

# 2. 为分支添加描述
gq bdesc "支付系统重构"

# 3. 切换分支
gq switch-branch

# 4. 删除不需要的分支
gq bd old-feature deprecated-branch
```

### 工作树管理流程

```bash
# 1. 查看现有工作树
gq wt -l

# 2. 创建新工作树
gq wt -a
# 按提示选择路径和分支

# 3. 切换工作树
gq wt -w

# 4. 清理无效引用
gq wt -p
```

## 高级功能

### Cherry-pick 操作

```bash
# 交互式 cherry-pick
gq cp -p

# 批量 cherry-pick
gq cp -b

# 处理冲突后继续
gq cp -c

# 跳过当前提交
gq cp -s

# 取消操作
gq cp -a
```

### 修改提交

```bash
# 修改最后一次提交
gq amend

# 查看提交统计
gq stats
```

## 配置管理

### 查看配置

```bash
# 查看配置信息
gq config
```

### 备份和恢复

配置文件会自动备份到 `~/.quicker-git/backup/` 目录。

```bash
# 卸载时会自动备份
gq uninstall
```

## 实用技巧

### 1. 命令组合

```bash
# 快速提交流程
gq gst && gq gaa && gq commit
```

### 2. 分支描述最佳实践

为分支添加有意义的描述：

```bash
gq bdesc "feat: 用户认证系统 - 实现登录、注册、密码重置功能"
gq bdesc "fix: 修复支付页面在 Safari 浏览器的显示问题"
gq bdesc "refactor: 重构数据库连接层，提高性能和可维护性"
```

### 3. 快捷指令命名规范

建议使用一致的命名规范：

```bash
# Git 原生命令的简写
gq set gco "git checkout"
gq set gst "git status"
gq set gaa "git add ."

# 带参数的常用命令
gq set gps "git push --set-upstream origin"
gq set gpl "git pull --rebase"

# 复杂的组合命令
gq set gsync "git fetch origin && git rebase origin/main"
```

### 4. 工作树使用场景

工作树特别适合以下场景：

- 同时开发多个功能
- 紧急修复 bug 而不影响当前开发
- 代码审查时需要切换分支
- 运行不同版本的测试

## 常见问题

### Q: 如何恢复误删的快捷指令？

A: 快捷指令会自动备份，可以从备份文件恢复：

```bash
# 查看备份文件
ls ~/.quicker-git/backup/

# 手动恢复或重新初始化
gq init
```

### Q: 提交时如何跳过 pre-commit 钩子？

A: 使用原生 Git 命令：

```bash
git commit -m "message" --no-verify
```

### Q: 如何在不同项目中使用不同的快捷指令？

A: 目前快捷指令是全局的。如需项目特定配置，可以使用 Git 别名：

```bash
git config alias.co checkout
```

## 下一步

现在您已经掌握了基本用法，可以：

1. 查看 [功能特性](./features.md) 了解所有功能
2. 阅读 [命令参考](./commands.md) 获取详细的命令说明
3. 查看 [配置说明](./configuration.md) 了解高级配置选项

开始享受更高效的 Git 工作流程吧！ 🚀
