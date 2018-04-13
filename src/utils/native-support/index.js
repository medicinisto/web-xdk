const resources = {};
exports.getNativeSupport = resourceName => resources[resourceName];

exports.registerNativeSupport = (resourceName, resource) => {
  if (resource) resources[resourceName] = resource;
};
