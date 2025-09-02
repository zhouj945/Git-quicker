# Quicker Git 📚

一个简化和增强 Git 操作的 TypeScript 命令行工具，让您的 Git 工作流更加高效！

## 📖 文档目录

- [安装指南](./installation.md) - 详细的安装说明
- [快速开始](./quick-start.md) - 快速上手指南
- [功能特性](./features.md) - 完整功能清单
- [命令参考](./commands.md) - 所有命令的详细说明
- [配置说明](./configuration.md) - 配置文件和自定义设置
- [开发指南](./development.md) - 开发和贡献指南
- [常见问题](./faq.md) - 常见问题解答
- [更新日志](./changelog.md) - 版本更新记录

## 🚀 核心特性

### ✨ 快捷指令管理
- 自定义 Git 命令快捷方式
- 支持一键执行和参数传递
- 预设13个常用快捷指令

### 🌿 智能分支管理
- 分支描述管理
- 批量删除分支
- 交互式创建和切换分支
- 工作树路径显示

### 📝 快速提交
- 交互式提交类型选择
- 支持修改最后一次提交
- 完整的 lint 检查过程显示
- 不阻塞终端的异步提交

### 🌳 工作树管理
- 创建、删除、查看多个工作树
- 工作树状态检查
- 快速切换工作树

### 🍒 Cherry-pick 支持
- 交互式选择提交进行 cherry-pick
- 批量 cherry-pick 操作
- 冲突处理和状态管理

### 🎨 美观输出
- 彩色终端输出
- 表格化数据显示
- 清晰的状态提示

## 📋 快速命令参考

```bash
# 初始化配置
qg init

# 快捷指令管理
qg list                    # 查看所有快捷指令
qg set gco "git checkout"  # 设置快捷指令
qg gco main               # 直接执行快捷指令

# 快速提交
qg commit                 # 交互式提交
qg amend                  # 修改最后一次提交

# 分支管理
qg gbr                    # 查看分支列表和描述
qg bdesc "分支描述"        # 设置当前分支描述
qg bd old-branch          # 删除分支

# 工作树管理
qg wt -l                  # 查看工作树
qg wt -a                  # 添加工作树

# Cherry-pick
qg cp -p                  # 执行 cherry-pick
qg cp -c                  # 继续 cherry-pick
```

## 🛠 系统要求

- Node.js >= 14.0.0
- Git >= 2.0.0
- 支持的操作系统：macOS, Linux, Windows

## 📦 安装

```bash
# 全局安装
npm install -g quicker-git

# 或使用 yarn
yarn global add quicker-git
```

## 🎯 设计理念

Quicker Git 的设计遵循以下原则：

1. **简化操作** - 将复杂的 Git 操作简化为直观的命令
2. **提高效率** - 减少重复输入，提供快捷方式
3. **增强体验** - 美观的输出和友好的交互
4. **保持透明** - 显示完整的执行过程，不隐藏细节
5. **类型安全** - 使用 TypeScript 确保代码质量

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

请查看 [开发指南](./development.md) 了解如何参与项目开发。

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

---

让 Git 操作更简单，让开发更高效！ 🎉
