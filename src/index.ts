/**
 * Quicker Git - 主入口文件
 * 导出所有公共 API 和类型定义
 */

// 导出核心类型
export * from './types';

// 导出配置管理器
export { ConfigManager } from './config/ConfigManager';

// 导出工具类
export { GitUtils } from './utils/GitUtils';
export { Logger } from './utils/Logger';

// 导出命令类
export { ShortcutCommand } from './commands/ShortcutCommand';
export { CommitCommand } from './commands/CommitCommand';
export { BranchCommand } from './commands/BranchCommand';
export { WorktreeCommand } from './commands/WorktreeCommand';
export { CherryPickCommand } from './commands/CherryPickCommand';

// 版本信息
export const VERSION = '1.0.0';
