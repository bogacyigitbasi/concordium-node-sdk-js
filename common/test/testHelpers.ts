import * as fs from 'fs';
import { IdentityInput } from '../src/types';
import { decryptMobileWalletExport, EncryptedData } from '../src/wallet/crypto';
import { MobileWalletExport } from '../src/wallet/types';

export function isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}

export function getIdentityInput(): IdentityInput {
    const rawData = fs.readFileSync(
        './test/resources/mobileWalletExport.json',
        'utf8'
    );
    const mobileWalletExport: EncryptedData = JSON.parse(rawData);
    const decrypted: MobileWalletExport = decryptMobileWalletExport(
        mobileWalletExport,
        '123123'
    );
    const identity = decrypted.value.identities[0];
    const identityInput: IdentityInput = {
        identityProvider: identity.identityProvider,
        identityObject: identity.identityObject,
        idCredSecret:
            identity.privateIdObjectData.aci.credentialHolderInformation
                .idCredSecret,
        prfKey: identity.privateIdObjectData.aci.prfKey,
        randomness: identity.privateIdObjectData.randomness,
    };
    return identityInput;
}
