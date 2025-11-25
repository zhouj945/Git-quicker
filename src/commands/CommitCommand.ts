import inquirer from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';
import { GitUtils } from '../utils/GitUtils.js';
import { Logger } from '../utils/Logger.js';
import { CommitType, COMMIT_TYPE_DESCRIPTIONS } from '../types/index.js';

// 注册 autocomplete 插件
inquirer.registerPrompt('autocomplete', autocompletePrompt);

/**
 * 提交管理命令类
 * 处理交互式提交、修改提交等操作
 */
export class CommitCommand {

  /**
   * 交互式提交
   */
  public async interactiveCommit(): Promise<void> {
    try {
      // 检查是否在 Git 仓库中
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      // 检查工作区状态
      const hasUncommitted = GitUtils.hasUncommittedChanges();
      const hasStaged = GitUtils.hasStagedChanges();

      // 如果没有任何更改，静默退出
      if (!hasUncommitted && !hasStaged) {
        return; // 静默退出，不打印提示
      }

      // 若没有暂存的变更则静默退出（不自动暂存、不提示）
      if (!hasStaged) {
        return;
      }

      // 使用 autocomplete 提供可搜索的提交类型选择
      const commitTypeChoices = Object.values(CommitType).map(type => ({
        name: `${type} - ${COMMIT_TYPE_DESCRIPTIONS[type]}`,
        value: type
      }));

      const { commitType } = await inquirer.prompt([{
        type: 'autocomplete',
        name: 'commitType',
        message: '选择提交类型 (可输入搜索):',
        source: async (_answersSoFar: any, input: string) => {
          if (!input) {
            return commitTypeChoices;
          }
          // 过滤匹配的选项
          const filtered = commitTypeChoices.filter(choice =>
            choice.name.toLowerCase().includes(input.toLowerCase()) ||
            choice.value.toLowerCase().includes(input.toLowerCase())
          );
          return filtered;
        },
        pageSize: 15
      }]);

      // 输入提交描述
      const { description } = await inquirer.prompt([{
        type: 'input',
        name: 'description',
        message: '输入提交描述:',
        validate: (input: string) => {
          if (!input.trim()) {
            return '提交描述不能为空';
          }
          if (input.length > 100) {
            return '提交描述不能超过100个字符';
          }
          return true;
        }
      }]);

      // 构建提交消息
      const commitMessage: string = `${commitType}: ${description.trim()}`;

      // 执行提交（异步，不阻塞终端）
      Logger.info('开始提交...');
      
      const result = await GitUtils.executeCommandAsync('git', ['commit', '-m', commitMessage]);
      
      if (result.success) {
        Logger.success('提交完成！');
      } else {
        Logger.error(`提交失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`交互式提交失败: ${error}`);
    }
  }

  /**
   * 修改最后一次提交
   */
  public async amendCommit(): Promise<void> {
    try {
      // 检查是否在 Git 仓库中
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      // 获取最后一次提交信息
      const lastCommitResult = GitUtils.executeCommand('git log -1 --pretty=format:"%s"');
      if (!lastCommitResult.success) {
        Logger.error('获取最后一次提交信息失败');
        return;
      }

      const lastCommitMessage = lastCommitResult.data;
      Logger.info(`当前最后一次提交: ${lastCommitMessage}`);

      // 检查是否有暂存的更改
      const hasStaged = GitUtils.hasStagedChanges();
      const hasUncommitted = GitUtils.hasUncommittedChanges();

      if (!hasStaged && !hasUncommitted) {
        // 只修改提交消息
        const { newMessage } = await inquirer.prompt([{
          type: 'input',
          name: 'newMessage',
          message: '输入新的提交消息:',
          default: lastCommitMessage,
          validate: (input: string) => {
            if (!input.trim()) {
              return '提交消息不能为空';
            }
            return true;
          }
        }]);

        const result = await GitUtils.executeCommandAsync('git', ['commit', '--amend', '-m', newMessage]);
        
        if (result.success) {
          Logger.success('提交消息已修改');
        } else {
          Logger.error(`修改提交消息失败: ${result.error}`);
        }
      } else {
        // 存在变更，询问后续操作（仅对已暂存内容生效）
        const { action } = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: '检测到变更，选择操作（仅对已暂存内容生效）:',
          choices: [
            { name: '将已暂存的更改添加到最后一次提交', value: 'add' },
            { name: '只修改提交消息', value: 'message' },
            { name: '取消操作', value: 'cancel' }
          ]
        }]);

        if (action === 'cancel') {
          Logger.info('操作已取消');
          return;
        }

        if (action === 'add') {
          // 仅对已暂存内容进行 amend；若没有已暂存内容则直接提示并退出
          if (!hasStaged) {
            Logger.info('当前没有已暂存的更改，操作已取消');
            return;
          }

          // 修改提交消息（可选）
          const { changeMessage } = await inquirer.prompt([{
            type: 'confirm',
            name: 'changeMessage',
            message: '是否修改提交消息？',
            default: false
          }]);

          if (changeMessage) {
            const { newMessage } = await inquirer.prompt([{
              type: 'input',
              name: 'newMessage',
              message: '输入新的提交消息:',
              default: lastCommitMessage
            }]);

            const result = await GitUtils.executeCommandAsync('git', ['commit', '--amend', '-m', newMessage]);
            
            if (result.success) {
              Logger.success('提交已修改');
            } else {
              Logger.error(`修改提交失败: ${result.error}`);
            }
          } else {
            const result = await GitUtils.executeCommandAsync('git', ['commit', '--amend', '--no-edit']);
            
            if (result.success) {
              Logger.success('更改已添加到最后一次提交');
            } else {
              Logger.error(`修改提交失败: ${result.error}`);
            }
          }
        } else if (action === 'message') {
          const { newMessage } = await inquirer.prompt([{
            type: 'input',
            name: 'newMessage',
            message: '输入新的提交消息:',
            default: lastCommitMessage
          }]);

          const result = await GitUtils.executeCommandAsync('git', ['commit', '--amend', '-m', newMessage, '--no-verify']);
          
          if (result.success) {
            Logger.success('提交消息已修改');
          } else {
            Logger.error(`修改提交消息失败: ${result.error}`);
          }
        }
      }

    } catch (error) {
      Logger.error(`修改提交失败: ${error}`);
    }
  }

  /**
   * 显示提交统计信息
   */
  public async showCommitStats(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      // 获取最近的提交历史
      const commits = GitUtils.getCommitHistory(10);
      
      if (commits.length === 0) {
        Logger.warning('暂无提交历史');
        return;
      }

      Logger.title('最近提交历史');
      Logger.list(commits, '📝');
      
      // 显示当前分支信息
      const currentBranch = GitUtils.getCurrentBranch();
      Logger.keyValue('当前分支', currentBranch);
      
      // 显示工作区状态
      const hasUncommitted = GitUtils.hasUncommittedChanges();
      const hasStaged = GitUtils.hasStagedChanges();
      
      Logger.keyValue('工作区状态', hasUncommitted ? '有未提交更改' : '干净');
      Logger.keyValue('暂存区状态', hasStaged ? '有暂存文件' : '空');

    } catch (error) {
      Logger.error(`获取提交统计失败: ${error}`);
    }
  }
}
