/**
 * @fileoverview Loads the connections.ini and updates it if needed
 */

import { readFile } from '@hint/utils-fs';
import { NetworkConfig } from './types';

/**
 * Parses a string that contains a network configuration.
 *
 * The configuration string should have the following format:
 *
 * ```ini
 * [Cable]
 * label="Cable (5/1 Mbps 28ms RTT)"
 * bwIn=5000000
 * bwOut=1000000
 * latency=28
 * plr=0
 * ``` *
 */
const parseConnection = (configText: string): NetworkConfig => {
    const lines = configText.split('\n');
    const config: NetworkConfig = {
        bwIn: 0,
        bwOut: 0,
        id: '',
        label: '',
        latency: 0,
        plr: 0
    };

    const numerics = ['bwIn', 'bwOut', 'latency', 'plr'];

    lines.forEach((line) => {
        const [key, value] = line.trim().split('=') as [keyof NetworkConfig, string];

        if (key.startsWith('[')) {
            config.id = key.replace(/[[\]]/g, '');

            return;
        }

        (config as any)[key] = numerics.includes(key) ?
            parseInt(value) :
            value;
    });

    return config;
};

/** Loads all the network configurations in the `connections.ini` file. */
const getConnections = (): NetworkConfig[] => {
    const configContent = readFile(`${__dirname}/connections.ini`);

    const configsText = configContent
        .replace(/#.*?\n/g, '') // remove comments
        .replace(/\r\n/g, '\n') // remove \r in case the file has a Windows EOL
        .split(`\n\n`);

    const configs = configsText.map(parseConnection);

    return configs;
};

const connections = getConnections();

/** The ids of all the available connections. */
const ids = connections.map((connection) => {
    return connection.id;
}, []);

/** Returns the `NetworkConfig` for the given `id`. */
const getById = (id: string): NetworkConfig | null => {
    return connections.find((connection) => {
        return connection.id === id;
    }) || /* istanbul ignore next */ null;
};

export {
    getById,
    ids
};
