import inquirer from 'inquirer';
import { GitUtils } from '../utils/GitUtils.js';
import { Logger } from '../utils/Logger.js';
import { CherryPickOptions } from '../types/index.js';

/**
 * Cherry-pick 管理命令类
 * 处理 cherry-pick 操作的各种场景
 */
export class CherryPickCommand {

  /**
   * 执行 cherry-pick 操作
   */
  public async cherryPick(options: CherryPickOptions): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      // 处理不同的 cherry-pick 选项
      if (options.continue) {
        await this.continueCherryPick();
      } else if (options.skip) {
        await this.skipCherryPick();
      } else if (options.abort) {
        await this.abortCherryPick();
      } else if (options.batch) {
        await this.batchCherryPick();
      } else if (options.pick) {
        await this.interactiveCherryPick();
      } else {
        // 默认交互式选择
        await this.interactiveCherryPick();
      }

    } catch (error) {
      Logger.error(`Cherry-pick 操作失败: ${error}`);
    }
  }

  /**
   * 交互式 cherry-pick
   */
  private async interactiveCherryPick(): Promise<void> {
    try {
      // 检查是否有正在进行的 cherry-pick
      if (GitUtils.isCherryPickInProgress()) {
        Logger.warning('检测到正在进行的 cherry-pick 操作');
        const { action } = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: '选择操作:',
          choices: [
            { name: '继续 cherry-pick', value: 'continue' },
            { name: '跳过当前提交', value: 'skip' },
            { name: '取消 cherry-pick', value: 'abort' }
          ]
        }]);

        if (action === 'continue') {
          await this.continueCherryPick();
        } else if (action === 'skip') {
          await this.skipCherryPick();
        } else if (action === 'abort') {
          await this.abortCherryPick();
        }
        return;
      }

      // 获取提交历史
      const commits = GitUtils.getCommitHistory(20);
      
      if (commits.length === 0) {
        Logger.warning('没有找到提交历史');
        return;
      }

      // 选择要 cherry-pick 的提交
      const { selectedCommits } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'selectedCommits',
        message: '选择要 cherry-pick 的提交 (可多选):',
        choices: commits.map(commit => {
          const [hash, ...messageParts] = commit.split(' ');
          const message = messageParts.join(' ');
          return {
            name: `${hash} - ${message}`,
            value: hash
          };
        }),
        validate: (answer: string[]) => {
          if (answer.length === 0) {
            return '请至少选择一个提交';
          }
          return true;
        }
      }]);

      // 选择 cherry-pick 选项
      const { cherryPickOptions } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'cherryPickOptions',
        message: '选择 cherry-pick 选项:',
        choices: [
          { name: '不自动提交 (--no-commit)', value: '--no-commit' },
          { name: '编辑提交消息 (--edit)', value: '--edit' },
          { name: '保留原作者信息 (-x)', value: '-x' }
        ]
      }]);

      // 确认操作
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `确定要 cherry-pick ${selectedCommits.length} 个提交吗？`,
        default: true
      }]);

      if (!confirm) {
        Logger.info('操作已取消');
        return;
      }

      // 执行 cherry-pick
      await this.executeCherryPick(selectedCommits, cherryPickOptions);

    } catch (error) {
      Logger.error(`交互式 cherry-pick 失败: ${error}`);
    }
  }

  /**
   * 批量 cherry-pick
   */
  private async batchCherryPick(): Promise<void> {
    try {
      // 输入提交范围
      const { commitRange } = await inquirer.prompt([{
        type: 'input',
        name: 'commitRange',
        message: '输入提交范围 (如: abc123..def456 或 abc123^..def456):',
        validate: (input: string) => {
          if (!input.trim()) {
            return '提交范围不能为空';
          }
          return true;
        }
      }]);

      // 预览要 cherry-pick 的提交
      const previewResult = GitUtils.executeCommand(`git log --oneline ${commitRange}`);
      
      if (!previewResult.success) {
        Logger.error(`无效的提交范围: ${previewResult.error}`);
        return;
      }

      const commits = previewResult.data.trim().split('\n').filter((line: string) => line);
      
      if (commits.length === 0) {
        Logger.warning('指定范围内没有找到提交');
        return;
      }

      Logger.title('预览要 cherry-pick 的提交');
      Logger.list(commits, '📝');

      // 确认操作
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `确定要 cherry-pick 这 ${commits.length} 个提交吗？`,
        default: false
      }]);

      if (!confirm) {
        Logger.info('操作已取消');
        return;
      }

      // 执行批量 cherry-pick
      Logger.info(`开始批量 cherry-pick: ${commitRange}`);
      const result = GitUtils.executeCommand(`git cherry-pick ${commitRange}`);

      if (result.success) {
        Logger.success('批量 cherry-pick 完成');
      } else {
        Logger.error(`批量 cherry-pick 失败: ${result.error}`);
        Logger.info('使用 "gq cp -c" 继续，"gq cp -s" 跳过，或 "gq cp -a" 取消');
      }

    } catch (error) {
      Logger.error(`批量 cherry-pick 失败: ${error}`);
    }
  }

  /**
   * 继续 cherry-pick
   */
  private async continueCherryPick(): Promise<void> {
    try {
      if (!GitUtils.isCherryPickInProgress()) {
        Logger.warning('没有正在进行的 cherry-pick 操作');
        return;
      }

      // 检查是否有未解决的冲突
      const statusResult = GitUtils.executeCommand('git status --porcelain');
      if (statusResult.success && statusResult.data) {
        const conflicts = statusResult.data.split('\n').filter((line: string) => line.startsWith('UU') || line.startsWith('AA'));
        
        if (conflicts.length > 0) {
          Logger.error('仍有未解决的冲突:');
          conflicts.forEach((conflict: string) => {
            Logger.error(`  ${conflict}`);
          });
          Logger.info('请解决冲突后再继续');
          return;
        }
      }

      Logger.info('继续 cherry-pick...');
      const result = GitUtils.executeCommand('git cherry-pick --continue');

      if (result.success) {
        Logger.success('Cherry-pick 继续成功');
      } else {
        Logger.error(`继续 cherry-pick 失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`继续 cherry-pick 失败: ${error}`);
    }
  }

  /**
   * 跳过当前 cherry-pick
   */
  private async skipCherryPick(): Promise<void> {
    try {
      if (!GitUtils.isCherryPickInProgress()) {
        Logger.warning('没有正在进行的 cherry-pick 操作');
        return;
      }

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: '确定要跳过当前提交吗？',
        default: false
      }]);

      if (!confirm) {
        Logger.info('操作已取消');
        return;
      }

      Logger.info('跳过当前提交...');
      const result = GitUtils.executeCommand('git cherry-pick --skip');

      if (result.success) {
        Logger.success('已跳过当前提交');
      } else {
        Logger.error(`跳过提交失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`跳过 cherry-pick 失败: ${error}`);
    }
  }

  /**
   * 取消 cherry-pick
   */
  private async abortCherryPick(): Promise<void> {
    try {
      if (!GitUtils.isCherryPickInProgress()) {
        Logger.warning('没有正在进行的 cherry-pick 操作');
        return;
      }

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: '确定要取消 cherry-pick 操作吗？这将撤销所有更改。',
        default: false
      }]);

      if (!confirm) {
        Logger.info('操作已取消');
        return;
      }

      Logger.info('取消 cherry-pick...');
      const result = GitUtils.executeCommand('git cherry-pick --abort');

      if (result.success) {
        Logger.success('Cherry-pick 操作已取消');
      } else {
        Logger.error(`取消 cherry-pick 失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`取消 cherry-pick 失败: ${error}`);
    }
  }

  /**
   * 执行 cherry-pick 命令
   */
  private async executeCherryPick(commits: string[], options: string[] = []): Promise<void> {
    try {
      const optionsStr = options.length > 0 ? ` ${options.join(' ')}` : '';
      
      for (let i = 0; i < commits.length; i++) {
        const commit = commits[i];
        Logger.info(`Cherry-pick 进度: ${i + 1}/${commits.length} - ${commit}`);
        
        const command = `git cherry-pick${optionsStr} ${commit}`;
        const result = GitUtils.executeCommand(command);

        if (!result.success) {
          Logger.error(`Cherry-pick 提交 ${commit} 失败: ${result.error}`);
          
          // 检查是否是冲突
          if (result.error && result.error.includes('conflict')) {
            Logger.warning('检测到冲突，请解决冲突后使用以下命令继续:');
            Logger.info('  gq cp -c  # 继续');
            Logger.info('  gq cp -s  # 跳过');
            Logger.info('  gq cp -a  # 取消');
            return;
          } else {
            // 其他错误，询问是否继续
            const { shouldContinue } = await inquirer.prompt([{
              type: 'confirm',
              name: 'shouldContinue',
              message: '是否继续 cherry-pick 剩余提交？',
              default: false
            }]);

            if (!shouldContinue) {
              Logger.info('Cherry-pick 操作已停止');
              return;
            }
          }
        } else {
          Logger.success(`提交 ${commit} cherry-pick 成功`);
        }
      }

      Logger.success(`所有提交 cherry-pick 完成！`);

    } catch (error) {
      Logger.error(`执行 cherry-pick 失败: ${error}`);
    }
  }

  /**
   * 显示 cherry-pick 状态
   */
  public async showCherryPickStatus(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      const isInProgress = GitUtils.isCherryPickInProgress();
      
      if (!isInProgress) {
        Logger.info('当前没有正在进行的 cherry-pick 操作');
        return;
      }

      Logger.title('Cherry-pick 状态');
      
      // 显示当前状态
      const statusResult = GitUtils.executeCommand('git status');
      if (statusResult.success) {
        console.log(statusResult.data);
      }

      Logger.separator();
      Logger.info('可用操作:');
      Logger.list([
        'gq cp -c  # 继续 cherry-pick',
        'gq cp -s  # 跳过当前提交',
        'gq cp -a  # 取消 cherry-pick'
      ], '•');

    } catch (error) {
      Logger.error(`获取 cherry-pick 状态失败: ${error}`);
    }
  }
}
