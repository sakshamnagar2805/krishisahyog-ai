import type { IDataProvider } from './dataProvider.interface';
/** Locked legacy adapter. No production government or personal record can be sourced from the demo provider. */
export const dataProvider: IDataProvider = new Proxy({} as IDataProvider, {
  get(_target, key) {
    if (typeof key === 'string') return async () => { throw new Error('Private/demo data services are disabled until real authentication and sources are implemented.'); };
    return undefined;
  }
});
export * from './dataProvider.interface';
