import * as wasm from '@concordium/rust-bindings';
import { Versioned, ArInfo, CryptographicParameters, IpInfo } from './types';

export type IdentityRequestInput = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    arsInfos: Record<string, ArInfo>;
    seed: string;
    net: 'Testnet' | 'Mainnet';
    identityIndex: number;
    arThreshold: number;
};

export type IpArData = {
    encPrfKeyShare: string;
    proofComEncEq: string;
};

export interface IdObjectRequestV1 {
    idCredPub: string;
    choiceArData: {
        arIdentities: number[];
        threshold: number;
    };
    ipArData: Record<string, IpArData>;
    idCredSecCommitment: string;
    prfKeyCommitmentWithIP: string;
    prfKeySharingCoeffCommitments: string[];
    proofsOfKnowledge: string;
}

/**
 * Creates a V1 identityRequest.
 */
export function createIdentityRequest(
    input: IdentityRequestInput
): Versioned<IdObjectRequestV1> {
    const rawRequest = wasm.createIdRequestV1(JSON.stringify(input));
    try {
        return JSON.parse(rawRequest).idObjectRequest;
    } catch (e) {
        throw new Error(rawRequest);
    }
}