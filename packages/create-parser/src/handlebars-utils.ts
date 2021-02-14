import * as Handlebars from 'handlebars';

import { readFileAsync } from '@hint/utils-fs';
import { loadHintPackage } from '@hint/utils';

const pkg = loadHintPackage();

/**
 * Searches the current version used for a package in `hint` and uses that version or the `defaultVersion`.
 *
 * This is used when creating a new hint via the CLI to make sure the dependencies are up-to-date in the moment
 * of creation.
 */
Handlebars.registerHelper('dependencyVersion', (packageName, defaultVersion): string => {
    const version = packageName === 'hint' ?
        `^${pkg.version}` :
        pkg.dependencies[packageName] ||
        pkg.devDependencies[packageName] ||
        defaultVersion;

    return `"${packageName}": "${version}"`;
});

/**
 * Use `escapeSafeString` function instead of triple curly brace in the templates
 * to escape the backticks (`) in the user's input.
 * Example:
 * ```
 * description: `This is a \`important\` hint that has 'single' and "double" quotes.`
 * ```
 */
export const escapeSafeString = (str: string): hbs.SafeString => {
    const result = str.replace(/(`)/g, '\\$1');

    return new Handlebars.SafeString(result);
};

/** Reads a handlebars template from the file system and compiles it. */
export const compileTemplate = async (filePath: string, data: any): Promise<string> => {
    let templateContent;

    try {
        templateContent = await readFileAsync(filePath);
    } catch (err) {
        throw (err);
    }

    const template = Handlebars.compile(templateContent);

    return template(data);
};

export default Handlebars;
