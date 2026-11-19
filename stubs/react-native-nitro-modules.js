// Safe stub for react-native-nitro-modules to allow bundling when nitro is not installed
const noop = () => ({});
const handler = {
  get: () => new Proxy(noop, handler),
  apply: () => new Proxy(noop, handler),
};
const stub = new Proxy(noop, handler);

module.exports = {
  NitroModules: stub,
  default: stub,
};

