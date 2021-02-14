import { Context, Bump, Tag } from '../@types/custom';

import { calculatePackageNewVersion, updateDependencies } from '../lib/update-dependencies';

/**
 *
 * @param tag The tag of the commit
 */
const getBumpTypeForTag = (tag: Tag): Bump => {

    switch (tag) {
        case 'Build': return Bump.none;
        case 'Docs': return Bump.patch;
        case 'Update': return Bump.patch;
        case 'Upgrade': return Bump.patch;
        case 'Chore': return Bump.patch;
        case 'Fix': return Bump.patch;
        case 'New': return Bump.minor;
        case 'Breaking': return Bump.major;
        default: return Bump.none;
    }
};

/**
 * Bumps the version of each package:
 *
 * 1. Use the commit history of each package calculates the new version bump
 * 2. Update the inter dependencies of each package
 * 3. Update the versions of all the packages (`patch`) that do not have any commits but
 *    have changed versions in their dependencies
 */
export const calculateNewVersions = (ctx: Context) => {

    const { packages } = ctx;

    // Step 1: Use the commit history of each package calculates the new version bump
    packages.forEach((pkg) => {

        const bumpType = pkg.commits.reduce((currentBump, commit) => {
            const bump = getBumpTypeForTag(commit.tag);

            return Math.max(currentBump, bump);
        }, Bump.none);

        const oldVersion = pkg.content.version;

        pkg.content.version = calculatePackageNewVersion(pkg, bumpType);

        if (oldVersion !== pkg.content.version) {
            pkg.updated = true;
        }
    });

    // Step 2: Update versions based on the inter dependencies between packages
    updateDependencies(ctx);
};
