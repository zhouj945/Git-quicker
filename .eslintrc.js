module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'off', // TypeScript 会处理这个
    'prefer-const': 'error',
    'no-var': 'error',
  },
  env: {
    node: true,
    es6: true,
    jest: true, // 添加 Jest 环境支持
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js'
  ]
};
