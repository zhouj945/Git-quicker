import inquirer from 'inquirer';
import chalk from 'chalk';
import { GitUtils } from '../utils/GitUtils';
import { Logger } from '../utils/Logger';
import { BranchInfo } from '../types';

/**
 * 分支管理命令类
 * 处理分支描述、批量删除、创建分支等操作
 */
export class BranchCommand {
  constructor() {
    // 不再需要 ConfigManager
  }

  /**
   * 显示所有分支和描述（包含工作树路径）
   */
  public async showBranches(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      const branches = GitUtils.getBranches();
      const worktrees = GitUtils.getWorktrees();
      const currentBranchName = GitUtils.getCurrentBranch();

      if (branches.length === 0) {
        Logger.warning('未找到分支');
        return;
      }

      Logger.title('分支列表');

      // 显示分支列表
      branches.forEach(branch => {
        // 读取 git config 中的描述
        const description = GitUtils.getGitBranchDescription(branch.name) || '';
        
        // 查找对应的工作树路径
        const worktree = worktrees.find(wt => wt.branch === `refs/heads/${branch.name}`);
        const worktreePath = worktree ? worktree.path : '';

        // 构建分支信息行
        const isCurrentBranch = branch.current || branch.name === currentBranchName;
        const branchPrefix = isCurrentBranch ? '* ' : '  ';
        const branchName = branch.name;
        const descriptionPart = description ? ` - ${description}` : '';
        let worktreePart = '';
        
        if (worktreePath && worktreePath !== process.cwd()) {
          worktreePart = ` (工作树: ${worktreePath})`;
        }

        // 当前分支使用绿色显示，工作树信息不添加颜色
        if (isCurrentBranch) {
          // 分支名和描述使用绿色粗体，工作树信息不着色
          const coloredPart = chalk.green.bold(`${branchPrefix}${branchName}${descriptionPart}`);
          console.log(`${coloredPart}${worktreePart}`);
        } else {
          console.log(`${branchPrefix}${branchName}${descriptionPart}${worktreePart}`);
        }
      });

      Logger.separator();
      Logger.info(`共 ${branches.length} 个分支`);

    } catch (error) {
      Logger.error(`获取分支信息失败: ${error}`);
    }
  }

  /**
   * 设置分支描述
   */
  public async setBranchDescription(branchName?: string, description?: string): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      let targetBranch = branchName;
      
      // 如果没有指定分支，使用当前分支
      if (!targetBranch) {
        targetBranch = GitUtils.getCurrentBranch();
        Logger.info(`使用当前分支: ${targetBranch}`);
      }

      // 检查分支是否存在
      if (!GitUtils.branchExists(targetBranch)) {
        Logger.error(`分支 "${targetBranch}" 不存在`);
        return;
      }

      let targetDescription = description;

      // 如果没有提供描述，交互式输入
      if (!targetDescription) {
        const currentDesc = GitUtils.getGitBranchDescription(targetBranch);
        
        const { newDescription } = await inquirer.prompt([{
          type: 'input',
          name: 'newDescription',
          message: `输入分支 "${targetBranch}" 的描述:`,
          default: currentDesc || '',
          validate: (input: string) => {
            if (!input.trim()) {
              return '分支描述不能为空';
            }
            if (input.length > 200) {
              return '分支描述不能超过200个字符';
            }
            return true;
          }
        }]);

        targetDescription = newDescription.trim();
      }

      // 写入到 git 配置（等同于: git config branch.<name>.description "..."）
      const ok = GitUtils.setGitBranchDescription(targetBranch, targetDescription!);
      if (!ok) {
        Logger.error('写入分支描述失败');
        return;
      }

      Logger.success(`分支 "${targetBranch}" 的描述已设置: ${targetDescription}`);

    } catch (error) {
      Logger.error(`设置分支描述失败: ${error}`);
    }
  }

  /**
   * 批量删除分支
   */
  public async batchDeleteBranches(branchNames: string[], force: boolean = false): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      if (branchNames.length === 0) {
        Logger.error('请提供要删除的分支名');
        return;
      }

      const currentBranch = GitUtils.getCurrentBranch();
      const validBranches: string[] = [];
      const invalidBranches: string[] = [];

      // 验证分支
      for (const branch of branchNames) {
        if (branch === currentBranch) {
          Logger.warning(`跳过当前分支: ${branch}`);
          continue;
        }
        
        if (GitUtils.branchExists(branch)) {
          validBranches.push(branch);
        } else {
          invalidBranches.push(branch);
        }
      }

      if (invalidBranches.length > 0) {
        Logger.warning(`以下分支不存在: ${invalidBranches.join(', ')}`);
      }

      if (validBranches.length === 0) {
        Logger.warning('没有有效的分支可以删除');
        return;
      }

      // 显示要删除的分支
      Logger.title('待删除的分支');
      Logger.list(validBranches, '🗑️');

      // 确认删除（除非使用强制模式）
      if (!force) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `确定要删除这 ${validBranches.length} 个分支吗？`,
          default: false
        }]);

        if (!confirm) {
          Logger.info('操作已取消');
          return;
        }
      }

      // 执行删除
      const deleteFlag = force ? '-D' : '-d';
      const successBranches: string[] = [];
      const failedBranches: string[] = [];

      for (const branch of validBranches) {
        const result = GitUtils.executeCommand(`git branch ${deleteFlag} ${branch}`);
        
        if (result.success) {
          successBranches.push(branch);
          // Git 会自动清理该分支的配置信息（包括描述）
        } else {
          failedBranches.push(branch);
          Logger.error(`删除分支 "${branch}" 失败: ${result.error}`);
        }
      }

      // 显示结果
      if (successBranches.length > 0) {
        Logger.success(`成功删除 ${successBranches.length} 个分支: ${successBranches.join(', ')}`);
      }

      if (failedBranches.length > 0) {
        Logger.error(`删除失败 ${failedBranches.length} 个分支: ${failedBranches.join(', ')}`);
        Logger.info('提示: 使用 -f 参数强制删除未合并的分支');
      }

    } catch (error) {
      Logger.error(`批量删除分支失败: ${error}`);
    }
  }

  /**
   * 交互式创建分支
   */
  public async createBranch(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      // 输入新分支名
      const { branchName } = await inquirer.prompt([{
        type: 'input',
        name: 'branchName',
        message: '输入新分支名:',
        validate: (input: string) => {
          if (!input.trim()) {
            return '分支名不能为空';
          }
          if (!/^[a-zA-Z0-9/_-]+$/.test(input)) {
            return '分支名只能包含字母、数字、斜杠、连字符和下划线';
          }
          if (GitUtils.branchExists(input)) {
            return `分支 "${input}" 已存在`;
          }
          return true;
        }
      }]);

      // 选择基础分支
      const branches = GitUtils.getBranches();
      const remoteBranches = GitUtils.getRemoteBranches();
      const allBranches = [
        ...branches.map(b => ({ name: `${b.name} (本地)`, value: b.name })),
        ...remoteBranches.map(b => ({ name: `${b} (远程)`, value: `origin/${b}` }))
      ];

      const { baseBranch } = await inquirer.prompt([{
        type: 'list',
        name: 'baseBranch',
        message: '选择基础分支:',
        choices: allBranches,
        default: GitUtils.getCurrentBranch()
      }]);

      // 是否切换到新分支
      const { switchToBranch } = await inquirer.prompt([{
        type: 'confirm',
        name: 'switchToBranch',
        message: '创建后是否切换到新分支？',
        default: true
      }]);

      // 创建分支
      const createCommand = switchToBranch ? 
        `git checkout -b ${branchName} ${baseBranch}` : 
        `git branch ${branchName} ${baseBranch}`;

      const result = GitUtils.executeCommand(createCommand);

      if (result.success) {
        Logger.success(`分支 "${branchName}" 创建成功`);
        
        // 询问是否添加分支描述
        const { addDescription } = await inquirer.prompt([{
          type: 'confirm',
          name: 'addDescription',
          message: '是否为新分支添加描述？',
          default: true
        }]);

        if (addDescription) {
          await this.setBranchDescription(branchName);
        }
      } else {
        Logger.error(`创建分支失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`创建分支失败: ${error}`);
    }
  }

  /**
   * 交互式选择并切换分支
   */
  public async switchBranch(): Promise<void> {
    try {
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return;
      }

      const branches = GitUtils.getBranches();
      const currentBranch = GitUtils.getCurrentBranch();
      
      // 过滤掉当前分支
      const otherBranches = branches.filter(b => b.name !== currentBranch);

      if (otherBranches.length === 0) {
        Logger.warning('没有其他分支可以切换');
        return;
      }

      const { selectedBranch } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedBranch',
        message: '选择要切换的分支:',
        choices: otherBranches.map(branch => {
          const description = GitUtils.getGitBranchDescription(branch.name);
          return {
            name: `${branch.name}${description ? ` - ${description}` : ''}`,
            value: branch.name
          };
        })
      }]);

      const result = GitUtils.executeCommand(`git checkout ${selectedBranch}`);

      if (result.success) {
        Logger.success(`已切换到分支: ${selectedBranch}`);
      } else {
        Logger.error(`切换分支失败: ${result.error}`);
      }

    } catch (error) {
      Logger.error(`切换分支失败: ${error}`);
    }
  }
}
