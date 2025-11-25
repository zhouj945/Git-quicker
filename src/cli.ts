#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './config/ConfigManager.js';
import { ShortcutCommand } from './commands/ShortcutCommand.js';
import { CommitCommand } from './commands/CommitCommand.js';
import { BranchCommand } from './commands/BranchCommand.js';
import { WorktreeCommand } from './commands/WorktreeCommand.js';
import { CherryPickCommand } from './commands/CherryPickCommand.js';
import { Logger } from './utils/Logger.js';
import { GitUtils } from './utils/GitUtils.js';

/**
 * Quicker Git CLI 主程序
 * 提供简化和增强的 Git 操作命令行工具
 */
class QuickerGitCLI {
  private program: Command;
  private configManager: ConfigManager;
  private shortcutCommand: ShortcutCommand;
  private commitCommand: CommitCommand;
  private branchCommand: BranchCommand;
  private worktreeCommand: WorktreeCommand;
  private cherryPickCommand: CherryPickCommand;

  constructor() {
    this.program = new Command();
    this.configManager = new ConfigManager();
    this.shortcutCommand = new ShortcutCommand();
    this.commitCommand = new CommitCommand();
    this.branchCommand = new BranchCommand();
    this.worktreeCommand = new WorktreeCommand();
    this.cherryPickCommand = new CherryPickCommand();
    
    this.setupCommands();
  }

  /**
   * 设置所有命令
   */
  private setupCommands(): void {
    this.program
      .name('gq')
      .description('一个简化和增强 Git 操作的 TypeScript 命令行工具')
      .version('1.0.0');

    // 初始化命令
    this.program
      .command('init')
      .description('初始化配置并同步分支信息')
      .action(async () => {
        try {
          await this.configManager.init();
        } catch (error) {
          Logger.error(`初始化失败: ${error}`);
          process.exit(1);
        }
      });

    // 快捷指令管理
    this.setupShortcutCommands();
    
    // 提交管理
    this.setupCommitCommands();
    
    // 分支管理
    this.setupBranchCommands();
    
    // 工作树管理
    this.setupWorktreeCommands();
    
    // Cherry-pick 管理
    this.setupCherryPickCommands();
    
    // 配置管理
    this.setupConfigCommands();

    // 动态快捷指令处理
    this.setupDynamicShortcuts();
  }

  /**
   * 设置快捷指令相关命令
   */
  private setupShortcutCommands(): void {
    // 列出快捷指令
    this.program
      .command('list')
      .alias('ls')
      .description('显示所有快捷指令')
      .action(async () => {
        await this.shortcutCommand.listShortcuts();
      });

    // 设置快捷指令
    this.program
      .command('set <key> <command...>')
      .description('设置快捷指令')
      .action(async (key: string, commandParts: string[]) => {
        const command = commandParts.join(' ');
        await this.shortcutCommand.setShortcut(key, command);
      });

    // 删除快捷指令
    this.program
      .command('remove <key>')
      .alias('rm')
      .description('删除快捷指令')
      .action(async (key: string) => {
        await this.shortcutCommand.removeShortcut(key);
      });

    // 执行快捷指令
    this.program
      .command('run <key> [args...]')
      .description('执行快捷指令')
      .action(async (key: string, args: string[]) => {
        await this.shortcutCommand.runShortcut(key, args);
      });
  }

  /**
   * 设置提交相关命令
   */
  private setupCommitCommands(): void {
    // 交互式提交
    this.program
      .command('commit')
      .alias('c')
      .description('交互式提交，支持类型选择')
      .action(async () => {
        await this.commitCommand.interactiveCommit();
      });

    // 修改最后一次提交
    this.program
      .command('amend')
      .description('修改最后一次提交')
      .action(async () => {
        await this.commitCommand.amendCommit();
      });

    // 提交统计
    this.program
      .command('stats')
      .description('显示提交统计信息')
      .action(async () => {
        await this.commitCommand.showCommitStats();
      });
  }

  /**
   * 设置分支相关命令
   */
  private setupBranchCommands(): void {
    // 显示分支列表
    this.program
      .command('gbr')
      .description('显示所有分支和描述（包含工作树路径）')
      .action(async () => {
        await this.branchCommand.showBranches();
      });

    // 设置分支描述
    this.program
      .command('branch-desc [description...]')
      .alias('bdesc')
      .description('设置分支描述')
      .option('-b, --branch <branch>', '指定分支名')
      .action(async (descriptionParts: string[], options: any) => {
        const targetBranch = options.branch;
        const description = descriptionParts ? descriptionParts.join(' ') : undefined;
        await this.branchCommand.setBranchDescription(targetBranch, description);
      });

    // 批量删除分支
    this.program
      .command('bd <branches...>')
      .description('批量删除分支（带确认）')
      .option('-f, --force', '强制删除')
      .action(async (branches: string[], options: any) => {
        await this.branchCommand.batchDeleteBranches(branches, options.force);
      });

    // 创建分支
    this.program
      .command('create-branch')
      .alias('cb')
      .description('交互式创建分支')
      .action(async () => {
        await this.branchCommand.createBranch();
      });

    // 切换分支
    this.program
      .command('switch-branch')
      .alias('sb')
      .description('交互式切换分支')
      .action(async () => {
        await this.branchCommand.switchBranch();
      });
  }

