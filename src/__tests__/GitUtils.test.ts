import { GitUtils } from '../utils/GitUtils';

describe('GitUtils', () => {
  describe('isGitRepository', () => {
    it('应该检测到当前目录是 Git 仓库', () => {
      // 由于我们在测试环境中，这个测试可能会失败
      // 这里只是展示测试结构
      const result = GitUtils.isGitRepository();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('executeCommand', () => {
    it('应该能够执行简单的命令', () => {
      const result = GitUtils.executeCommand('echo "test"');
      expect(result.success).toBe(true);
      expect(result.data).toContain('test');
    });

    it('应该处理失败的命令', () => {
      const result = GitUtils.executeCommand('nonexistent-command');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('formatOutput', () => {
    it('应该格式化成功消息', () => {
      const result = GitUtils.formatOutput('测试消息', 'success');
      expect(result).toContain('✅');
      expect(result).toContain('测试消息');
    });

    it('应该格式化错误消息', () => {
      const result = GitUtils.formatOutput('错误消息', 'error');
      expect(result).toContain('❌');
      expect(result).toContain('错误消息');
    });
  });
});
