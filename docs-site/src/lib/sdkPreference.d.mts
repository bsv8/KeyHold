export type SdkName = 'typescript' | 'go';

export declare const SDK_STORAGE_KEY: 'docusaurus.tab.sdk';
export declare const isSdkName: (value: string | null) => value is SdkName;
export declare const resolveSdkPreference: (query: string | null, stored: string | null) => SdkName;