  /**
   * 设置工作树相关命令
   */
  private setupWorktreeCommands(): void {
    const worktreeCmd = this.program
      .command('worktree')
      .alias('wt')
      .description('工作树管理');

    worktreeCmd
      .option('-l, --list', '显示所有工作树')
      .option('-a, --add', '添加新工作树')
      .option('-r, --remove', '删除工作树')
      .option('-p, --prune', '清理工作树引用')
      .option('-s, --status', '检查工作树状态')
      .option('-w, --switch', '切换工作树')
      .action(async (options: any) => {
        if (options.list) {
          await this.worktreeCommand.listWorktrees();
        } else if (options.add) {
          await this.worktreeCommand.addWorktree();
        } else if (options.remove) {
          await this.worktreeCommand.removeWorktree();
        } else if (options.prune) {
          await this.worktreeCommand.pruneWorktrees();
        } else if (options.status) {
          await this.worktreeCommand.checkWorktreeStatus();
        } else if (options.switch) {
          await this.worktreeCommand.switchWorktree();
        } else {
          await this.worktreeCommand.listWorktrees();
        }
      });
  }

  /**
   * 设置 Cherry-pick 相关命令
   */
  private setupCherryPickCommands(): void {
    const cherryPickCmd = this.program
      .command('cherry-pick')
      .alias('cp')
      .description('Cherry-pick 操作');

    cherryPickCmd
      .option('-p, --pick', '执行 cherry-pick')
      .option('-c, --continue', '继续 cherry-pick（解决冲突后）')
      .option('-s, --skip', '跳过当前提交')
      .option('-a, --abort', '取消 cherry-pick 操作')
      .option('-b, --batch', '批量 cherry-pick')
      .option('--status', '显示 cherry-pick 状态')
      .action(async (options: any) => {
        if (options.status) {
          await this.cherryPickCommand.showCherryPickStatus();
        } else {
          await this.cherryPickCommand.cherryPick(options);
        }
      });
  }

  /**
   * 设置配置相关命令
   */
  private setupConfigCommands(): void {
    // 显示配置信息
    this.program
      .command('config')
      .alias('info')
      .description('显示配置信息')
      .action(async () => {
        try {
          const configInfo = await this.configManager.getConfigInfo();
          Logger.title('配置信息');
          Logger.keyValue('配置目录', configInfo.configDir);
          Logger.keyValue('快捷指令数量', configInfo.shortcutsCount.toString());
          
          Logger.separator();
          Logger.info('详细配置:');
          console.log(JSON.stringify(configInfo, null, 2));
        } catch (error) {
          Logger.error(`获取配置信息失败: ${error}`);
        }
      });

    // 卸载工具
    this.program
      .command('uninstall')
      .description('卸载工具（会备份配置）')
      .action(async () => {
        try {
          await this.configManager.uninstall();
          Logger.success('工具已卸载，配置已备份');
        } catch (error) {
          Logger.error(`卸载失败: ${error}`);
        }
      });
  }

  /**
   * 设置动态快捷指令处理
   * 允许直接执行快捷指令，如 gq gco main
   */
  private setupDynamicShortcuts(): void {
    // 动态快捷指令处理将在 run 方法中处理
  }

  /**
   * 运行 CLI
   */
  public async run(): Promise<void> {
    try {
      // 如果没有参数，显示帮助信息
      if (process.argv.length <= 2) {
        this.program.help();
        return;
      }

      // 检查是否为快捷指令
      const potentialShortcut = process.argv[2];
      const knownCommands = [
        'init', 'list', 'ls', 'set', 'remove', 'rm', 'run',
        'commit', 'c', 'amend', 'stats',
        'gbr', 'branch-desc', 'bdesc', 'bd', 'create-branch', 'cb', 'switch-branch', 'sb',
        'worktree', 'wt', 'cherry-pick', 'cp',
        'config', 'info', 'uninstall', 'help', '--help', '-h', '--version', '-V'
      ];

      if (!knownCommands.includes(potentialShortcut)) {
        // 可能是快捷指令，尝试执行
        try {
          const shortcuts = await this.configManager.getShortcuts();
          if (shortcuts[potentialShortcut]) {
            const shortcutArgs = process.argv.slice(3);
            await this.shortcutCommand.runShortcut(potentialShortcut, shortcutArgs);
            return;
          }
        } catch (error) {
          // 如果获取快捷指令失败，继续正常的命令解析
        }
      }

      await this.program.parseAsync(process.argv);
    } catch (error) {
      Logger.error(`命令执行失败: ${error}`);
      process.exit(1);
    }
  }
}

// 运行 CLI
const cli = new QuickerGitCLI();
cli.run().catch((error) => {
  Logger.error(`程序运行失败: ${error}`);
  process.exit(1);
});
