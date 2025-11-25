import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ShortcutConfig, CONFIG_PATHS } from '../types/index.js';

/**
 * 配置管理器类
 * 负责管理快捷指令配置等持久化数据
 */
export class ConfigManager {
  private configDir: string;
  private shortcutsPath: string;
  private backupDir: string;

  constructor() {
    // 初始化配置目录路径
    this.configDir = path.join(os.homedir(), CONFIG_PATHS.CONFIG_DIR);
    this.shortcutsPath = path.join(this.configDir, CONFIG_PATHS.SHORTCUTS_FILE);
    this.backupDir = path.join(this.configDir, CONFIG_PATHS.BACKUP_DIR);
  }

  /**
   * 初始化配置目录和默认配置
   */
  public async init(): Promise<void> {
    try {
      // 创建配置目录
      await this.ensureConfigDir();
      
      // 初始化默认快捷指令
      await this.initDefaultShortcuts();
      
      console.log('✅ 配置初始化完成');
    } catch (error) {
      throw new Error(`配置初始化失败: ${error}`);
    }
  }

  /**
   * 确保配置目录存在
   */
  private async ensureConfigDir(): Promise<void> {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 初始化默认快捷指令
   */
  private async initDefaultShortcuts(): Promise<void> {
    const defaultShortcuts: ShortcutConfig = {
      'gco': 'git checkout',
      'gst': 'git status',
      'gaa': 'git add .',
      'gcm': 'git commit -m',
      'gps': 'git push',
      'gpl': 'git pull',
      'gbr': 'git branch -v',
      'gbd': 'git branch -d',
      'glog': 'git log --oneline -10',
      'gdiff': 'git diff',
      'gstash': 'git stash',
      'gpop': 'git stash pop',
      'greset': 'git reset --hard HEAD'
    };

    if (!fs.existsSync(this.shortcutsPath)) {
      await this.saveShortcuts(defaultShortcuts);
    }
  }

  /**
   * 获取快捷指令配置
   */
  public async getShortcuts(): Promise<ShortcutConfig> {
    try {
      if (!fs.existsSync(this.shortcutsPath)) {
        return {};
      }
      const content = fs.readFileSync(this.shortcutsPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('读取快捷指令配置失败:', error);
      return {};
    }
  }

  /**
   * 保存快捷指令配置
   */
  public async saveShortcuts(shortcuts: ShortcutConfig): Promise<void> {
    try {
      await this.ensureConfigDir();
      // 备份现有配置
      await this.backupConfig('shortcuts');
      // 保存新配置
      fs.writeFileSync(this.shortcutsPath, JSON.stringify(shortcuts, null, 2));
    } catch (error) {
      throw new Error(`保存快捷指令配置失败: ${error}`);
    }
  }

  /**
   * 设置单个快捷指令
   */
  public async setShortcut(key: string, command: string): Promise<void> {
    const shortcuts = await this.getShortcuts();
    shortcuts[key] = command;
    await this.saveShortcuts(shortcuts);
  }

  /**
   * 删除快捷指令
   */
  public async removeShortcut(key: string): Promise<boolean> {
    const shortcuts = await this.getShortcuts();
    if (shortcuts[key]) {
      delete shortcuts[key];
      await this.saveShortcuts(shortcuts);
      return true;
    }
    return false;
  }

  /**
   * 备份配置文件
   */
  private async backupConfig(type: 'shortcuts'): Promise<void> {
    try {
      const sourceFile = this.shortcutsPath;
      if (fs.existsSync(sourceFile)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupDir, `${type}-${timestamp}.json`);
        fs.copyFileSync(sourceFile, backupFile);
      }
    } catch (error) {
      console.warn(`备份配置文件失败: ${error}`);
    }
  }

  /**
   * 获取配置信息
   */
  public async getConfigInfo(): Promise<{
    configDir: string;
    shortcutsCount: number;
    shortcuts: ShortcutConfig;
  }> {
    const shortcuts = await this.getShortcuts();
    
    return {
      configDir: this.configDir,
      shortcutsCount: Object.keys(shortcuts).length,
      shortcuts
    };
  }

  /**
   * 卸载配置（备份后删除）
   */
  public async uninstall(): Promise<void> {
    try {
      // 创建最终备份
      await this.backupConfig('shortcuts');
      
      console.log(`✅ 配置已备份到: ${this.backupDir}`);
      console.log('如需恢复配置，请手动复制备份文件');
    } catch (error) {
      console.error('卸载配置时出错:', error);
    }
  }
}