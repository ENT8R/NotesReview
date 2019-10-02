module.exports = api => {
  api.cache(true);

  const presets = [
    '@babel/preset-env',
    ['minify', {
      builtIns: false
    }]
  ];
  const plugins = [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-classes',
    '@babel/plugin-transform-regenerator',
    '@babel/plugin-transform-runtime'
  ];

  return {
    presets,
    plugins
  };
};
