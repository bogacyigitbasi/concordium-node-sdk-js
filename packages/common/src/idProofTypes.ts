import {
    AttributeKey,
    CryptographicParameters,
    IdentityObjectV1,
    Network,
    Versioned,
} from '.';

export enum StatementTypes {
    RevealAttribute = 'RevealAttribute',
    AttributeInSet = 'AttributeInSet',
    AttributeNotInSet = 'AttributeNotInSet',
    AttributeInRange = 'AttributeInRange',
}

export type RevealStatement = {
    type: StatementTypes.RevealAttribute;
    attributeTag: AttributeKey;
};

export type MembershipStatement = {
    type: StatementTypes.AttributeInSet;
    attributeTag: AttributeKey;
    set: string[];
};

export type NonMembershipStatement = {
    type: StatementTypes.AttributeNotInSet;
    attributeTag: AttributeKey;
    set: string[];
};

export type RangeStatement = {
    type: StatementTypes.AttributeInRange;
    attributeTag: AttributeKey;
    lower: string;
    upper: string;
};

export type AtomicStatement =
    | RevealStatement
    | MembershipStatement
    | NonMembershipStatement
    | RangeStatement;
export type IdStatement = AtomicStatement[];

export type IdProofInput = {
    idObject: IdentityObjectV1;
    globalContext: CryptographicParameters;
    seedAsHex: string;
    net: Network;
    identityProviderIndex: number;
    identityIndex: number;
    credNumber: number;
    statement: IdStatement;
    challenge: string; // Hex
};

export type RevealProof = {
    type: StatementTypes.RevealAttribute;
    proof: string;
    attribute: string;
};

export type ZKAtomicProof = {
    type: Exclude<StatementTypes, StatementTypes.RevealAttribute>;
    proof: string;
};

export type AtomicProof = RevealProof | ZKAtomicProof;
export type IdProof = {
    proofs: AtomicProof[];
};

export type IdProofOutput = {
    credential: string;
    proof: Versioned<IdProof>;
};

export enum Sex {
    NotKnown = '0',
    Male = '1',
    Female = '2',
    NA = '9',
}

export enum IdDocType {
    NA = '0',
    Passport = '1',
    NationalIdCard = '2',
    DriversLicense = '3',
    ImmigrationCard = '4',
}

/**
 * The attributes that can be used for range statements
 */
export const attributesWithRange: AttributeKey[] = [
    'dob',
    'idDocIssuedAt',
    'idDocExpiresAt',
];

/**
 * The attributes that can be used for (non)membership statements
 */
export const attributesWithSet: AttributeKey[] = [
    'countryOfResidence',
    'nationality',
    'idDocType',
    'idDocIssuer',
];
