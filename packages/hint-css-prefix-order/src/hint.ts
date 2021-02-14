/**
 * @fileoverview Ensure vendor-prefixed versions of a CSS property are listed
 * before the unprefixed version.
 */

import { Declaration, Rule } from 'postcss';

import { HintContext } from 'hint/dist/src/lib/hint-context';
import { IHint } from 'hint/dist/src/lib/types';
import { debug as d } from '@hint/utils-debug';
import { getFullCSSCodeSnippet, getCSSLocationFromNode, getUnprefixed } from '@hint/utils-css';
import { StyleEvents, StyleParse } from '@hint/parser-css';
import { Severity } from '@hint/utils-types';

import meta from './meta';
import { getMessage } from './i18n.import';

const debug: debug.IDebugger = d(__filename);

type DeclarationPair = {
    lastPrefixed: Declaration;
    unprefixed: Declaration;
};

/** Determine if the order of a prefixed/unprefixed pair is valid. */
const validatePair = (pair: Partial<DeclarationPair>): boolean => {
    // Valid if only prefixed or only unprefixed versions exist.
    if (!pair.lastPrefixed || !pair.unprefixed) {
        return false;
    }

    const prefixedLocation = getCSSLocationFromNode(pair.lastPrefixed) || { column: 0, line: 0 };
    const unprefixedLocation = getCSSLocationFromNode(pair.unprefixed) || { column: 0, line: 0 };

    // Valid if last prefixed line is before unprefixed line.
    if (prefixedLocation.line < unprefixedLocation.line) {
        return false;
    }

    // Invalid if last prefixed line is after unprefixed line.
    if (prefixedLocation.line > unprefixedLocation.line) {
        return true;
    }

    // Both are on the same line: valid only if last prefixed column is first.
    return prefixedLocation.column > unprefixedLocation.column;
};

/** Determine if the order of all properties within a rule block are valid. */
const validateRule = (rule: Rule): DeclarationPair[] => {
    const map = new Map<string, Partial<DeclarationPair>>();

    rule.each((decl) => {
        if (!('prop' in decl)) {
            return;
        }

        const name = decl.prop;
        const baseName = getUnprefixed(name);

        const value = decl.value;
        const baseValue = getUnprefixed(value);

        if (!map.has(baseName)) {
            map.set(baseName, {});
        }

        const pair = map.get(baseName)!;

        if (name === baseName && value === baseValue) {
            pair.unprefixed = decl;
        } else {
            pair.lastPrefixed = decl;
        }
    });

    return [...map.values()].filter(validatePair) as DeclarationPair[];
};

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

export default class CssPrefixOrderHint implements IHint {

    public static readonly meta = meta;

    public constructor(context: HintContext<StyleEvents>) {
        /** Generate a report message from an invalid pair. */
        const formatMessage = (invalidPair: DeclarationPair): string => {
            // Handle prefixed properties (e.g. `appearance` and `-webkit-appearance`).
            let name = invalidPair.unprefixed.prop;
            let prefixedName = invalidPair.lastPrefixed.prop;

            // Handle prefixed values (e.g. `display: grid` and `display: -ms-grid`).
            if (name === prefixedName) {
                name = `${invalidPair.unprefixed}`;
                prefixedName = `${invalidPair.lastPrefixed}`;
            }

            return getMessage('shouldBeListed', context.language, [name, prefixedName]);
        };

        context.on('parse::end::css', ({ ast, element, resource }: StyleParse) => {
            debug('Validating hint css-prefix-order');

            ast.walkRules((rule) => {
                for (const invalidPair of validateRule(rule)) {
                    const message = formatMessage(invalidPair);
                    const isValue = invalidPair.lastPrefixed.prop === invalidPair.unprefixed.prop;
                    const location = getCSSLocationFromNode(invalidPair.unprefixed, { isValue });
                    const codeSnippet = getFullCSSCodeSnippet(invalidPair.unprefixed);
                    const severity = Severity.warning;

                    context.report(
                        resource,
                        message,
                        { codeLanguage: 'css', codeSnippet, element, location, severity });
                }
            });
        });
    }
}
