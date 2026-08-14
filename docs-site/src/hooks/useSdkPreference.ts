import {useCallback, useEffect, useState, useSyncExternalStore} from 'react';
import {
  SDK_STORAGE_KEY,
  resolveSdkPreference,
  type SdkName,
} from '../lib/sdkPreference.mjs';

export type {SdkName} from '../lib/sdkPreference.mjs';

const SDK_CHANGE_EVENT = 'keyhold-sdk-change';
const SSR_SDK: SdkName = 'typescript';

const readClientSdk = (): SdkName => {
  if (typeof window === 'undefined') return SSR_SDK;
  return resolveSdkPreference(
    new URLSearchParams(window.location.search).get('sdk'),
    window.localStorage.getItem(SDK_STORAGE_KEY),
  );
};

const subscribe = (onStoreChange: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(SDK_CHANGE_EVENT, onStoreChange);
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(SDK_CHANGE_EVENT, onStoreChange);
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
};

const persist = (sdk: SdkName): void => {
  window.localStorage.setItem(SDK_STORAGE_KEY, sdk);
  const url = new URL(window.location.href);
  url.searchParams.set('sdk', sdk);
  window.history.replaceState({}, '', url);
  window.dispatchEvent(new Event(SDK_CHANGE_EVENT));
};

export function useSdkPreference(): [SdkName, (sdk: SdkName) => void] {
  const clientSdk = useSyncExternalStore(subscribe, readClientSdk, () => SSR_SDK);
  // Docusaurus may call the browser snapshot during its initial hydrate pass.
  // Keep the rendered value equal to the static SSR value until that pass is
  // complete, then reveal the query/storage preference in a normal update.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const sdk = hydrated ? clientSdk : SSR_SDK;
  const selectSdk = useCallback((next: SdkName): void => {
    persist(next);
  }, []);
  return [sdk, selectSdk];
}
