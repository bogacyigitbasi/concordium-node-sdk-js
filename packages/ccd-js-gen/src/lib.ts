import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as tsm from 'ts-morph';
import * as SDK from '@concordium/common-sdk';

/**
 * Generate smart contract client code for a given smart contract module.
 * @param modulePath Path to the smart contract module.
 * @param outDirPath Path to the directory to use for the output.
 */
export async function generateContractClients(
    modulePath: string,
    outDirPath: string
): Promise<void> {
    // TODO catch if file does not exist and produce better error.
    const fileBytes = await fs.readFile(modulePath);
    const module = SDK.Module.from(fileBytes);

    const moduleInterface = await module.parseModuleInterface();

    const outputName = path.basename(modulePath, '.wasm.v1');
    const outputFilePath = path.format({
        name: outputName,
        dir: outDirPath,
        ext: '.ts',
    });

    const compilerOptions: tsm.CompilerOptions = {
        outDir: outDirPath,
        declaration: true,
    };
    const project = new tsm.Project({ compilerOptions });
    const sourceFile = project.createSourceFile(outputFilePath, '', {
        overwrite: true,
    });
    addModuleClients(sourceFile, moduleInterface);
    await Promise.all([project.save(), project.emit()]);
}

/** Iterates a module interface adding code to the provided source file. */
function addModuleClients(
    sourceFile: tsm.SourceFile,
    moduleInterface: SDK.ModuleInterface
) {
    sourceFile.addImportDeclaration({
        namespaceImport: 'SDK',
        moduleSpecifier: '@concordium/common-sdk',
    });

    for (const contract of moduleInterface.values()) {
        const contractNameId = 'contractName';
        const genericContractId = 'genericContract';
        const grpcClientId = 'grpcClient';
        const contractAddressId = 'contractAddress';
        const dryRunId = 'dryRun';
        const contractClassId = toPascalCase(contract.contractName);
        const contractDryRunClassId = `${contractClassId}DryRun`;

        const classDecl = sourceFile.addClass({
            docs: ['Smart contract client for a contract instance on chain.'],
            isExported: true,
            name: contractClassId,
            properties: [
                {
                    docs: [
                        'Name of the smart contract supported by this client.',
                    ],
                    scope: tsm.Scope.Public,
                    isReadonly: true,
                    name: contractNameId,
                    type: 'string',
                    initializer: `'${contract.contractName}'`,
                },
                {
                    docs: ['Generic contract client used internally.'],
                    scope: tsm.Scope.Private,
                    name: genericContractId,
                    type: 'SDK.Contract',
                },
                {
                    docs: ['Dry run entrypoints of the smart contract.'],
                    scope: tsm.Scope.Public,
                    name: dryRunId,
                    type: contractDryRunClassId,
                },
            ],
        });

        const dryRunClassDecl = sourceFile.addClass({
            docs: [
                `Smart contract client for dry running messages to a contract instance of '${contract.contractName}' on chain.`,
            ],
            isExported: true,
            name: contractDryRunClassId,
        });

        classDecl
            .addConstructor({
                docs: ['Contruct a client for a contract instance on chain'],
                parameters: [
                    {
                        name: grpcClientId,
                        type: 'SDK.ConcordiumGRPCClient',
                        scope: tsm.Scope.Public,
                    },
                    {
                        name: contractAddressId,
                        type: 'SDK.ContractAddress',
                        isReadonly: true,
                        scope: tsm.Scope.Public,
                    },
                ],
            })
            .setBodyText(
                `this.${genericContractId} = new SDK.Contract(${grpcClientId}, ${contractAddressId}, '${contract.contractName}');
this.${dryRunId} = new ${contractDryRunClassId}(this.${genericContractId});`
            );

        dryRunClassDecl.addConstructor({
            docs: ['Contruct a client for a contract instance on chain'],
            parameters: [
                {
                    name: genericContractId,
                    type: 'SDK.Contract',
                    scope: tsm.Scope.Private,
                },
            ],
        });

        for (const entrypointName of contract.entrypointNames) {
            const receiveName = `${contract.contractName}.${entrypointName}`;
            const transactionMetadataId = 'transactionMetadata';
            const parameterId = 'parameter';
            const signerId = 'signer';
            classDecl
                .addMethod({
                    docs: [
                        `Send a message to the '${entrypointName}' entrypoint of the '${contract.contractName}' contract.`,
                    ],
                    scope: tsm.Scope.Public,
                    name: toCamelCase(entrypointName),
                    parameters: [
                        {
                            name: transactionMetadataId,
                            type: 'SDK.ContractTransactionMetadata',
                        },
                        {
                            name: parameterId,
                            type: 'SDK.HexString',
                        },
                        {
                            name: signerId,
                            type: 'SDK.AccountSigner',
                        },
                    ],
                    returnType: 'Promise<SDK.HexString>',
                })
                .setBodyText(
                    `return this.${genericContractId}.createAndSendUpdateTransaction(
    '${receiveName}',
    SDK.encodeHexString,
    ${transactionMetadataId},
    ${parameterId},
    ${signerId}
);`
                );
            const blockHashId = 'blockHash';
            dryRunClassDecl
                .addMethod({
                    docs: [
                        `Dry run a message to the '${entrypointName}' entrypoint of the '${contract.contractName}' contract`,
                    ],
                    scope: tsm.Scope.Public,
                    name: toCamelCase(entrypointName),
                    parameters: [
                        {
                            name: parameterId,
                            type: 'SDK.HexString',
                        },
                        {
                            name: blockHashId,
                            type: 'SDK.HexString',
                            hasQuestionToken: true,
                        },
                    ],
                    returnType: 'Promise<SDK.HexString>',
                })
                .setBodyText(
                    `return this.${genericContractId}.invokeView(
    '${receiveName}',
    SDK.encodeHexString,
    (hex: SDK.HexString) => hex,
    ${parameterId},
    ${blockHashId}
);`
                );
        }
    }
}

/** Make the first character in a string uppercase */
function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.substring(1);
}

/** Convert a string in snake_case or kebab-case into camelCase. */
function toCamelCase(str: string): string {
    return str
        .split(/[-_]/g)
        .map((word, index) => (index === 0 ? word : capitalize(word)))
        .join('');
}

/** Convert a string in snake_case or kebab-case into PascalCase. */
function toPascalCase(str: string): string {
    return str.split(/[-_]/g).map(capitalize).join('');
}
