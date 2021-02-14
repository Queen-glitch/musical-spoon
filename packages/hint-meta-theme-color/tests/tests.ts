import { Severity } from '@hint/utils-types';
import { generateHTMLPage } from '@hint/utils-create-server';
import { getHintPath, HintTest, testHint } from '@hint/utils-tests-helpers';

const hintPath = getHintPath(__filename);

const metaElementIsNotInHeadErrorMessage = `'theme-color' meta element should be specified in the '<head>', not '<body>'.`;
const metaElementIsNotNeededErrorMessage = `'theme-color' meta element is not needed as one was already specified.`;
const metaElementIsNotSpecifiedErrorMessage = `'theme-color' meta element was not specified.`;
const metaElementHasIncorrectNameAttributeErrorMessage = `'theme-color' meta element 'name' attribute value should be 'theme-color', not ' thEme-color '.`;

const invalidColorValues = [
    'currentcolor',
    'invalid'
];

const notAlwaysSupportedColorValues = [
    '#f00a',
    '#ff0000aa'
];

const unsupportedColorValues = [
    'hwb(60, 3%, 60%)'
];

const validColorValues = [
    '#f00',
    '#fF0000',
    'hsl(5, 5%, 5%)',
    'hsla(5, 5%, 5%, 0.5)',
    'red',
    'rgb(5, 5, 5)',
    'rgba(5, 5, 5, 0.5)',
    'transparent'
];

const generateThemeColorMetaElement = (contentValue: string = '#f00', nameValue: string = 'theme-color') => {
    return `<meta name="${nameValue}" content="${contentValue}">`;
};

const generateTest = (colorValues: string[], valueType: string = 'valid', reason?: string) => {
    const defaultTests = [];

    for (const colorValue of colorValues) {
        const test: HintTest = {
            name: `'theme-color' meta element is specified with ${valueType} 'content' value of '${colorValue}'${typeof reason === 'undefined' ? '' : ` ${reason}`}`,
            serverConfig: generateHTMLPage(generateThemeColorMetaElement(colorValue))
        };

        if (valueType !== 'valid') {
            test.reports = [{ message: `'theme-color' meta element 'content' attribute should not have ${valueType} value of '${colorValue}'.` }];
        }

        defaultTests.push(test);
    }

    return defaultTests;
};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const defaultTests: HintTest[] = [
    {
        name: `'theme-color' meta element is not specified, but there is no manifest`,
        serverConfig: generateHTMLPage('<link>')
    },
    {
        name: `'theme-color' meta element is not specified`,
        reports: [{
            message: metaElementIsNotSpecifiedErrorMessage,
            severity: Severity.warning
        }],
        serverConfig: generateHTMLPage('<link rel="manifest" href="manifest.webmanifest">')
    },
    {
        name: `'theme-color' meta element is specified with invalid 'name' value`,
        reports: [{
            message: metaElementHasIncorrectNameAttributeErrorMessage,
            severity: Severity.warning
        }],
        serverConfig: generateHTMLPage(generateThemeColorMetaElement('#f00', ' thEme-color '))
    },
    ...generateTest([...validColorValues, ...notAlwaysSupportedColorValues]),
    ...generateTest(invalidColorValues, 'invalid'),
    ...generateTest(unsupportedColorValues, 'unsupported'),
    {
        name: `'theme-color' meta element is specified in the '<body>'`,
        reports: [{
            message: metaElementIsNotInHeadErrorMessage,
            severity: Severity.error
        }],
        serverConfig: generateHTMLPage(undefined, generateThemeColorMetaElement())
    },
    {
        name: `Multiple meta 'theme-color' elements are specified`,
        reports: [{
            message: metaElementIsNotNeededErrorMessage,
            severity: Severity.warning
        }],
        serverConfig: generateHTMLPage(`${generateThemeColorMetaElement()}${generateThemeColorMetaElement()}`)
    },
    {
        name: `Target is not served with a valid media type`,
        serverConfig: { '/': { headers: { 'Content-Type': 'invalid' } } }
    },
    {
        name: `Target is served with a non-HTML specific media type`,
        serverConfig: { '/': { headers: { 'Content-Type': 'application/javascript; charset=utf-8' } } }
    }
];

const testForNoSupportForHexWithAlpha: HintTest[] = [...generateTest(notAlwaysSupportedColorValues, 'unsupported', 'because of the targeted browsers')];

testHint(hintPath, defaultTests, {
    browserslist: [
        'chrome 65',
        'firefox 60'
    ]
});
testHint(hintPath, testForNoSupportForHexWithAlpha, { browserslist: ['chrome 50'] });
