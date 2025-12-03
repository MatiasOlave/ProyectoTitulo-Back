import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
    companyId?: string;
    bypassIsolation?: boolean;
}

const context = new AsyncLocalStorage<RequestContext>();

export const runWithContext = (data: RequestContext, callback: () => void) => {
    context.run(data, callback);
};

export const getCompanyId = (): string | undefined => {
    const store = context.getStore();
    return store?.companyId;
};

export const setCompanyId = (companyId: string) => {
    const store = context.getStore();
    if (store) {
        store.companyId = companyId;
    }
};

export const isIsolationBypassed = (): boolean => {
    const store = context.getStore();
    return !!store?.bypassIsolation;
};

export const bypassIsolation = (callback: () => Promise<any> | any) => {
    const store = context.getStore();
    if (store) {
        const previousBypass = store.bypassIsolation;
        store.bypassIsolation = true;
        try {
            return callback();
        } finally {
            store.bypassIsolation = previousBypass;
        }
    } else {
        // If no context, just run it (technically already bypassed if no context, but good to be explicit)
        return context.run({ bypassIsolation: true }, callback);
    }
};
