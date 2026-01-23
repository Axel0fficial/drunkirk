module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      require.resolve("expo-router/babel"),
      [
        "module-resolver",
        {
          extensions: [".tsx", ".ts", ".js", ".json"],
          alias: {
            "@app": "./app",
            "@src": "./src",
            "@state": "./src/state",
            "@domain": "./src/domain",
            "@data": "./src/data",
            "@ui": "./src/ui"
          }
        }
      ]
    ]
  };
};
