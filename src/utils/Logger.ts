import chalk from 'chalk';

/**
 * 日志工具类
 * 提供彩色的控制台输出功能
 */
export class Logger {
  
  /**
   * 成功信息
   */
  public static success(message: string): void {
    console.log(chalk.green('✅ ' + message));
  }

  /**
   * 错误信息
   */
  public static error(message: string): void {
    console.log(chalk.red('❌ ' + message));
  }

  /**
   * 警告信息
   */
  public static warning(message: string): void {
    console.log(chalk.yellow('⚠️  ' + message));
  }

  /**
   * 普通信息
   */
  public static info(message: string): void {
    console.log(chalk.blue('ℹ️  ' + message));
  }

  /**
   * 调试信息
   */
  public static debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🐛 ' + message));
    }
  }

  /**
   * 标题信息
   */
  public static title(message: string): void {
    console.log(chalk.bold.cyan('\n🚀 ' + message + '\n'));
  }

  /**
   * 分隔线
   */
  public static separator(): void {
    console.log(chalk.gray('─'.repeat(50)));
  }

  /**
   * 表格输出
   */
  public static table(headers: string[], rows: string[][]): void {
    // 计算每列的最大宽度
    const columnWidths = headers.map((header, index) => {
      const maxRowWidth = Math.max(...rows.map(row => (row[index] || '').length));
      return Math.max(header.length, maxRowWidth);
    });

    // 输出表头
    const headerRow = headers.map((header, index) => 
      chalk.bold.cyan(header.padEnd(columnWidths[index]))
    ).join(' │ ');
    console.log('┌' + columnWidths.map(width => '─'.repeat(width + 2)).join('┬') + '┐');
    console.log('│ ' + headerRow + ' │');
    console.log('├' + columnWidths.map(width => '─'.repeat(width + 2)).join('┼') + '┤');

    // 输出数据行
    rows.forEach(row => {
      const dataRow = row.map((cell, index) => 
        (cell || '').padEnd(columnWidths[index])
      ).join(' │ ');
      console.log('│ ' + dataRow + ' │');
    });

    console.log('└' + columnWidths.map(width => '─'.repeat(width + 2)).join('┴') + '┘');
  }

  /**
   * 列表输出
   */
  public static list(items: string[], bullet: string = '•'): void {
    items.forEach(item => {
      console.log(chalk.gray(bullet) + ' ' + item);
    });
  }

  /**
   * 带颜色的键值对输出
   */
  public static keyValue(key: string, value: string, keyColor: any = chalk.cyan, valueColor: any = chalk.white): void {
    console.log(keyColor(key + ':') + ' ' + valueColor(value));
  }

  /**
   * 进度指示器
   */
  public static progress(message: string, current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
    console.log(`${message} [${chalk.green(progressBar)}] ${percentage}% (${current}/${total})`);
  }

  /**
   * 清空控制台
   */
  public static clear(): void {
    console.clear();
  }

  /**
   * 换行
   */
  public static newLine(count: number = 1): void {
    console.log('\n'.repeat(count - 1));
  }
}
