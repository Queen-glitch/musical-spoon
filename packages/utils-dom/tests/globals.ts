import test from 'ava';

import * as parse5 from 'parse5';
import * as htmlparser2Adapter from 'parse5-htmlparser2-tree-adapter';

import { createHTMLDocument } from '../src';
import { populateGlobals } from '../src/globals';
import { HTMLDocument } from '../src/htmldocument';
import { DocumentData, ElementData } from '../src/types';

test('getComputedStyle', (t) => {
    const context: any = {};
    const dom = parse5.parse('<body>Test</body>', {
        sourceCodeLocationInfo: false,
        treeAdapter: htmlparser2Adapter
    }) as DocumentData;

    const bodyData = (dom.children[0] as ElementData).children[1] as ElementData;

    bodyData['x-styles'] = { display: 'none' };

    const doc = new HTMLDocument(dom, 'https://localhost');

    populateGlobals(context, doc);

    t.truthy(context.getComputedStyle);
    t.is(context.getComputedStyle(doc.body).getPropertyValue('display'), 'none');
});

test('instanceof', (t) => {
    const context: any = {};
    const doc = createHTMLDocument('test', 'http://localhost/');

    populateGlobals(context, doc);

    t.true(context.document instanceof context.HTMLDocument);
    t.true(context.document.body instanceof context.HTMLBodyElement);
    t.true(context.document.body instanceof context.HTMLElement);
});

test('instances', (t) => {
    const context: any = {};
    const doc = createHTMLDocument('test', 'http://localhost/');

    populateGlobals(context, doc);

    t.is(context.document, doc);
    t.is(context.document.defaultView, context);
    t.is(context.window, context);
    t.is(context.self, context);
    t.is(context.top, context);
});

test('existing self', (t) => {
    const context: any = {};
    const doc = createHTMLDocument('test', 'http://localhost/');

    Object.defineProperty(context, 'self', {
        get() {
            return context;
        },
        set(value) {
            throw new Error('Cannot override "self".');
        }
    });

    t.notThrows(() => {
        populateGlobals(context, doc);
    });
});
