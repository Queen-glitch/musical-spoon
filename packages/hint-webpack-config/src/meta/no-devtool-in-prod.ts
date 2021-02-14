import { Category } from '@hint/utils-types';
import { HintMetadata, HintScope } from 'hint';

import { getMessage } from '../i18n.import';

const meta: HintMetadata = {
    docs: {
        category: Category.development,
        description: getMessage('noDevtoolInProd_description', 'en'),
        name: getMessage('noDevtoolInProd_name', 'en')
    },
    /* istanbul ignore next */
    getDescription(language: string) {
        return getMessage('noDevtoolInProd_description', language);
    },
    /* istanbul ignore next */
    getName(language: string) {
        return getMessage('noDevtoolInProd_name', language);
    },
    id: 'webpack-config/no-devtool-in-prod',
    schema: [],
    scope: HintScope.local
};

export default meta;
