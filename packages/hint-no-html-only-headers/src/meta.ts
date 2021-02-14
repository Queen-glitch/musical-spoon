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
    id: 'no-html-only-headers',
    schema: [{
        additionalProperties: false,
        definitions: {
            'string-array': {
                items: { type: 'string' },
                minItems: 1,
                type: 'array',
                uniqueItems: true
            }
        },
        properties: {
            ignore: { $ref: '#/definitions/string-array' },
            include: { $ref: '#/definitions/string-array' }
        },
        type: ['object', 'null']
    }],
    scope: HintScope.site
};

export default meta;
