// babel-preset-taro 更多选项和默认值：
// https://docs.taro.zone/docs/next/babel-config
module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: true,
      compiler: 'webpack5',
    }]
  ],
  // 在 build 时把可选链 ?./空值合并 ?? 转成 ES5（纯语法转换，不引 core-js，
  // 避免激进 browserslist 注入垫片导致的真机递归）。转完整包即纯 ES5，
  // 从而可关闭微信「增强编译」——真机调试 instrumentation 不再面对 enhance 生成的辅助函数。
  plugins: [
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',
  ],
}
