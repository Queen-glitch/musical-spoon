import { Category } from '@hint/utils-types';
import { HintScope } from 'hint/dist/src/lib/enums/hint-scope';
import { HintMetadata } from 'hint/dist/src/lib/types';

import { getMessage } from './i18n.import';

const meta: HintMetadata = {
    docs: {
        category: Category.performance,
        description: getMessage('description', 'en'),
        name: getMessage('name', 'en')
    },
    /* istanbul ignore next */
    getDescription(language: string) {
        return getMessage('description', language);
    },
    /* istanbul ignore next */
    getName(language: string) {
        return getMessage('name', language);
    },
    id: 'no-http-redirects',
    schema: [{
        additionalProperties: false,
        properties: {
            'max-html-redirects': {
                minimum: 0,
                type: 'integer'
            },
            'max-resource-redirects': {
                minimum: 0,
                type: 'integer'
            }
        },
        type: 'object'
    }],
    scope: HintScope.site
};

export default meta;
