#!/bin/bash

# Quicker Git 发布准备脚本
# 用于准备 npm 包发布

set -e

echo "🚀 开始准备 Quicker Git 发布..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf dist/
rm -rf node_modules/.cache/

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 运行 linting
echo "🔍 运行代码检查..."
npm run lint

# 运行测试
echo "🧪 运行测试..."
npm test

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

if [ ! -f "dist/cli.js" ]; then
    echo "❌ 构建失败: cli.js 不存在"
    exit 1
fi

# 测试构建后的 CLI
echo "🧪 测试构建后的 CLI..."
node dist/cli.js --version

# 检查包大小
echo "📊 检查包大小..."
npm pack --dry-run

echo "✅ 发布准备完成！"
echo ""
echo "📋 下一步操作（自动发布流程）:"
echo "1. 使用版本命令创建 tag："
echo "   npm run release:patch  # 补丁版本 (3.0.0 -> 3.0.1)"
echo "   npm run release:minor  # 次要版本 (3.0.0 -> 3.1.0)"
echo "   npm run release:major  # 主要版本 (3.0.0 -> 4.0.0)"
echo ""
echo "2. GitHub Actions 将自动执行以下操作："
echo "   ✓ 验证版本号与 tag 是否匹配"
echo "   ✓ 运行 lint、test、build"
echo "   ✓ 验证构建产物"
echo "   ✓ 发布到 npm"
echo "   ✓ 验证发布结果"
echo ""
echo "💡 提示：此脚本仅用于本地验证，不会实际发布到 npm"
echo "🎉 准备就绪！"
