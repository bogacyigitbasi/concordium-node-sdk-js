import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    InitContractPayload,
    ParameterType,
    ParameterValue,
    StructParameter,
} from '../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '../src/serialization';
import { getNodeClient } from './testHelpers';
import { AccountAddress } from '../src/types/accountAddress';
import { GtuAmount } from '../src/types/gtuAmount';
import { TransactionExpiry } from '../src/types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from '../src/types/moduleReference';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
// test case for init contract
test('init contract with the wrong private key', async () => {
    const nextAccountNonce = await client.getNextAccountNonce(
        new AccountAddress(senderAccountAddress)
    );
    if (!nextAccountNonce) {
        throw new Error('Nonce not found!');
    }
    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextAccountNonce.nonce,
        sender: new AccountAddress(senderAccountAddress),
    };

    const contractName = 'MarkSheet';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputParams: ParameterValue<any> = {
        type: ParameterType.Struct,
        value: [
            {
                type: ParameterType.U8,
                value: 25,
            },
            {
                type: ParameterType.U8,
                value: 23,
            },
            {
                type: ParameterType.U8,
                value: 22,
            },
        ] as StructParameter,
    };
    const baseEnergy = 300000n;

    const initModule: InitContractPayload = {
        amount: new GtuAmount(0n),
        moduleRef: new ModuleReference(
            '05b53729aef402a001226cd3d91e1044a4a6b29cd063b290f7798eb487750a8b'
        ),
        contractName: contractName,
        parameter: inputParams,
        maxContractExecutionEnergy: baseEnergy,
    } as InitContractPayload;

    const initContractTransaction: AccountTransaction = {
        header: header,
        payload: initModule,
        type: AccountTransactionType.InitializeSmartContractInstance,
    };

    const hashToSign = getAccountTransactionSignDigest(initContractTransaction);
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        initContractTransaction,

        signatures
    );

    expect(result).toBeTruthy();
}, 300000);
