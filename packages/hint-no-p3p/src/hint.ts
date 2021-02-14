/**
 * @fileoverview `no-p3p` disallows the use of `P3P`
 */

import { URL } from 'url';

import { ElementFound, FetchEnd, HintContext, IHint, ScanStart } from 'hint';
import { normalizeString } from '@hint/utils-string';
import { includedHeaders } from '@hint/utils-network';
import { debug as d } from '@hint/utils-debug';
import { Severity } from '@hint/utils-types';

import meta from './meta';
import { getMessage } from './i18n.import';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

export default class NoP3pHint implements IHint {

    public static readonly meta = meta;

    public constructor(context: HintContext) {

        const errorMessage = getMessage('p3pDeprecated', context.language);
        /**
         * Verifies the server doesn't respond with any content to the well-known location
         * (/w3c/p3p.xml) defined in the spec https://www.w3.org/TR/P3P11/#Well_Known_Location
         */
        const validateWellKnown = async (scanStart: ScanStart) => {
            try {
                const { resource } = scanStart;
                const wellKnown = new URL('/w3c/p3p.xml', resource);
                const result = await context.fetchContent(wellKnown);

                if (result.response.statusCode === 200) {
                    context.report(wellKnown.toString(), errorMessage, { severity: Severity.error });
                }
            } catch (e) {
                /*
                 * There's a problem accessing the URL. E.g.: "SSL Error: UNABLE_TO_VERIFY_LEAF_SIGNATURE"
                 * The error is outside the scope of the hint so we ignore it
                 */
                debug(e);
            }
        };

        /**
         * Verifies none of the responses have the `p3p` header
         * https://www.w3.org/TR/P3P11/#syntax_ext
         */
        const validateHeaders = ({ element, resource, response }: FetchEnd) => {
            const headers: string[] = includedHeaders(response.headers, ['p3p']);
            const numberOfHeaders: number = headers.length;

            if (numberOfHeaders > 0) {
                let codeSnippet = '';

                for (const header of headers) {
                    codeSnippet += `P3P: ${response.headers[header]}\n`;
                }

                context.report(resource, errorMessage, {
                    codeLanguage: 'http',
                    codeSnippet: codeSnippet.trim(),
                    element,
                    severity: Severity.error
                });
            }
        };

        /**
         * Checks there isn't any `<link rel="P3Pv1">` in the document
         * https://www.w3.org/TR/P3P11/#syntax_link
         */
        const validateHtml = ({ element, resource }: ElementFound) => {
            const rel: string | null = element.getAttribute('rel');

            if (rel && normalizeString(rel) === 'p3pv1') {
                context.report(resource, errorMessage, { element, severity: Severity.error });
            }
        };

        context.on('scan::start', validateWellKnown);
        context.on('fetch::end::*', validateHeaders);
        context.on('element::link', validateHtml);
    }
}
