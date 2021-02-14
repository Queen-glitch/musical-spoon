import { browser } from './shared/globals';
import { Config, Events } from './shared/types';

const configs = new Map<number, Config>();
const readyTabs = new Set<number>();
const queuedEvents = new Map<number, Events[]>();
const devtoolsPorts = new Map<number, chrome.runtime.Port>();

/** Emit an event to a tab's content script if ready; queue otherwise. */
const sendEvent = (tabId: number, event: Events) => {
    if (readyTabs.has(tabId)) {

        browser.tabs.sendMessage(tabId, event);

    } else {

        if (!queuedEvents.has(tabId)) {
            queuedEvents.set(tabId, []);
        }

        const events = queuedEvents.get(tabId)!; // Won't be `null` per `has` check above.

        events.push(event);
    }
};

/** Add the script to run webhint to the page. */
const injectContentScript = (tabId: number, retries = 0) => {
    browser.tabs.executeScript(tabId, { file: 'content-script/webhint.js', runAt: 'document_start' }, (result) => {
        // We get an empty object `{}` back on success, or `undefined` if the script failed to execute.
        if (!result) {
            if (retries <= 2) {
                /*
                 * Injection occassionally fails in Firefox; retry.
                 * Variation of https://bugzilla.mozilla.org/show_bug.cgi?id=1397667
                 */
                console.warn('Failed to inject content script. Retrying...');
                injectContentScript(tabId, retries + 1);
            } else {
                // Give up if retrying still doesn't inject the content script.
                const port = devtoolsPorts.get(tabId);
                const message = 'Failed to inject content script after retrying.';
                const event: Events = { error: { message, stack: '' } };

                console.error(message);

                if (port) {
                    port.postMessage(event);
                }
            }
        }
    });
};

/** Turn on request tracking for the specified tab. */
const enable = (tabId: number) => {
    readyTabs.delete(tabId);
    let timeout = 0;

    // Wait until the page is committed to being rendered before injecting the content script.
    const onCommitted = (details: chrome.webNavigation.WebNavigationTransitionCallbackDetails) => {
        if (details.tabId === tabId && details.frameId === 0) {
            browser.webNavigation.onCommitted.removeListener(onCommitted);
            clearTimeout(timeout);
            injectContentScript(tabId);
        }
    };

    browser.webNavigation.onCommitted.addListener(onCommitted);

    // Failsafe to ensure we don't leave a `webNavigation` listener active if the reload fails.
    timeout = setTimeout(() => {
        browser.webNavigation.onCommitted.removeListener(onCommitted);
    }, 10000) as any;

    browser.tabs.reload(tabId, { bypassCache: true });
};

// Watch for new connections from devtools panels.
browser.runtime.onConnect.addListener((port) => {
    devtoolsPorts.set(parseInt(port.name), port);
});

// Watch for messages from content scripts and devtools panels (listed roughly in the order they will occur).
browser.runtime.onMessage.addListener((message: Events, sender) => {
    const tabId = message.tabId || sender.tab && sender.tab.id;

    /* istanbul ignore if */
    // Aid debugging by ensuring a tabId is always found.
    if (!tabId) {
        throw new Error(`Message received without a tabId: ${JSON.stringify(message)}`);
    }

    // Activate content-script when requested by devtools page (saving configuration for when content-script is ready).
    if (message.enable) {
        configs.set(tabId, message.enable.config);
        enable(tabId);
    }

    if (message.evaluateResult) {
        browser.tabs.sendMessage(tabId, message);
    }

    // Forward configuration to content-script when asked (happens before `message.ready`).
    if (message.requestConfig) {
        const configMessage: Events = { config: configs.get(tabId) || {} };

        browser.tabs.sendMessage(tabId, configMessage);
    }

    // Send queued events to content-script when ready.
    if (message.ready) {
        readyTabs.add(tabId);

        if (queuedEvents.has(tabId)) {
            const events = queuedEvents.get(tabId)!;

            events.forEach((event) => {
                sendEvent(tabId, event);
            });

            queuedEvents.delete(tabId);
        }
    }

    // Forward or queue `fetch::*` events from devtools page to content script (can occur before `message.ready`).
    if (message.fetchEnd || message.fetchStart) {
        sendEvent(tabId, message);
    }

    // Forward errors or results from content-script to the associated devtools panel.
    if (message.error || message.evaluate || message.results) {
        const port = devtoolsPorts.get(tabId);

        if (port) {
            port.postMessage(message);
        }
    }
});
