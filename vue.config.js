// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const report = {
  // entry: {
  //   main: './src/main.js',
  // },
  // mode: 'production',
  // plugins: [new BundleAnalyzerPlugin()],
};

module.exports = {
  lintOnSave: true,
  productionSourceMap: false,
  devServer: {
    host: '0.0.0.0',
    port: 8087,
    proxy: {
      '/ajax.cgi': {
        target: 'http://weaver.nlplab.org/~brat/demo/latest/ajax.cgi',
        // target: 'http://10.10.25.156:14444',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  ...report,
};
