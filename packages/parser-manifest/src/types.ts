import { FetchEnd, FetchError, FetchStart, Event, ErrorEvent, Events } from 'hint';
import { JSONLocationFunction, ISchemaValidationError, GroupedError } from '@hint/utils-json';

/* eslint-disable camelcase */

/*
 * Platform
 *
 * https://www.w3.org/TR/appmanifest/#multi-purpose-members
 * https://github.com/w3c/manifest/wiki/Platforms
 */

export type ManifestPlatform =
    'itunes' |
    'play' |
    'windows';

/*
 * ImageResource
 * https://www.w3.org/TR/appmanifest/#imageresource-and-its-members
 */

export type ManifestImageResource = {
    platform?: ManifestPlatform;
    /*
     * Until TypeScript supports regex, I think a string is the best we
     * can use for the property purpose, the purpose value will be validated for the parser.
     * https://github.com/microsoft/TypeScript/issues/6579.
     */
    purpose: string;
    sizes?: string;
    src: string;
    type?: string;
};

/*
 * ExternalApplicationResources
 * https://www.w3.org/TR/appmanifest/#externalapplicationresource-and-its-members
 */

export type ManifestExternalApplicationResourceFingerprint = {
    type: string;
    value: string;
};

export type ManifestExternalApplicationResources = {
    platform: ManifestPlatform;
    fingerprints?: ManifestExternalApplicationResourceFingerprint[];
    id?: string;
    min_version?: string;
    url?: string;
};

/*
 * ServiceWorkerRegistrationObject
 * https://www.w3.org/TR/appmanifest/#the-serviceworkerregistrationobject-dictionary-and-its-members
 */
export type ServiceWorkerRegistrationObject = {
    scope?: string;
    src?: string;
    type:
        'classic' |
        'module';
    update_via_cache:
        'all' |
        'imports' |
        'none';
};

/*
 *  WebAppManifest
 *  https://www.w3.org/TR/appmanifest/#webappmanifest-dictionary
 */

export type Manifest = {
    background_color?: string;
    categories?: Array<
        'books' |
        'business' |
        'education' |
        'entertainment' |
        'finance' |
        'fitness' |
        'food' |
        'games' |
        'government' |
        'health' |
        'kids' |
        'lifestyle' |
        'magazines' |
        'medical' |
        'music' |
        'navigation' |
        'news' |
        'personalization' |
        'photo' |
        'politics' |
        'productivity' |
        'security' |
        'shopping' |
        'social' |
        'sports' |
        'travel' |
        'utilities' |
        'weather'
    >;
    description?: string;
    dir:
        'auto' |
        'ltr' |
        'rtl';
    display:
        'browser' |
        'fullscreen' |
        'minimal-ui' |
        'standalon';
    iarc_rating_id?: string;
    icons?: ManifestImageResource[];
    lang?: string;
    name?: string;
    orientation:
        'any' |
        'landscape' |
        'landscape-primary' |
        'landscape-secondary' |
        'natural' |
        'portrait' |
        'portrait-primary' |
        'portrait-secondar';
    prefer_related_applications: boolean;
    related_applications?: ManifestExternalApplicationResources[];
    scope?: string;
    screenshots?: ManifestImageResource[];
    serviceworker?: ServiceWorkerRegistrationObject;
    short_name?: string;
    start_url?: string;
    theme_color?: string;

    /*
     * Proprietary manifest members.
     * https://www.w3.org/TR/appmanifest/#proprietary-extensions
     */
    [other: string]: any;
};

export type ManifestInvalidJSON = ErrorEvent;

export type ManifestInvalidSchema = ErrorEvent & {
    /** The parse errors as returned by ajv. */
    errors: ISchemaValidationError[];
    /** The errors grouped for a better readability. */
    groupedErrors: GroupedError[];
    /** The errors in a more human readable format. */
    prettifiedErrors: string[];
};

export type ManifestParsed = Event & {
    /** Find the location of a path within the original JSON source */
    getLocation: JSONLocationFunction;
    /** The content of manifest parsed */
    parsedContent: Manifest;
};

export type ManifestEvents = Events & {
    'fetch::end::manifest': FetchEnd;
    'fetch::error::manifest': FetchError;
    'fetch::start::manifest': FetchStart;
    'parse::end::manifest': ManifestParsed;
    'parse::error::manifest::schema': ManifestInvalidSchema;
    'parse::error::manifest::json': ManifestInvalidJSON;
    'parse::start::manifest': Event;
};
