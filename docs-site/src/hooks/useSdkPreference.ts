import {useEffect, useState} from 'react';
export type SdkName = 'typescript' | 'go';
const valid = (value: string | null): value is SdkName => value === 'typescript' || value === 'go';
const read = (): SdkName => { if (typeof window === 'undefined') return 'typescript'; const query = new URLSearchParams(window.location.search).get('sdk'); if (valid(query)) return query; const stored = window.localStorage.getItem('docusaurus.tab.sdk'); return valid(stored) ? stored : 'typescript'; };
export function useSdkPreference(): [SdkName, (sdk: SdkName) => void] { const [sdk,setSdk] = useState<SdkName>(read); useEffect(() => { if (typeof window === 'undefined') return; window.localStorage.setItem('docusaurus.tab.sdk',sdk); const url = new URL(window.location.href); url.searchParams.set('sdk',sdk); window.history.replaceState({},'',url); },[sdk]); return [sdk,setSdk]; }
