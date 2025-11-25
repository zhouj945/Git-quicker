import inquirer from 'inquirer';
import { ConfigManager } from '../config/ConfigManager.js';
import { GitUtils } from '../utils/GitUtils.js';
import { Logger } from '../utils/Logger.js';
import { CommandResult } from '../types/index.js';

/**
 * 快捷指令管理命令类
 * 处理快捷指令的设置、执行、删除等操作
 */
export class ShortcutCommand {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * 列出所有快捷指令
   */
  public async listShortcuts(): Promise<void> {
    try {
      const shortcuts = await this.configManager.getShortcuts();
      const shortcutKeys = Object.keys(shortcuts);

      if (shortcutKeys.length === 0) {
        Logger.warning('暂无快捷指令，使用 "gq set <key> <command>" 添加');
        return;
      }

      Logger.title('快捷指令列表');
      
      // 显示快捷指令列表
      shortcutKeys.forEach(key => {
        const command = shortcuts[key];
        const description = this.getCommandDescription(command);
        console.log(`${key} - ${command} (${description})`);
      });

      Logger.separator();
      Logger.info(`共 ${shortcutKeys.length} 个快捷指令`);
    } catch (error) {
      Logger.error(`获取快捷指令失败: ${error}`);
    }
  }

  /**
   * 设置快捷指令
   */
  public async setShortcut(key: string, command: string): Promise<void> {
    try {
      if (!key || !command) {
        Logger.error('请提供快捷键和命令');
        return;
      }

      // 检查是否覆盖现有快捷指令
      const shortcuts = await this.configManager.getShortcuts();
      if (shortcuts[key]) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `快捷键 "${key}" 已存在 (${shortcuts[key]})，是否覆盖？`,
          default: false
        }]);

        if (!confirm) {
          Logger.info('操作已取消');
          return;
        }
      }

      await this.configManager.setShortcut(key, command);
      Logger.success(`快捷指令设置成功: ${key} -> ${command}`);
    } catch (error) {
      Logger.error(`设置快捷指令失败: ${error}`);
    }
  }

  /**
   * 删除快捷指令
   */
  public async removeShortcut(key: string): Promise<void> {
    try {
      if (!key) {
        Logger.error('请提供要删除的快捷键');
        return;
      }

      const shortcuts = await this.configManager.getShortcuts();
      if (!shortcuts[key]) {
        Logger.warning(`快捷键 "${key}" 不存在`);
        return;
      }

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `确定要删除快捷指令 "${key}" (${shortcuts[key]}) 吗？`,
        default: false
      }]);

      if (!confirm) {
        Logger.info('操作已取消');
        return;
      }

      const success = await this.configManager.removeShortcut(key);
      if (success) {
        Logger.success(`快捷指令 "${key}" 已删除`);
      } else {
        Logger.error(`删除快捷指令 "${key}" 失败`);
      }
    } catch (error) {
      Logger.error(`删除快捷指令失败: ${error}`);
    }
  }

  /**
   * 执行快捷指令
   */
  public async runShortcut(key: string, args: string[] = []): Promise<CommandResult> {
    try {
      // 检查是否在 Git 仓库中
      if (!GitUtils.isGitRepository()) {
        Logger.error('当前目录不是 Git 仓库');
        return { success: false, message: '当前目录不是 Git 仓库' };
      }

      const shortcuts = await this.configManager.getShortcuts();
      const command = shortcuts[key];

      if (!command) {
        Logger.error(`快捷指令 "${key}" 不存在`);
        Logger.info('使用 "gq list" 查看所有可用的快捷指令');
        return { success: false, message: `快捷指令 "${key}" 不存在` };
      }

      // 构建完整命令
      const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;
      
      Logger.info(`执行命令: ${fullCommand}`);
      
      // 执行命令
      const result = GitUtils.executeCommand(fullCommand);
      
      if (result.success) {
        if (result.data) {
          console.log(result.data);
        }
        Logger.success('命令执行成功');
      } else {
        Logger.error(`命令执行失败: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage = `执行快捷指令失败: ${error}`;
      Logger.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * 交互式选择并执行快捷指令
   */
  public async interactiveRun(): Promise<void> {
    try {
      const shortcuts = await this.configManager.getShortcuts();
      const shortcutKeys = Object.keys(shortcuts);

      if (shortcutKeys.length === 0) {
        Logger.warning('暂无快捷指令，使用 "gq set <key> <command>" 添加');
        return;
      }

      const { selectedKey } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedKey',
        message: '选择要执行的快捷指令:',
        choices: shortcutKeys.map(key => ({
          name: `${key} - ${shortcuts[key]}`,
          value: key
        }))
      }]);

      // 询问是否需要额外参数
      const { needArgs } = await inquirer.prompt([{
        type: 'confirm',
        name: 'needArgs',
        message: '是否需要添加额外参数？',
        default: false
      }]);

      let args: string[] = [];
      if (needArgs) {
        const { argsInput } = await inquirer.prompt([{
          type: 'input',
          name: 'argsInput',
          message: '请输入参数 (用空格分隔):'
        }]);
        args = argsInput.trim().split(/\s+/).filter((arg: string) => arg);
      }

      await this.runShortcut(selectedKey, args);
    } catch (error) {
      Logger.error(`交互式执行失败: ${error}`);
    }
  }

  /**
   * 获取命令描述
   */
  private getCommandDescription(command: string): string {
    const descriptions: { [key: string]: string } = {
      'git status': '查看工作区状态',
      'git add .': '添加所有文件到暂存区',
      'git commit -m': '提交更改',
      'git push': '推送到远程仓库',
      'git pull': '从远程仓库拉取',
      'git checkout': '切换分支或恢复文件',
      'git branch -v': '查看分支详情',
      'git branch -d': '删除分支',
      'git log --oneline -10': '查看最近10条提交',
      'git diff': '查看文件差异',
      'git stash': '暂存工作区更改',
      'git stash pop': '恢复暂存的更改',
      'git reset --hard HEAD': '重置到最新提交'
    };

    return descriptions[command] || '自定义命令';
  }
}
