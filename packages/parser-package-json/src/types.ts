import { Event, ErrorEvent, Events } from 'hint';
import { GroupedError, ISchemaValidationError, JSONLocationFunction } from '@hint/utils-json';

import { IJsonSchemaForNpmPackageJsonFiles } from './schema';

export type PackageJsonInvalidJSON = ErrorEvent;

/** Data type sent when the parse starts parsing */
export type PackageJsonParseStart = Event;

/** The object emitted by the `package-json` parser */
export type PackageJsonParsed = Event & {
    /** The package json parsed */
    config: IJsonSchemaForNpmPackageJsonFiles;
    /** Find the location of a path within the original JSON source */
    getLocation: JSONLocationFunction;
};

export type PackageJsonInvalidSchema = ErrorEvent & {
    errors: ISchemaValidationError[];
    groupedErrors: GroupedError[];
    prettifiedErrors: string[];
};

export type PackageJsonEvents = Events & {
    'parse::end::package-json': PackageJsonParsed;
    'parse::error::package-json::json': PackageJsonInvalidJSON;
    'parse::error::package-json::schema': PackageJsonInvalidSchema;
    'parse::start::package-json': PackageJsonParseStart;
};
