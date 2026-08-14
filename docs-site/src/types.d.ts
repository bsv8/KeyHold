declare module '@theme/Tabs' {
  import type {ComponentType, ReactNode} from 'react';
  const Tabs: ComponentType<{children?: ReactNode; groupId?: string; queryString?: string; defaultValue?: string; values?: Array<{label: string; value: string}>}>;
  export default Tabs;
}

declare module '@theme/TabItem' {
  import type {ComponentType, ReactNode} from 'react';
  const TabItem: ComponentType<{children?: ReactNode; value: string; label: string}>;
  export default TabItem;
}
