import inquirer from 'inquirer';
import { GitUtils } from '../utils/GitUtils';
import { Logger } from '../utils/Logger';
import { CommitType, COMMIT_TYPE_DESCRIPTIONS } from '../types';

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

      // 如果有未暂存的更改，询问是否添加到暂存区

      if (hasUncommitted) {
        const { shouldAdd } = await inquirer.prompt([{
          type: 'confirm',
          name: 'shouldAdd',
          message: '检测到未暂存的更改，是否添加到暂存区？',
          default: true
        }]);

        if (shouldAdd) {
          const addResult = GitUtils.executeCommand('git add .');
          if (!addResult.success) {
            Logger.error(`添加文件到暂存区失败: ${addResult.error}`);
            return;
          }
          Logger.success('文件已添加到暂存区');
        } else if (!hasStaged) {
          // 如果用户不想添加文件且暂存区也没有文件，则退出
          Logger.info('暂存区为空，操作已取消');
          return;
        }
      }

      // 直接选择提交类型（支持模糊查询）
      const { commitTypeInput } = await inquirer.prompt([{
        type: 'input',
        name: 'commitTypeInput',
        message: '输入提交类型 (可模糊搜索，如: f, fix, 修复):',
        validate: (input: string) => {
          if (!input.trim()) {
            return '提交类型不能为空';
          }
          return true;
        }
      }]);

      // 根据输入进行模糊匹配
      const searchTerm = commitTypeInput.trim().toLowerCase();
      const matchedTypes = Object.values(CommitType).filter(type => 
        type.toLowerCase().includes(searchTerm) ||
        COMMIT_TYPE_DESCRIPTIONS[type].toLowerCase().includes(searchTerm)
      );

      let commitType: CommitType;
      
      if (matchedTypes.length === 0) {
        Logger.warning(`没有找到匹配 "${commitTypeInput}" 的提交类型`);
        // 显示所有类型供选择
        const { selectedType } = await inquirer.prompt([{
          type: 'list',
          name: 'selectedType',
          message: '选择提交类型:',
          choices: Object.values(CommitType).map(type => ({
            name: `${type} - ${COMMIT_TYPE_DESCRIPTIONS[type]}`,
            value: type
          })),
          pageSize: 15
        }]);
        commitType = selectedType;
      } else if (matchedTypes.length === 1) {
        // 只有一个匹配，直接使用
        commitType = matchedTypes[0];
        Logger.success(`已选择: ${commitType} - ${COMMIT_TYPE_DESCRIPTIONS[commitType]}`);
      } else {
        // 多个匹配，让用户选择
        Logger.info(`找到 ${matchedTypes.length} 个匹配的提交类型:`);
        const { selectedType } = await inquirer.prompt([{
          type: 'list',
          name: 'selectedType',
          message: '选择提交类型:',
          choices: matchedTypes.map(type => ({
            name: `${type} - ${COMMIT_TYPE_DESCRIPTIONS[type]}`,
            value: type
          }))
        }]);
        commitType = selectedType;
      }

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
        // 有新的更改，询问操作方式
        const { action } = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: '检测到新的更改，选择操作:',
          choices: [
            { name: '将新更改添加到最后一次提交', value: 'add' },
            { name: '只修改提交消息', value: 'message' },
            { name: '取消操作', value: 'cancel' }
          ]
        }]);

        if (action === 'cancel') {
          Logger.info('操作已取消');
          return;
        }

        if (action === 'add') {
          // 添加未暂存的文件
          if (hasUncommitted) {
            const { shouldAdd } = await inquirer.prompt([{
              type: 'confirm',
              name: 'shouldAdd',
              message: '是否将未暂存的更改添加到暂存区？',
              default: true
            }]);

            if (shouldAdd) {
              const addResult = GitUtils.executeCommand('git add .');
              if (!addResult.success) {
                Logger.error(`添加文件失败: ${addResult.error}`);
                return;
              }
            }
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
