export const APP_VERSION = 'v0.0.15.0.LPCANARY';
export const BUILD_NUMBER = '2627.0527';

export function getFullVersion(): string {
  return `${APP_VERSION} (Build ${BUILD_NUMBER})`;
}

export function getVersionInfo() {
  return {
    version: APP_VERSION,
    build: BUILD_NUMBER,
    full: getFullVersion()
  };
}
