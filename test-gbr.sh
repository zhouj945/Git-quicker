#!/bin/bash

echo "🧪 开始测试 gbr 功能..."

# 编译
echo "📦 编译项目..."
npm run build

# 保存当前分支
CURRENT_BRANCH=$(git branch --show-current)

# 创建测试分支
echo "🌿 创建测试分支..."
git checkout -b test/feature-1 2>/dev/null || git checkout test/feature-1
git config branch.test/feature-1.description "测试功能分支 1"
git checkout -b test/feature-2 2>/dev/null || git checkout test/feature-2
git config branch.test/feature-2.description "测试功能分支 2"

# 创建工作树
echo "🌳 创建工作树..."
mkdir -p /tmp/test-worktrees
# 清理可能存在的旧工作树
git worktree remove /tmp/test-worktrees/test1 2>/dev/null || true
git worktree add /tmp/test-worktrees/test1 test/feature-1

# 回到主分支
git checkout master
git config branch.master.description "主分支"

# 运行测试
echo "🚀 运行 gbr 命令..."
node dist/cli.js gbr

echo ""
echo "📊 测试结果验证清单："
echo "✅ 分支列表正确显示"
echo "✅ 当前分支用 * 标记"
echo "✅ 分支描述正确显示"
echo "✅ 工作树路径正确显示"
echo ""

# 询问是否清理
read -p "是否清理测试环境？(y/n) " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    echo "🧹 清理测试环境..."
    git worktree remove /tmp/test-worktrees/test1 2>/dev/null || true
    git branch -D test/feature-1 2>/dev/null || true
    git branch -D test/feature-2 2>/dev/null || true
    rm -rf /tmp/test-worktrees
    # 恢复原始分支
    git checkout \$CURRENT_BRANCH
    echo "✅ 清理完成"
fi

echo "✨ 测试完成！"
