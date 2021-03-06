const loaderMerge = require('@neutrinojs/loader-merge');
const web = require('@neutrinojs/web');
const merge = require('deepmerge');
const path = require('path');

const MODULES = path.join(__dirname, 'node_modules');

module.exports = (neutrino, options = {}) => {
  neutrino.use(web, options);

  const babelLoader = neutrino.config.module.rule('compile').use('babel');
  const htmlRule = neutrino.config.module.rule('html');
  const htmlLoader = htmlRule.use('html');

  htmlRule.test(neutrino.regexFromExtensions(['html', 'vue']));

  const vueOptions = merge({
    extractCss: options.extract !== false,
    loaders: {
      js: {
        loader: babelLoader.get('loader'),
        options: babelLoader.get('options')
      },
      html: {
        loader: htmlLoader.get('loader'),
        options: htmlLoader.get('options')
      }
    }
  }, options.vue || {});

  neutrino.config.module
    .rule('vue')
      .test(neutrino.regexFromExtensions(['vue']))
      .use('vue')
        .loader(require.resolve('vue-loader'))
        .options(vueOptions);

  neutrino.config.when(neutrino.config.module.rules.has('lint'), () => {
    neutrino.use(loaderMerge('lint', 'eslint'), {
      baseConfig: {
        extends: ['plugin:vue/base']
      },
      plugins: ['vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: 'babel-eslint'
      }
    });
  });

  if (neutrino.config.plugins.has('stylelint')) {
    neutrino.config
      .plugin('stylelint')
        .tap(([options, ...args]) => [
          merge(options, {
            files: ['**/*.vue'],
            config: {
              processors: [require.resolve('stylelint-processor-html')],
              rules: {
                // allows empty <style> in vue components
                'no-empty-source': null
              }
            }
          }),
          ...args
        ]);
  }

  neutrino.config.resolve.modules.add(MODULES);
  neutrino.config.resolveLoader.modules.add(MODULES);
};
