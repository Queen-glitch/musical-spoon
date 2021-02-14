import { join } from 'path';

import { readFile } from '@hint/utils-fs';
import { findPackageRoot } from './find-package-root';

/**
 * Returns if the hint that is going to be created is an official.
 *
 * To do this we search the first `package.json` starting in `porcess.cwd()`
 * and go up the tree. If the name is `hint` then it's an official one.
 * If not or no `package.json` are found, then it isn't.
 */
export const isOfficial = async (): Promise<boolean> => {
    try {
        const pkg = JSON.parse(await readFile(join(findPackageRoot(process.cwd()), 'package.json')));

        return pkg.name === '@hint/monorepo';
    } catch (e) {
        // No `package.json` was found, so it's not official
        return false;
    }
};
