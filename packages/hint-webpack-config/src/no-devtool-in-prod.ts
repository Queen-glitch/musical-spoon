/**
 * @fileoverview `webpack-config/no-devtool-in-prod` warns against having set the propety `devtool` to `eval`.
 */
import { HintContext, IHint } from 'hint';
import { debug as d } from '@hint/utils-debug';
import { Severity } from '@hint/utils-types';

import { WebpackConfigEvents, WebpackConfigParse } from '@hint/parser-webpack-config';

import meta from './meta/no-devtool-in-prod';
import { getMessage } from './i18n.import';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

export default class WebpackConfigNoDevtoolInProd implements IHint {
    public static readonly meta = meta;

    public constructor(context: HintContext<WebpackConfigEvents>) {

        const configReceived = (webpackConfigEvent: WebpackConfigParse) => {
            const { config, resource } = webpackConfigEvent;

            debug(`'parse::end::webpack-config' received`);

            if (config.devtool && config.devtool.toString().includes('eval')) {
                context.report(
                    resource,
                    getMessage('noEval', context.language, config.devtool.toString()),
                    { severity: Severity.warning }
                );
            }
        };

        context.on('parse::end::webpack-config', configReceived);
    }
}
