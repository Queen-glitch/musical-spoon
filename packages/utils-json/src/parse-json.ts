import { findNodeAtLocation, Node, parse, parseTree, Segment } from 'jsonc-parser';
import { JSONLocationOptions, IJSONResult } from './types';
import { ProblemLocation } from '@hint/utils-types';

const rxIsNumber = /^[0-9]+$/;

class JSONResult implements IJSONResult {

    private _data: any;
    private _lines: string[];
    private _root: Node;
    private _alternatePath: string | undefined;

    public constructor(data: any, root: Node, lines: string[], alternatePath?: string) {
        this._data = data;
        this._lines = lines;
        this._root = root;
        this._alternatePath = alternatePath;

        // Ensure `getLocation` can be passed around without losing context
        this.getLocation = this.getLocation.bind(this);
    }

    public get data(): any {
        return this._data;
    }

    public getLocation(path: string, options?: JSONLocationOptions): ProblemLocation | null {
        const segments = this.pathToSegments(path);
        let node = null;

        while (!node && segments.length > 0) {
            node = findNodeAtLocation(this._root, segments) || null;

            segments.pop();
        }

        /**
         * The node isn't in the current file. Use alternative path if provided. This happens
         * when extending configurations.
         */
        /* istanbul ignore if */
        if (!node && this._alternatePath && path !== this._alternatePath) {

            return this.getLocation(this._alternatePath, options);
        }

        return this.offsetToLocation(this.getAdjustedOffset(node, path, options));
    }

    public scope(path: string): IJSONResult | null {
        const segments = this.pathToSegments(path);
        const node = findNodeAtLocation(this._root, segments);
        const value = this.findValueAtLocation(segments);

        return node ? new JSONResult(value, node, this._lines) : null;
    }

    /**
     * Determine the best offset to point to given the provided context.
     */
    private getAdjustedOffset(node: Node | null, path: string, options?: JSONLocationOptions): number {

        // Point to the root if nothing better is available
        if (!node) {
            return this._root.offset;
        }

        // Point to the value if requested (default location returned by jsonc-parser)
        /* istanbul ignore if */
        if (options && options.at === 'value') {
            return node.offset;
        }

        // Point to the value for array items
        /* istanbul ignore if */
        if (path.endsWith(']')) {
            return node.offset;
        }

        // Point to the value if there's no parent
        /* istanbul ignore if */
        if (!node.parent) {
            return node.offset;
        }

        // Otherwise point to the name
        return node.parent.offset + 1; // +1 to get past the quote (")
    }

    /**
     * Find the value at the given path in the JSON DOM.
     * @param segments The path to the value.
     */
    private findValueAtLocation(segments: Segment[]): any {
        let value = this._data;

        segments.forEach((segment) => {
            value = value[segment];
        });

        return value;
    }

    /**
     * Convert a source offset into a `ProblemLocation` with line/column data.
     * @param offset The offset in the original source.
     */
    private offsetToLocation(offset: number): ProblemLocation | null {
        for (let i = 0, n = 0; i < this._lines.length; i++) {
            const lineLength = this._lines[i].length;

            if (offset <= n + lineLength) {
                return {
                    column: offset - n,
                    line: i
                };
            }

            // Move to the next line (+1 to account for the newline)
            n += lineLength + 1;
        }

        /* istanbul ignore next */
        return null;
    }

    /**
     * Convert a JS-style path string to the `Segment` array needed by jsonc-parser.
     * @param path The path to convert (e.g. `foo.items[1].bar`).
     * @returns An array of `Segment` properties (e.g. `['foo', 'items', 1, 'bar']`).
     */
    private pathToSegments(path: string): Segment[] {
        return path

            // Strip leading dot (.) if present (ajv bug?)
            .replace(/^\./, '')

            // Ignore trailing `]` from `foo[1]`
            .replace(/]/g, '')

            // Break items on `.` or `[`
            .split(/[[.]/)

            // Ensure numbers are not returned as strings
            .map((k) => {
                /* istanbul ignore next */
                return rxIsNumber.test(k) ? parseInt(k) : k;
            });
    }
}

/**
 * Parse the provided JSON returning a `JSONResult` with location information.
 * @param json The JSON string to parse
 * @param alternatePath The alternative `path` to use when one is not found
 */
export const parseJSON = (json: string, alternatePath?: string): IJSONResult => {
    const lines = json.split('\n');
    const data = parse(json);
    const root = parseTree(json);

    // If we didn't get a root, it's invalid JSON
    /* istanbul ignore if */
    if (!root) {
        // Use the built-in JSON parser to get an error
        JSON.parse(json);
    }

    return new JSONResult(data, root, lines, alternatePath);
};
