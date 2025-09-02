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
echo "📋 下一步操作:"
echo "1. 检查版本号: npm version [patch|minor|major]"
echo "2. 发布到 npm: npm publish"
echo "3. 推送到 Git: git push && git push --tags"
echo ""
echo "🎉 准备就绪！"
