import { generateHTMLPage } from '@hint/utils-create-server';
import { getHintPath, HintTest, testHint } from '@hint/utils-tests-helpers';
import { Severity } from '@hint/utils-types';

const hintPath = getHintPath(__filename, true);

const tests: HintTest[] = [
    {
        name: `Text has insufficient color contrast and fails`,
        reports: [
            {
                documentation: [{
                    link: 'https://dequeuniversity.com/rules/axe/4.1/color-contrast?application=axeAPI',
                    text: 'Learn more about this axe rule at Deque University'
                }],
                message: 'Elements must have sufficient color contrast: Element has insufficient color contrast of 1.16 (foreground color: #eeeeee, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1',
                position: { match: 'div id="text"' },
                severity: Severity.warning
            }
        ],
        serverConfig: generateHTMLPage(
            `<style>#text { background-color: #fff; color: #eee; }</style>`,
            `<div id="text">Text without sufficient contrast</div>`
        )
    }
];

testHint(hintPath, tests, { ignoredConnectors: ['jsdom'] });
