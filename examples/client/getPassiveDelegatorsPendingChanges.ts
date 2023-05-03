import { createConcordiumClient, DelegatorInfo } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';
import chalk from 'chalk';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
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
 * Get the registered passive delegators at the end of a given block. In
 * contrast to the `GetPassiveDelegatorsRewardPeriod` which returns delegators
 * that are fixed for the reward period of the block, this endpoint returns
 * the list of delegators that are registered in the block. Any changes to
 * delegators are immediately visible in this list. The stream will end when
 * all the delegators has been returned.

 * If a blockhash is not supplied it will pick the latest finalized block.
 * An optional abort signal can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    const delegators: AsyncIterable<DelegatorInfo> =
        client.getPassiveDelegators(cli.flags.block);

    console.log('Each staking account and the amount of stake they have:\n');
    for await (const delegatorInfo of delegators) {
        if (delegatorInfo.pendingChange) {
            console.log('Account:', chalk.green(delegatorInfo.account));
            console.log('Pending Change:', delegatorInfo.pendingChange, '\n');
        }
    }
})();
