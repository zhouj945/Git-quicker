import inquirer from 'inquirer';
import * as path from 'path';
import { GitUtils } from '../utils/GitUtils';
import { Logger } from '../utils/Logger';
import { WorktreeInfo } from '../types';

/**
 * 工作树管理命令类
 * 处理工作树的创建、删除、查看等操作
 */
export class WorktreeCommand {

  /**
   * 显示所有工作树
   */
  public async listWorktrees(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      const worktrees = GitUtils.getWorktrees();

      if (worktrees.length === 0) {
        Logger.warning('未找到工作树');
        return;
      }

      Logger.title('工作树列表');

      // 准备表格数据
      const headers = ['路径', '分支', '提交', '状态'];
      const rows = worktrees.map(worktree => {
        let status = '正常';
        if (worktree.bare) status = '裸仓库';
        if (worktree.detached) status = '分离HEAD';
        
        return [
          worktree.path,
          worktree.branch || '-',
          worktree.commit.substring(0, 8),
          status
        ];
      });

      Logger.table(headers, rows);
      Logger.info(`共 ${worktrees.length} 个工作树`);

    } catch (error) {
      Logger.error(`获取工作树信息失败: ${error}`);
    }
  }

  /**
   * 添加新工作树
   */
  public async addWorktree(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      // 获取可用分支
      const branches = GitUtils.getBranches();
      const remoteBranches = GitUtils.getRemoteBranches();
      
      // 输入工作树路径
      const { worktreePath } = await inquirer.prompt([{
        type: 'input',
        name: 'worktreePath',
        message: '输入工作树路径:',
        validate: (input: string) => {
          if (!input.trim()) {
            return '工作树路径不能为空';
          }
          return true;
        }
      }]);

      // 选择创建方式
      const { createMode } = await inquirer.prompt([{
        type: 'list',
        name: 'createMode',
        message: '选择创建方式:',
        choices: [
          { name: '基于现有分支创建', value: 'existing' },
          { name: '创建新分支', value: 'new' },
          { name: '基于远程分支创建', value: 'remote' }
        ]
      }]);

      let command = '';

      if (createMode === 'existing') {
        // 选择现有分支
        const { selectedBranch } = await inquirer.prompt([{
          type: 'list',
          name: 'selectedBranch',
          message: '选择分支:',
          choices: branches.map(b => b.name)
        }]);

        command = `git worktree add ${worktreePath} ${selectedBranch}`;

      } else if (createMode === 'new') {
        // 创建新分支
        const { newBranchName } = await inquirer.prompt([{
          type: 'input',
          name: 'newBranchName',
          message: '输入新分支名:',
          validate: (input: string) => {
            if (!input.trim()) {
              return '分支名不能为空';
            }
            if (GitUtils.branchExists(input)) {
              return `分支 "${input}" 已存在`;
            }
            return true;
          }
        }]);

        // 选择基础分支
        const { baseBranch } = await inquirer.prompt([{
          type: 'list',
          name: 'baseBranch',
          message: '选择基础分支:',
          choices: branches.map(b => b.name),
          default: GitUtils.getCurrentBranch()
        }]);

        command = `git worktree add -b ${newBranchName} ${worktreePath} ${baseBranch}`;

      } else if (createMode === 'remote') {
        // 基于远程分支创建
        if (remoteBranches.length === 0) {
          Logger.warning('未找到远程分支');
          return;
        }

        const { remoteBranch } = await inquirer.prompt([{
          type: 'list',
          name: 'remoteBranch',
          message: '选择远程分支:',
          choices: remoteBranches
        }]);

        command = `git worktree add ${worktreePath} origin/${remoteBranch}`;
      }

      // 执行命令
      Logger.info(`执行命令: ${command}`);
      const result = GitUtils.executeCommand(command);

      if (result.success) {
        Logger.success(`工作树创建成功: ${worktreePath}`);
        Logger.info(`使用 "cd ${worktreePath}" 进入工作树目录`);
      } else {
        Logger.error(`创建工作树失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`添加工作树失败: ${error}`);
    }
  }

  /**
   * 删除工作树
   */
  public async removeWorktree(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      const worktrees = GitUtils.getWorktrees();
      
      // 过滤掉主工作树（通常是当前目录）
      const removableWorktrees = worktrees.filter(wt => !wt.bare && wt.path !== process.cwd());

      if (removableWorktrees.length === 0) {
        Logger.warning('没有可删除的工作树');
        return;
      }

      // 选择要删除的工作树
      const { selectedWorktree } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedWorktree',
        message: '选择要删除的工作树:',
        choices: removableWorktrees.map(wt => ({
          name: `${wt.path} (${wt.branch || 'detached'})`,
          value: wt.path
        }))
      }]);

      // 选择删除选项
      const { deleteOptions } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'deleteOptions',
        message: '选择删除选项:',
        choices: [
          { name: '强制删除（忽略未提交的更改）', value: '--force' },
          { name: '删除工作树目录', value: 'remove-dir' }
        ]
      }]);

      // 构建删除命令
      let command = `git worktree remove ${selectedWorktree}`;
      if (deleteOptions.includes('--force')) {
        command += ' --force';
      }

      // 确认删除
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `确定要删除工作树 "${selectedWorktree}" 吗？`,
        default: false
      }]);

      if (!confirm) {
        Logger.info('操作已取消');
        return;
      }

      // 执行删除
      const result = GitUtils.executeCommand(command);

      if (result.success) {
        Logger.success(`工作树已删除: ${selectedWorktree}`);
        
        // 如果选择删除目录，尝试删除物理目录
        if (deleteOptions.includes('remove-dir')) {
          try {
            const rmResult = GitUtils.executeCommand(`rm -rf "${selectedWorktree}"`);
            if (rmResult.success) {
              Logger.success('工作树目录已删除');
            } else {
              Logger.warning('删除工作树目录失败，请手动删除');
            }
          } catch (error) {
            Logger.warning('删除工作树目录失败，请手动删除');
          }
        }
      } else {
        Logger.error(`删除工作树失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`删除工作树失败: ${error}`);
    }
  }

  /**
   * 清理工作树引用
   */
  public async pruneWorktrees(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      Logger.info('正在清理无效的工作树引用...');
      
      const result = GitUtils.executeCommand('git worktree prune -v');

      if (result.success) {
        if (result.data && result.data.trim()) {
          Logger.success('工作树引用清理完成:');
          console.log(result.data);
        } else {
          Logger.success('没有需要清理的工作树引用');
        }
      } else {
        Logger.error(`清理工作树引用失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`清理工作树引用失败: ${error}`);
    }
  }

  /**
   * 工作树状态检查
   */
  public async checkWorktreeStatus(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      const worktrees = GitUtils.getWorktrees();
      
      Logger.title('工作树状态检查');

      for (const worktree of worktrees) {
        Logger.separator();
        Logger.keyValue('路径', worktree.path);
        Logger.keyValue('分支', worktree.branch || '分离HEAD');
        Logger.keyValue('提交', worktree.commit.substring(0, 8));

        // 检查工作树目录是否存在
        const pathExists = GitUtils.executeCommand(`test -d "${worktree.path}"`);
        Logger.keyValue('目录状态', pathExists.success ? '存在' : '不存在');

        // 如果目录存在，检查工作区状态
        if (pathExists.success && !worktree.bare) {
          const statusResult = GitUtils.executeCommand(`cd "${worktree.path}" && git status --porcelain`);
          if (statusResult.success) {
            const hasChanges = statusResult.data && statusResult.data.trim().length > 0;
            Logger.keyValue('工作区状态', hasChanges ? '有未提交更改' : '干净');
          }
        }
      }

      Logger.separator();
      Logger.info(`检查完成，共 ${worktrees.length} 个工作树`);

    } catch (error) {
      Logger.error(`检查工作树状态失败: ${error}`);
    }
  }

  /**
   * 在工作树之间快速切换
   */
  public async switchWorktree(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      const worktrees = GitUtils.getWorktrees();
      const currentPath = process.cwd();
      
      // 过滤掉当前工作树
      const otherWorktrees = worktrees.filter(wt => wt.path !== currentPath);

      if (otherWorktrees.length === 0) {
        Logger.warning('没有其他工作树可以切换');
        return;
      }

      const { selectedWorktree } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedWorktree',
        message: '选择要切换的工作树:',
        choices: otherWorktrees.map(wt => ({
          name: `${path.basename(wt.path)} - ${wt.branch || 'detached'} (${wt.path})`,
          value: wt.path
        }))
      }]);

      Logger.success(`请使用以下命令切换到工作树:`);
      Logger.info(`cd "${selectedWorktree}"`);

    } catch (error) {
      Logger.error(`切换工作树失败: ${error}`);
    }
  }
}
