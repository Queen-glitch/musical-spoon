/**
 * @fileoverview Performance budget checks if your site will load fast enough based on the size of your resources and a given connection speed
 */

import { URL } from 'url';

import { isHTTPS, normalizeHeaderValue } from '@hint/utils-network';
import { debug as d } from '@hint/utils-debug';
import { FetchEnd, HintContext, IHint, Response, ScanEnd } from 'hint';
import { Severity } from '@hint/utils-types';

import { NetworkConfig, ResourceResponse, PerfBudgetConfig } from './types';
import * as Connections from './connections';

import meta from './meta';
import { getMessage } from './i18n.import';

const debug: debug.IDebugger = d(__filename);

/**
 * The default configuration for this hint:
 *
 * * `connectionType`: 3GFast
 * * `loadTime`: 5
 *
 */
const defaultConfig: PerfBudgetConfig = {
    connectionType: '3GFast',
    loadTime: 5
};

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

export default class PerformanceBudgetHint implements IHint {

    public static readonly meta = meta;

    public constructor(context: HintContext) {

        /** An array containing all the responses. */
        const responses: ResourceResponse[] = [];
        /** Set with all the different domains loaded by the site. */
        const uniqueDomains: Set<string> = new Set();
        /** Set with all the different HTTPS domains loaded by the site. */
        const secureDomains: Set<string> = new Set();
        /** Number of total redirects found to load the resources. */
        let performedRedirects: number = 0;
        /** Number of total requests performed. */
        let performedRequests: number = 0;

        /** Update the stored information for unique domains (`uniqueDomains`) and connections over https (`secureDomains`). */
        const updateDomainsInfo = (resource: string) => {
            const resourceUrl = new URL(resource);

            uniqueDomains.add(resourceUrl.hostname);

            if (isHTTPS(resource)) {
                secureDomains.add(resourceUrl.hostname);
            }
        };

        /** Updates the total count of redirects (`performedRedirects`) for the given response and the total number of requests. */
        const updateCounters = (response: Response) => {
            performedRedirects += response.hops.length;
            performedRequests++;
        };

        /**
         * Store the amount of bytes transferred for a given response into
         * `responses`. It takes into account the mime type, compressed,
         * and uncompressed size.
         */
        const updateSizes = async (resource: string, response: Response) => {
            const uncompressedSize: number = response.body.rawContent ?
                response.body.rawContent.byteLength :
                response.body.content.length;
            let sentSize: number;
            const contentEncoding = normalizeHeaderValue(response.headers, 'content-encoding', '');

            if (contentEncoding) {
                try {
                    sentSize = (await response.body.rawResponse()).byteLength;
                } catch (e) /* istanbul ignore next */ {
                    debug(`Error trying to get the \`rawResponse\` for ${resource}. Using uncompressedSize instead`);
                    debug(e);

                    sentSize = uncompressedSize;
                }
            } else {
                sentSize = uncompressedSize;
            }

            responses.push({
                resource,
                sentSize,
                uncompressedSize
            });
        };

        const onFetchEnd = async (fetchEnd: FetchEnd) => {
            debug(`Validating hint Performance budget`);
            const { resource, response } = fetchEnd;

            updateDomainsInfo(resource);
            updateCounters(response);
            await updateSizes(resource, response);
        };

        /**
         * Returns the details for the selected network
         * configuration or the default one.
         */
        const getConfiguration = (): NetworkConfig | null => {
            const userConfig = Object.assign({}, defaultConfig, context.hintOptions) as PerfBudgetConfig;
            const config = Connections.getById(userConfig.connectionType /* istanbul ignore next */ || '');

            /* istanbul ignore else */
            if (config) {
                config.load = userConfig.loadTime;
            }

            return config;
        };

        /**
         * Calculates the minimum required time in seconds to do all the DNS Look ups for the loaded resources.
         *
         * The best scenario for a DNS Lookup not cached in the system is 1 RTT: https://www.cloudflare.com/learning/dns/what-is-dns/
         */
        const calculateTotalDNSLookUp = (domains: Set<string>, config: NetworkConfig): number => {


            const dnsLookUpTime = config.latency;
            const total = domains.size * dnsLookUpTime / 1000;

            debug(`Total DNS lookup time: ${total}`);

            return total;
        };

        /**
         * Calculates the minimum required time in seconds to establish
         * all the TCP connections.
         *
         * All TCP connections beging with a _Three-way handshake_, but
         * clients can start sending application data after they receive
         * the `ACK` message, if the delay is just 1 RTT:
         *
         * `time = connections * RTT`
         *
         * You can read more about this in: https://hpbn.co/building-blocks-of-tcp/#three-way-handshake
         *
         */
        const calculateTotalTCPHandshake = (connections: number, config: NetworkConfig): number => {
            const time = connections * config.latency / 1000;

            return time;
        };

        /**
         * Calculates the minimum required time in seconds to do all
         * the TLS handshaking of a website.
         *
         * It assumes 1 RTT per TLS connection as an optimistic scenario.
         * More info in: https://hpbn.co/transport-layer-security-tls/#tls-handshake
         */
        const calculateTotalTLSHandshaking = (domains: Set<string>, config: NetworkConfig): number => {
            const tlsHandshakingTime = config.latency;
            const total = domains.size * tlsHandshakingTime / 1000;

            debug(`Total TLS handshake time: ${total}`);

            return total;
        };

        /**
         * Calculates the minimum required time in seconds to process
         * all the redirects found.
         *
         * The time for a redirect is 1 RTT
         */
        const calculateTotalRedirectTime = (redirects: number, config: NetworkConfig) => {
            // Perfect scenario for a redirect is 1 round trip in cold
            const total = redirects * config.latency / 1000;

            debug(`Total redirect time: ${total}`);

            return total;
        };

        /**
         * Calculates the transfer time in seconds for a resource under the following assumptions:
         *
         * * Connections use the maximum bandwidth after `slow-start`
         * * The congestion window (`cwnd`) is 10 network segments
         * * The receive window (`rwnd`) is 65,535 bytes and there isn't any `TCP window scaling`
         * * There's a `slow-start` phase
         * * DNS lookup, and TLS handshake are not taken into account here
         *
         * The way the time it's calculated is as follows:
         *
         * 1. Calculate the `slow-start` time for the minimum of `rwnd` or the transfered size.
         * 2. If the size of the response is bigger than `rwnd`, the rest of the file is sent at maximum speed.
         *
         * To know more about `slow-start` visit https://hpbn.co/building-blocks-of-tcp/#slow-start
         */
        const calculateTransferTimeForResource = (response: ResourceResponse, config: NetworkConfig): number => {
            const networkSegmentSize: number = 1460;
            const rwnd: number = 65535;
            const cwnd: number = 10; // RFC-6928: https://tools.ietf.org/html/rfc6928
            const dataInFlight: number = Math.min(response.sentSize, rwnd);
            const segments: number = Math.ceil(dataInFlight / networkSegmentSize);

            const time = config.latency * (Math.log2(1 + segments / cwnd)) / 1000;

            if (response.sentSize < rwnd) {
                return time;
            }

            // `bwIn` is measured in bits per second, thus bytes * 8 to get the bits
            return (response.sentSize - rwnd) * 8 / config.bwIn + time;
        };

        /** Calculates the transfer time in seconds for all the given responses with no TCP connection reuse.*/
        const calculateTransferTimeWithSlowStart = (allResponses: ResourceResponse[], config: NetworkConfig): number => {
            const totalTime = allResponses.reduce((time, resource) => {
                const transfertTime = calculateTransferTimeForResource(resource, config);

                return time + transfertTime;
            }, 0);

            return totalTime;
        };

        /**
         * Returns the total time in seconds to load all the resources for the
         * best case scenario in the configured network taking into account:
         *
         * * DNS Lookup
         * * TCP Handshake
         * * TLS Handshake
         * * Redirects
         * * Size of resources
         */
        const getBestCaseScenario = (config: NetworkConfig) => {

            const dnsLookUpTime = calculateTotalDNSLookUp(uniqueDomains, config);
            const tcpHandshakeTime = calculateTotalTCPHandshake(performedRequests, config);
            const tlsHandshakeTime = calculateTotalTLSHandshaking(secureDomains, config);
            const redirectTime = calculateTotalRedirectTime(performedRedirects, config);
            const transferTimeSlowStart = calculateTransferTimeWithSlowStart(responses, config);

            const total = dnsLookUpTime +
                tcpHandshakeTime +
                tlsHandshakeTime +
                redirectTime +
                transferTimeSlowStart;

            return total;
        };

        const calculateSeverity = (loadTime: number, configurationLoadTime: number): Severity => {
            const percentage = (loadTime * 100) / configurationLoadTime;

            if (percentage < 90) {
                return Severity.off;
            } else if (percentage < 100) {
                return Severity.hint;
            } else if (percentage < 150) {
                return Severity.warning;
            }

            return Severity.error;
        };

        /**
         * Calculates if the size of all the loaded resources is small enough to
         * load the site in the allocated time.
         */
        const onScanEnd = (scanEnd: ScanEnd) => {
            const { resource } = scanEnd;
            const config: NetworkConfig | null = getConfiguration();

            /* istanbul ignore if */
            if (!config) {
                return;
            }

            const loadTime = getBestCaseScenario(config);

            debug(`Ideal load time: ${loadTime}s`);


            if (typeof config.load === 'number') {
                const severity = calculateSeverity(loadTime, config.load);

                if (severity !== Severity.off) {
                    context.report(
                        resource,
                        getMessage(severity === Severity.hint ? 'toLoadAllResourcesLess' : 'toLoadAllResourcesMore', context.language, [config.id, loadTime.toFixed(1), (loadTime - config.load).toFixed(1), config.load.toString()]),
                        { severity });
                }
            }
        };

        context.on('fetch::end::*', onFetchEnd);
        context.on('scan::end', onScanEnd);
    }
}
