/**
 * 快捷指令配置接口
 */
export interface ShortcutConfig {
  [key: string]: string;
}

/**
 * 提交类型枚举
 */
export enum CommitType {
  FEAT = 'feat',
  FIX = 'fix',
  DOCS = 'docs',
  STYLE = 'style',
  REFACTOR = 'refactor',
  TEST = 'test',
  CHORE = 'chore',
  PERF = 'perf',
  CI = 'ci',
  BUILD = 'build',
  REVERT = 'revert'
}

/**
 * 提交类型描述映射
 */
export const COMMIT_TYPE_DESCRIPTIONS: Record<CommitType, string> = {
  [CommitType.FEAT]: '新功能',
  [CommitType.FIX]: '修复bug',
  [CommitType.DOCS]: '文档更新',
  [CommitType.STYLE]: '代码格式调整',
  [CommitType.REFACTOR]: '重构代码',
  [CommitType.TEST]: '测试相关',
  [CommitType.CHORE]: '构建/工具链',
  [CommitType.PERF]: '性能优化',
  [CommitType.CI]: 'CI/CD相关',
  [CommitType.BUILD]: '构建系统',
  [CommitType.REVERT]: '回滚提交'
};

/**
 * 工作树信息接口
 */
export interface WorktreeInfo {
  path: string;
  branch: string;
  commit: string;
  bare?: boolean;
  detached?: boolean;
}

/**
 * 分支信息接口
 */
export interface BranchInfo {
  name: string;
  current: boolean;
  remote?: string;
  description?: string;
  worktreePath?: string;
}

/**
 * Cherry-pick 选项接口
 */
export interface CherryPickOptions {
  continue?: boolean;
  skip?: boolean;
  abort?: boolean;
  batch?: boolean;
  pick?: boolean;
}

/**
 * 命令执行结果接口
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * 配置文件路径常量
 */
export const CONFIG_PATHS = {
  CONFIG_DIR: '.quicker-git',
  SHORTCUTS_FILE: 'shortcuts.json',
  BACKUP_DIR: 'backup'
} as const;
