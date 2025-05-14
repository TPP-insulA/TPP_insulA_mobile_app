module.exports = function(api) {
  api.cache(true);
  
  // Define plugins based on environment
  const plugins = [
    ["module:react-native-dotenv", {
      "moduleName": "@env",
      "path": ".env",
      "blacklist": null,
      "whitelist": null,
      "safe": false,
      "allowUndefined": true
    }]
  ];
  
  // Only add these plugins in production mode
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
    plugins.push(['transform-react-remove-prop-types', {
      removeImport: true,
      ignoreFilenames: ['node_modules']
    }]);
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins: plugins
  };
};