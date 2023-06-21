import * as wasm from '@concordium/rust-bindings';
import { AccountAddress } from './types/accountAddress';
import {
    ReduceStakePendingChange,
    RemovalPendingChange,
    AccountInfo,
    AccountInfoBaker,
    AccountInfoDelegator,
    GenerateBakerKeysOutput,
} from './types';

export const isDelegatorAccount = (
    ai: AccountInfo
): ai is AccountInfoDelegator =>
    (ai as AccountInfoDelegator).accountDelegation !== undefined;

export const isBakerAccount = (ai: AccountInfo): ai is AccountInfoBaker =>
    (ai as AccountInfoBaker).accountBaker !== undefined;

export const isReduceStakePendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is ReduceStakePendingChange =>
    (spc as ReduceStakePendingChange).newStake !== undefined;

export const isRemovalPendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is RemovalPendingChange => !isReduceStakePendingChange(spc);

/**
 * Generates random baker keys for the specified account, that can be used with the configureBaker transaction
 * @param account the address of the account that the keys should be added to.
 * @returns an object containing the public baker keys, their associated proofs and their associated private keys.
 */
export function generateBakerKeys(
    account: AccountAddress
): GenerateBakerKeysOutput {
    const rawKeys = wasm.generateBakerKeys(account.address);
    try {
        return JSON.parse(rawKeys);
    } catch (e) {
        throw new Error(rawKeys);
    }
}
