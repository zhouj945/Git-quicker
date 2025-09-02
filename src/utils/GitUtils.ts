import { execSync, spawn } from 'child_process';
import { BranchInfo, WorktreeInfo, CommandResult } from '../types';

/**
 * Git 工具类
 * 封装常用的 Git 操作和命令执行
 */
export class GitUtils {
  
  /**
   * 检查当前目录是否为 Git 仓库
   */
  public static isGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取当前分支名
   */
  public static getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    } catch (error) {
      throw new Error(`获取当前分支失败: ${error}`);
    }
  }

  /**
   * 获取所有本地分支信息
   */
  public static getBranches(): BranchInfo[] {
    try {
      const output = execSync('git branch -v', { encoding: 'utf-8' });
      const branches: BranchInfo[] = [];
      
      output.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          const isCurrent = trimmed.startsWith('*');
          const parts = trimmed.replace(/^\*?\s+/, '').split(/\s+/);
          if (parts.length >= 2) {
            branches.push({
              name: parts[0],
              current: isCurrent,
              remote: parts.length > 2 ? parts.slice(2).join(' ') : undefined
            });
          }
        }
      });
      
      return branches;
    } catch (error) {
      throw new Error(`获取分支信息失败: ${error}`);
    }
  }

  /**
   * 获取工作树信息
   */
  public static getWorktrees(): WorktreeInfo[] {
    try {
      const output = execSync('git worktree list --porcelain', { encoding: 'utf-8' });
      const worktrees: WorktreeInfo[] = [];
      const lines = output.split('\n');
      
      let currentWorktree: Partial<WorktreeInfo> = {};
      
      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          currentWorktree.path = line.substring(9);
        } else if (line.startsWith('HEAD ')) {
          currentWorktree.commit = line.substring(5);
        } else if (line.startsWith('branch ')) {
          currentWorktree.branch = line.substring(7);
        } else if (line === 'bare') {
          currentWorktree.bare = true;
        } else if (line === 'detached') {
          currentWorktree.detached = true;
        } else if (line === '') {
          // 空行表示一个工作树信息结束
          if (currentWorktree.path) {
            worktrees.push(currentWorktree as WorktreeInfo);
          }
          currentWorktree = {};
        }
      }
      
      // 处理最后一个工作树（如果没有结尾空行）
      if (currentWorktree.path) {
        worktrees.push(currentWorktree as WorktreeInfo);
      }
      
      return worktrees;
    } catch (error) {
      throw new Error(`获取工作树信息失败: ${error}`);
    }
  }

  /**
   * 检查工作区是否有未提交的更改
   */
  public static hasUncommittedChanges(): boolean {
    try {
      const output = execSync('git status --porcelain', { encoding: 'utf-8' });
      return output.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 检查暂存区是否有文件
   */
  public static hasStagedChanges(): boolean {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
      return output.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 执行 Git 命令（同步）
   */
  public static executeCommand(command: string): CommandResult {
    try {
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      return {
        success: true,
        message: output.trim(),
        data: output.trim()
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '命令执行失败',
        error: error.stderr || error.message
      };
    }
  }

  /**
   * 执行 Git 命令（异步，不阻塞终端）
   */
  public static executeCommandAsync(command: string, args: string[] = []): Promise<CommandResult> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: 'inherit', // 继承父进程的 stdio，让用户能看到输出
        shell: false // 不使用 shell，直接执行命令避免转义问题
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            message: '命令执行成功'
          });
        } else {
          resolve({
            success: false,
            message: `命令执行失败，退出码: ${code}`,
            error: `Exit code: ${code}`
          });
        }
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          message: '命令执行出错',
          error: error.message
        });
      });
    });
  }

  /**
   * 获取提交历史
   */
  public static getCommitHistory(count: number = 10): string[] {
    try {
      const output = execSync(`git log --oneline -${count}`, { encoding: 'utf-8' });
      return output.trim().split('\n').filter(line => line.trim());
    } catch (error) {
      throw new Error(`获取提交历史失败: ${error}`);
    }
  }

  /**
   * 检查分支是否存在
   */
  public static branchExists(branchName: string): boolean {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查是否有正在进行的 cherry-pick
   */
  public static isCherryPickInProgress(): boolean {
    try {
      const output = execSync('git status --porcelain=v1', { encoding: 'utf-8' });
      return output.includes('You are currently cherry-picking') || 
             execSync('test -d .git/sequencer', { stdio: 'ignore' }) === null;
    } catch {
      return false;
    }
  }

  /**
   * 获取远程分支列表
   */
  public static getRemoteBranches(): string[] {
    try {
      const output = execSync('git branch -r', { encoding: 'utf-8' });
      return output.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.includes('->'))
        .map(line => line.replace(/^origin\//, ''));
    } catch (error) {
      throw new Error(`获取远程分支失败: ${error}`);
    }
  }

  /**
   * 格式化命令输出为彩色文本
   */
  public static formatOutput(text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): string {
    // 这里可以根据需要添加颜色格式化
    const prefix = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    return `${prefix[type]} ${text}`;
  }
}
