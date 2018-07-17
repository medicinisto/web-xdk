const resources = {};
export function getNativeSupport(resourceName) {
  return resources[resourceName];
}

export function registerNativeSupport(resourceName, resource) {
  if (resource) resources[resourceName] = resource;
}
