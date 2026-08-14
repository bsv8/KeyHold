export const SDK_STORAGE_KEY = 'docusaurus.tab.sdk';

export const isSdkName = (value) => value === 'typescript' || value === 'go';

/** Query state is shareable and always wins over local persistence. */
export const resolveSdkPreference = (query, stored) =>
  isSdkName(query) ? query : isSdkName(stored) ? stored : 'typescript';
