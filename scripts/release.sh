#!/bin/bash

# Quicker Git 发布脚本
# 用于创建版本 tag 并推送到远程仓库，触发自动发布

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ 错误: 请指定版本类型${NC}"
    echo "用法: $0 [patch|minor|major]"
    echo ""
    echo "示例:"
    echo "  $0 patch  # 补丁版本 (3.0.0 -> 3.0.1)"
    echo "  $0 minor  # 次要版本 (3.0.0 -> 3.1.0)"
    echo "  $0 major  # 主要版本 (3.0.0 -> 4.0.0)"
    exit 1
fi

VERSION_TYPE=$1

# 验证版本类型
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}❌ 错误: 无效的版本类型 '$VERSION_TYPE'${NC}"
    echo "只能使用: patch, minor, 或 major"
    exit 1
fi

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ 错误: 存在未提交的更改${NC}"
    echo "请先提交或暂存所有更改后再创建版本"
    git status --short
    exit 1
fi

# 检查是否在正确的分支（可选，根据需要调整）
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${YELLOW}ℹ️  当前分支: $CURRENT_BRANCH${NC}"

# 获取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}📦 当前版本: $CURRENT_VERSION${NC}"

# 创建版本并获取新版本号
echo -e "${YELLOW}🔄 创建 $VERSION_TYPE 版本...${NC}"
if npm version $VERSION_TYPE --no-git-tag-version; then
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo -e "${GREEN}✅ 版本已更新: $CURRENT_VERSION -> $NEW_VERSION${NC}"
else
    echo -e "${RED}❌ npm version 命令失败${NC}"
    exit 1
fi

# 提交版本更改
echo -e "${YELLOW}📝 提交版本更改...${NC}"
if git add package.json package-lock.json && git commit -m "chore: bump version to $NEW_VERSION"; then
    echo -e "${GREEN}✅ 版本更改已提交${NC}"
else
    echo -e "${RED}❌ 提交失败${NC}"
    # 回滚 package.json 更改
    git checkout package.json package-lock.json
    exit 1
fi

# 创建 git tag
TAG_NAME="v$NEW_VERSION"
echo -e "${YELLOW}🏷️  创建 tag: $TAG_NAME${NC}"
if git tag -a "$TAG_NAME" -m "Release version $NEW_VERSION"; then
    echo -e "${GREEN}✅ Tag 已创建${NC}"
else
    echo -e "${RED}❌ 创建 tag 失败${NC}"
    # 回滚提交
    git reset --hard HEAD~1
    exit 1
fi

# 推送到远程
echo -e "${YELLOW}🚀 推送到远程仓库...${NC}"
if git push && git push --tags; then
    echo -e "${GREEN}✅ 推送成功${NC}"
    echo ""
    echo -e "${GREEN}🎉 发布流程已启动！${NC}"
    echo ""
    echo "📋 后续步骤:"
    echo "1. GitHub Actions 将自动运行发布流程"
    echo "2. 检查 Actions 运行状态: https://github.com/zhouj945/Git-quicker/actions"
    echo "3. 发布完成后验证: npm view @damon945/git-quicker version"
    echo ""
    echo -e "${YELLOW}💡 提示: 发布过程可能需要几分钟时间${NC}"
else
    echo -e "${RED}❌ 推送失败${NC}"
    echo ""
    echo "回滚操作:"
    echo "  git tag -d $TAG_NAME     # 删除本地 tag"
    echo "  git reset --hard HEAD~1  # 回滚提交"
    exit 1
fi
