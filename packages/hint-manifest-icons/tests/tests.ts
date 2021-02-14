import * as fs from 'fs';

import { generateHTMLPage } from '@hint/utils-create-server';
import { getHintPath, HintTest, testHint } from '@hint/utils-tests-helpers';
import { Severity } from '@hint/utils-types';

const hintPath = getHintPath(__filename);

const htmlWithManifestSpecified = generateHTMLPage('<link rel="manifest" href="site.webmanifest">');

const icon192px = fs.readFileSync(`${__dirname}/fixtures/icon-192x192.png`); // eslint-disable-line no-sync
const icon512px = fs.readFileSync(`${__dirname}/fixtures/icon-512x512.png`); // eslint-disable-line no-sync
const icon128px = fs.readFileSync(`${__dirname}/fixtures/icon-128x128.png`); // eslint-disable-line no-sync

const generateImageData = (content: Buffer): Object => {
    return {
        content,
        headers: { 'Content-Type': 'image/png' }
    };
};

const tests: HintTest[] = [
    {
        name: 'Web app manifest is specified with empty icons property',
        reports: [{
            message: `Valid icons property was not found in the web app manifest`,
            severity: Severity.error
        }],
        serverConfig: {
            '/': htmlWithManifestSpecified,
            '/site.webmanifest': {
                content: `{
                    "icons": []
                }`
            }
        }
    },
    {
        name: 'Web app manifest links to an invalid icon URL',
        reports: [{
            message: `Icon could not be fetched (request failed).`,
            severity: Severity.error
        }],
        serverConfig: {
            '/': htmlWithManifestSpecified,
            '/fixtures/icon-192x192.png': null,
            '/site.webmanifest': {
                content: `{
                    "icons": [
                        {
                            "src": "fixtures/icon-192x192.png",
                            "sizes": "192x192",
                            "type": "image/png"
                        }
                    ]
                }`
            }
        }
    },
    {
        name: 'Inaccessible icon URL in the Web app manifest',
        reports: [
            {
                message: `Icon could not be fetched (status code: 404).`,
                position: { match: '"an-inaccessible-path.png"' },
                severity: Severity.error
            }
        ],
        serverConfig: {
            '/': htmlWithManifestSpecified,
            '/fixtures/icon-192x192.png': generateImageData(icon192px),
            '/fixtures/icon-512x512.png': generateImageData(icon512px),
            '/site.webmanifest': {
                content: `{
                    "icons": [
                        {
                            "src": "an-inaccessible-path.png",
                            "sizes": "152x152",
                            "type": "image/png"
                        },
                        {
                            "src": "fixtures/icon-192x192.png",
                            "sizes": "192x192",
                            "type": "image/png"
                        },
                        {
                            "src": "fixtures/icon-512x512.png",
                            "sizes": "512x512",
                            "type": "image/png"
                        }
                    ]
                }`
            }
        }
    },
    {
        name: 'Specified type does not match with real image type',
        reports: [
            {
                message: `Real image type (png) do not match with specified type (madeuptype)`,
                position: { match: '"image/madeuptype"' },
                severity: Severity.warning
            }
        ],
        serverConfig: {
            '/': htmlWithManifestSpecified,
            '/fixtures/icon-128x128.png': generateImageData(icon128px),
            '/fixtures/icon-192x192.png': generateImageData(icon192px),
            '/fixtures/icon-512x512.png': generateImageData(icon512px),
            '/site.webmanifest': {
                content: `{
                    "icons": [
                        {
                            "src": "fixtures/icon-128x128.png",
                            "sizes": "128x128",
                            "type": "image/madeuptype"
                        },
                        {
                            "src": "fixtures/icon-192x192.png",
                            "sizes": "192x192",
                            "type": "image/png"
                        },
                        {
                            "src": "fixtures/icon-512x512.png",
                            "sizes": "512x512",
                            "type": "image/png"
                        }
                        ]
                }`
            }
        }
    },
    {
        name: 'Missing type in icon',
        reports: [
            {
                message: `Icon type was not specified.`,
                position: {
                    match: `{
                            "src": "fixtures/icon-192x192.png",`
                },
                severity: Severity.error
            }
        ],
        serverConfig: {
            '/': htmlWithManifestSpecified,
            '/fixtures/icon-192x192.png': generateImageData(icon192px),
            '/site.webmanifest': {
                content: `{
                    "icons": [
                        {
                            "src": "fixtures/icon-192x192.png",
                            "sizes": "192x192"
                        }
                    ]
                }`
            }
        }
    },
    {
        name: 'Specified size does not match with real image size',
        reports: [
            {
                message: `Real image size (128x128) do not match with specified size(s) (128x121,128x122,128x123)`,
                position: { match: '"128x121 128x122 128x123"' },
                severity: Severity.warning
            }
        ],
        serverConfig: {
            '/': htmlWithManifestSpecified,
            '/fixtures/icon-128x128.png': generateImageData(icon128px),
            '/fixtures/icon-192x192.png': generateImageData(icon192px),
            '/fixtures/icon-512x512.png': generateImageData(icon512px),
            '/site.webmanifest': {
                content: `{
                    "icons": [
                        {
                            "src": "fixtures/icon-128x128.png",
                            "sizes": "128x121 128x122 128x123",
                            "type": "image/png"
                        },
                        {
                            "src": "fixtures/icon-192x192.png",
                            "sizes": "192x192",
                            "type": "image/png"
                        },
                        {
                            "src": "fixtures/icon-512x512.png",
                            "sizes": "512x512",
                            "type": "image/png"
                        }
                        ]
                }`
            }
        }
    },
    {
        name: 'Required size icons not found',
        reports: [
            {
                message: `Required sizes ["512x512"] not found.`,
                position: { match: `icons` },
                severity: Severity.error
            }
        ],
        serverConfig: {
            '/': htmlWithManifestSpecified,
            '/fixtures/icon-192x192.png': generateImageData(icon192px),
            '/site.webmanifest': {
                content: `{
                        "icons": [
                            {
                                "src": "fixtures/icon-192x192.png",
                                "sizes": "192x192",
                                "type": "image/png"
                            }
                            ]
                    }`
            }
        }
    },
    {
        name: 'Ideal icons specified',
        serverConfig: {
            '/': htmlWithManifestSpecified,
            '/fixtures/icon-192x192.png': generateImageData(icon192px),
            '/fixtures/icon-512x512.png': generateImageData(icon512px),
            '/site.webmanifest': {
                content: `{
                    "icons": [
                        {
                            "src": "fixtures/icon-192x192.png",
                            "sizes": "192x192",
                            "type": "image/png"
                        },
                        {
                            "src": "fixtures/icon-512x512.png",
                            "sizes": "512x512",
                            "type": "image/png"
                        }
                        ]
                }`
            }
        }
    }
];

testHint(hintPath, tests, { parsers: ['manifest'] });
