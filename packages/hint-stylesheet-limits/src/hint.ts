/**
 * @fileoverview Checks if CSS exceeds known stylesheet limits.
 */

import { HintContext } from 'hint/dist/src/lib/hint-context';
import { IHint, CanEvaluateScript } from 'hint/dist/src/lib/types';
import { Severity } from '@hint/utils-types';

import meta from './meta';
import { getMessage } from './i18n.import';

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

export default class StylesheetLimitsHint implements IHint {

    public static readonly meta = meta;

    public constructor(context: HintContext) {

        // Allow limits to be overridden by hint options.
        const options = context.hintOptions;

        // Check if browsers with default limits are included.
        const includesOldIE = ['ie 6', 'ie 7', 'ie 8', 'ie 9'].some((e) => {
            return context.targetedBrowsers.includes(e);
        });

        if (!options && !includesOldIE) {
            // Exit if we don't have any limits to test.
            return;
        }

        let hasImportLimit = includesOldIE;
        let hasRuleLimit = includesOldIE;
        let hasSheetLimit = includesOldIE;

        let maxImports = includesOldIE ? 4 : 0;
        let maxRules = includesOldIE ? 4095 : 0;
        let maxSheets = includesOldIE ? 31 : 0;

        // Min the default/options values to ensure overrides can't "hide" browser limits.
        if (options) {
            // Always use the options value if no default import limit is specified.
            if (options.maxImports && (!hasImportLimit || options.maxImports < maxImports)) {
                maxImports = options.maxImports;
                hasImportLimit = true;
            }
            if (options.maxRules && (!hasRuleLimit || options.maxRules < maxRules)) {
                maxRules = options.maxRules;
                hasRuleLimit = true;
            }
            if (options.maxSheets && (!hasSheetLimit || options.maxSheets < maxSheets)) {
                maxSheets = options.maxSheets;
                hasSheetLimit = true;
            }
        }

        /* istanbul ignore next */
        // The following function will be evaluated in the context of the page.
        const injectedCode = function () {

            // Recursively count rules and imports in the passed stylesheet.
            const countRules = (styleSheet: CSSStyleSheet) => {

                const results = {
                    imports: 0,
                    rules: 0,
                    sheets: 1
                };

                try {

                    // Count rules in this stylesheet.
                    Array.from(styleSheet.cssRules).forEach((rule) => {

                        if (rule instanceof CSSStyleRule) {

                            // Count each selector in a style rule separately.
                            results.rules += rule.selectorText.split(',').length;

                        } else if (rule instanceof CSSImportRule) {

                            // Recursively count rules in imported stylesheets.
                            const subResults = countRules(rule.styleSheet);

                            results.imports += Math.max(results.imports, subResults.imports + 1);
                            results.rules += subResults.rules + 1;
                            results.sheets += subResults.sheets;

                        } else {

                            // Other rules count as one each.
                            results.rules += 1;

                        }
                    });

                } catch (e) {

                    /*
                     * Accessing cssRules of a cross-origin stylesheet can throw.
                     * If this happens, exclude the stylesheet from the count.
                     */
                }

                return results;
            };

            const combinedResults = {
                imports: 0,
                rules: 0,
                sheets: 0
            };

            // Get the recursive count of rules for all stylesheets in the page.
            Array.from(document.styleSheets).forEach((sheet) => {
                if (sheet instanceof CSSStyleSheet) {
                    const subResults = countRules(sheet);

                    combinedResults.imports += Math.max(combinedResults.imports, subResults.imports);
                    combinedResults.rules += subResults.rules;
                    combinedResults.sheets += subResults.sheets;
                }
            });

            return combinedResults;
        };

        const validateScanEnd = async (event: CanEvaluateScript) => {

            const results = await context.evaluate(`(${injectedCode})()`);

            // Report once we hit a limit to support flagging on platforms which will drop subsequent rules.

            // Only check `maxImports` if a limit has been specified
            if (hasImportLimit && results.imports >= maxImports) {
                context.report(
                    event.resource,
                    getMessage('maximumNested', context.language, [maxImports.toString(), results.imports.toString()]),
                    { severity: Severity.error }
                );
            }

            if (hasRuleLimit && results.rules >= maxRules) {
                context.report(
                    event.resource,
                    getMessage('maximumRules', context.language, [maxRules.toString(), results.rules.toString()]),
                    { severity: Severity.error }
                );
            }

            if (hasSheetLimit && results.sheets >= maxSheets) {
                context.report(
                    event.resource,
                    getMessage('maximumStylesheets', context.language, [maxSheets.toString(), results.sheets.toString()]),
                    { severity: Severity.error }
                );
            }
        };

        context.on('can-evaluate::script', validateScanEnd);
    }
}
