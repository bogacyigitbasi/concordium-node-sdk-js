import { AttributeKeyString, AttributesKeys } from '../src/types';
import {
    StatementTypes,
    attributesWithRange,
    attributesWithSet,
} from '../src/idProofTypes';
import { getIdProof, IdStatementBuilder } from '../src/idProofs';
import fs from 'fs';

test('Creating a statement with multiple atomic statements on the same attribute fails', () => {
    const builder = new IdStatementBuilder(true);
    expect(() =>
        builder
            .addRange(AttributesKeys.dob, '20001010', '20201010')
            .addRange(AttributesKeys.dob, '20001010', '20201010')
    ).toThrow();
    expect(() =>
        builder
            .addMembership(AttributesKeys.countryOfResidence, [])
            .addEUResidency()
    ).toThrow();
    expect(() =>
        builder
            .addNonMembership(AttributesKeys.countryOfResidence, ['DE'])
            .addNonMembership(AttributesKeys.countryOfResidence, ['DK', 'FR'])
    ).toThrow();
    expect(() =>
        builder
            .revealAttribute(AttributesKeys.countryOfResidence)
            .revealAttribute(AttributesKeys.countryOfResidence)
    ).toThrow();
    expect(() => builder.addMinimumAge(18).addMinimumAge(20)).toThrow();
});

test('Minimum age helper adds a range statement on date of birth', () => {
    const builder = new IdStatementBuilder(true);
    const statement = builder.addMinimumAge(18).getStatement();
    expect(statement[0].type).toBe(StatementTypes.AttributeInRange);
    expect(statement[0].attributeTag).toBe('dob');
});

test('Eu helpers adds a membership statement', () => {
    const builder = new IdStatementBuilder(true);
    const statement = builder
        .addEUResidency()
        .addEUNationality()
        .getStatement();
    expect(statement[0].type).toBe(StatementTypes.AttributeInSet);
    expect(statement[0].attributeTag).toBe('countryOfResidence');
    expect(statement[1].type).toBe(StatementTypes.AttributeInSet);
    expect(statement[1].attributeTag).toBe('nationality');
});

test('Only attributesWithRange can have range statements added', () => {
    const builder = new IdStatementBuilder(true);
    for (const x in AttributeKeyString) {
        if (!attributesWithRange.includes(x as AttributeKeyString)) {
            expect(() =>
                builder.addRange(
                    AttributesKeys[x as AttributeKeyString],
                    '20001010',
                    '20201010'
                )
            ).toThrow(x + ' is not allowed to be used in range statements');
        } else {
        }
    }
    expect(builder.getStatement().length).toBe(0);
});

test('Only attributesWithSet can have membership statements added', () => {
    const builder = new IdStatementBuilder(true);
    for (const x in AttributeKeyString) {
        if (!attributesWithSet.includes(x as AttributeKeyString)) {
            expect(() =>
                builder.addMembership(AttributesKeys[x as AttributeKeyString], [
                    'DK',
                    'DE',
                ])
            ).toThrow(
                x + ' is not allowed to be used in membership statements'
            );
        }
    }
    expect(builder.getStatement().length).toBe(0);
});

test('Unknown attribute tags are rejected', () => {
    const builder = new IdStatementBuilder(true);
    expect(() => builder.addMembership(-1, ['DK'])).toThrow();
    expect(() => builder.addMembership(15, ['DK'])).toThrow();
    expect(() => builder.addMembership(1000, ['DK'])).toThrow();
});

test('Empty sets are rejected', () => {
    const builder = new IdStatementBuilder(true);
    expect(() =>
        builder.addMembership(AttributesKeys.countryOfResidence, [])
    ).toThrow();
    expect(() =>
        builder.addNonMembership(AttributesKeys.countryOfResidence, [])
    ).toThrow();
});

test('Can create id Proof', () => {
    const idObject = JSON.parse(
        fs.readFileSync('./test/resources/identity-object.json').toString()
    ).value;
    const globalContext = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;

    const builder = new IdStatementBuilder(true);
    const statement = builder
        .addEUResidency()
        .addEUNationality()
        .addMinimumAge(18)
        .getStatement();
    const challenge = 'AAAAAA';
    const proof = getIdProof({
        idObject,
        globalContext,
        seedAsHex:
            'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860',
        net: 'Testnet',
        identityProviderIndex: 0,
        identityIndex: 0,
        credNumber: 1,
        statement,
        challenge,
    });
    expect(proof.credential).toEqual(
        'b317d3fea7de56f8c96f6e72820c5cd502cc0eef8454016ee548913255897c6b52156cc60df965d3efb3f160eff6ced4'
    );
    const proofValue = proof.proof.value.proofs;
    expect(proofValue.length).toBe(3);
    expect(proofValue[0].type).toBe(StatementTypes.AttributeInSet);
    expect(proofValue[1].type).toBe(StatementTypes.AttributeInSet);
    expect(proofValue[2].type).toBe(StatementTypes.AttributeInRange);
    expect(proofValue[0].proof).toBeDefined();
    expect(proofValue[1].proof).toBeDefined();
    expect(proofValue[2].proof).toBeDefined();
});