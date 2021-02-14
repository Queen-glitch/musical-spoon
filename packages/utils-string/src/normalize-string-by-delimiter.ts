import { normalizeString } from './normalize-string';

/** Normalize String and then replace characters with delimiter. */
export const normalizeStringByDelimiter = (value: string, delimiter: string) => {
    return normalizeString(value)!.replace(/[^a-z0-9]/gi, delimiter);
};
