import {
    ContractAddress,
    createConcordiumClient,
    InstanceInfo,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required:
    --contract, -c  The index of the contract to query info about

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            contract: {
                type: 'number',
                alias: 'c',
                isRequired: true,
            },
            block: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
        },
    }
);

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Used to get information about a specific contract instance, at a specific
 * block.
 */

(async () => {
    const contractAddress: ContractAddress = {
        index: BigInt(cli.flags.contract),
        subindex: 0n,
    };

    const instanceInfo: InstanceInfo = await client.getInstanceInfo(
        contractAddress,
        cli.flags.block
    );

    console.log('Name:', instanceInfo.name);
    console.log('Amount:', instanceInfo.amount.microCcdAmount);
    console.log('Version:', instanceInfo.version);
    console.log('Owner:', instanceInfo.owner.address);
    console.log('Module Reference:', instanceInfo.sourceModule.moduleRef);
    console.log('Methods:', instanceInfo.methods);
})();