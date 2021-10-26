// TODO This should probably not be in the package, but be put somewhere else.
// It has nothing to do with the interaction with the node.?
import { ArInfo, IpInfo, Versioned } from './types';

interface CredentialHolderInformation {
    idCredSecret: string;
}

interface AccountCredentialInformation {
    credentialHolderInformation: CredentialHolderInformation;
    prfKey: string;
}

interface PrivateIdObjectData {
    aci: AccountCredentialInformation;
    randomness: string;
}

export interface IdentityProvider {
    arsInfos: Record<number, ArInfo>;
    ipInfo: IpInfo;
}

export interface Identity {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accounts: any[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    identityObject: any;
    identityProvider: IdentityProvider;

    name: string;
    nextAccountNumber: number;

    privateIdObjectData: PrivateIdObjectData;
}

interface Identities {
    identities: Identity[];
}

export interface MobileWalletExport extends Versioned<Identities> {
    type: string;
}
