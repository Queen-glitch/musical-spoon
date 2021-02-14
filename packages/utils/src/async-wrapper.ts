import { debug as d } from '@hint/utils-debug';

const debug: debug.IDebugger = d(__filename);

/** Wrap an async function, returning null if the evaluation throws and exception. */
export const asyncTry = <T>(asyncFn: (...args: any[]) => Promise<T>) => {
    return async (...args: any[]): Promise<T | null> => {
        try {
            return await asyncFn(...args);
        } catch (err) {
            debug(err);

            return null;
        }
    };
};
