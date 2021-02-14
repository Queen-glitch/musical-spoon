import { Severity } from '@hint/utils-types';
import { generateHTMLPage } from '@hint/utils-create-server';
import { getHintPath, testHint } from '@hint/utils-tests-helpers';

const hintPath = getHintPath(__filename);

const generateCSSRules = (count = 1) => {
    const rules = [];

    for (let i = 1; i <= count; i++) {
        rules.push(`.r${i}`);
    }

    return `${rules.join(',')} { color: #fff }`;
};

const generateStyleSheets = (count = 1) => {
    const sheets = [];

    for (let i = 1; i <= count; i++) {
        sheets.push('<style>.r { color: #fff }</style>');
    }

    return sheets.join('\n');
};

const generateImports = (count = 1) => {
    const config: any = { '/': generateHTMLPage(`<style>@import url('i1.css');</style>`) };

    for (let i = 1; i <= count; i++) {
        config[`/i${i}.css`] = {
            content: i < count ? `@import url('i${i + 1}.css');\n.r { color: #fff }` : '.r { color: #fff }',
            headers: { 'Content-Type': 'text/css' }
        };
    }

    return config;
};

const test = (label: string, limits: { maxRules: number; maxSheets: number; maxImports: number }, configs: any) => {
    const { maxRules, maxSheets, maxImports } = limits;

    testHint(hintPath, [
        {
            name: `Page${label} contains less than ${maxRules} CSS rules`,
            serverConfig: generateHTMLPage(`<style>${generateCSSRules(maxRules - 1)}</style>`)
        },
        {
            name: `Page${label} contains ${maxRules} CSS rules`,
            reports: [{
                message: `Maximum of ${maxRules} CSS rules reached (${maxRules})`,
                severity: Severity.error
            }],
            serverConfig: generateHTMLPage(`<style>${generateCSSRules(maxRules)}</style>`)
        },
        {
            name: `Page${label} contains less than ${maxSheets} stylesheets`,
            serverConfig: generateHTMLPage(generateStyleSheets(maxSheets - 1))
        },
        {
            name: `Page${label} contains ${maxSheets} stylesheets`,
            reports: [{
                message: `Maximum of ${maxSheets} stylesheets reached (${maxSheets})`,
                severity: Severity.error
            }],
            serverConfig: generateHTMLPage(generateStyleSheets(maxSheets))
        }
    ], configs);

    if (maxImports) {
        /*
         * Exclude `jsdom` since it currently ignores `@import` rules.
         * https://github.com/jsdom/jsdom/issues/2124
         */
        configs.ignoredConnectors = ['jsdom'];

        testHint(hintPath, [
            {
                name: `Page${label} contains less than ${maxImports} nested imports`,
                serverConfig: generateImports(maxImports - 1)
            },
            {
                name: `Page${label} contains ${maxImports} nested imports`,
                reports: [{
                    message: `Maximum of ${maxImports} nested imports reached (${maxImports})`,
                    severity: Severity.error
                }],
                serverConfig: generateImports(maxImports)
            }
        ], configs);
    }
};

test(' targeting IE9', {
    maxImports: 4,
    maxRules: 4095,
    maxSheets: 31
}, { browserslist: ['IE 9'] });

const customLimits = {
    maxImports: 2,
    maxRules: 10,
    maxSheets: 4
};

test(' with custom limits', customLimits, { hintOptions: customLimits });
