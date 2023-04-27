import {
    createConcordiumClient,
    CIS2,
    CIS2Contract,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { parseAddress } from '../shared/util';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --index,            -i  The index of the smart contract
    --from,                 Account address to transfer tokens from.
    --to,                   Address to transfer tokens to. Base58 string for account address, string in the format <index>,<subindex> (f.x. 123,0) for contract address.
    --amount,               Amount of tokens to transfer. Should be specified in non-fractional units, i.e. 1 token of a token with 6 decimals would be 1000000.

  Options
    --help,             -h  Displays this message
    --endpoint,         -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --subindex,             The subindex of the smart contract. Defaults to 0
    --tokenId,          -t  The token ID to query a balance for. Defaults to '', which represents the smallest token ID possible, commonly used for single token contract instances.
    --receiveHookName,      The name of the receive hook on a receiving contract. This is only necessary (and required), if 'to' argument is a contract address.
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            index: {
                type: 'number',
                alias: 'i',
                isRequired: true,
            },
            subindex: {
                type: 'number',
                default: 0,
            },
            from: {
                type: 'string',
                isRequired: true,
            },
            to: {
                type: 'string',
                isRequired: true,
            },
            amount: {
                type: 'string',
                isRequired: true,
            },
            tokenId: {
                type: 'string',
                alias: 't',
                default: '',
            },
            receiveHookName: {
                type: 'string',
            },
        },
    }
);

const [nodeAddress, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    nodeAddress,
    Number(port),
    credentials.createInsecure()
);

if (cli.flags.h) {
    cli.showHelp();
}

(async () => {
    const contract = await CIS2Contract.create(client, {
        index: BigInt(cli.flags.index),
        subindex: BigInt(cli.flags.subindex),
    });

    const tokenId = cli.flags.tokenId;
    const from = cli.flags.from;
    const toAddress = parseAddress(cli.flags.to);
    const to: CIS2.Receiver =
        typeof toAddress === 'string'
            ? toAddress
            : {
                  address: toAddress,
                  hookName: cli.flags.receiveHookName ?? '',
              };

    const result = await contract.dryRun.transfer(from, {
        from,
        to,
        tokenAmount: BigInt(cli.flags.amount),
        tokenId,
    });

    console.log(result);
})();
