module.exports = (options, webpack) => {
  return {
    ...options,
    externals: ['bcrypt'],
  };
};
