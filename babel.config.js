module.exports = function (api) {
  api.cache(true);
  return {
    // Resolve from project root so Metro’s Babel worker can always load the preset
    presets: [require.resolve('babel-preset-expo')],
    plugins: [
      // Reanimated 4's `react-native-reanimated/plugin` only re-exports
      // `react-native-worklets/plugin`. Resolving it from the project root avoids
      // Metro/Babel worker failures when the nested `require()` cannot find the package.
      require.resolve('react-native-worklets/plugin'),
    ],
  };
};
