import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { Buffer } from 'buffer/index.js';
import { packBufferWithWord32Length } from '../serializationHelpers.js';
import { HexString } from '../types.js';

/**
 * The number of bytes used to represent a block hash.
 */
const moduleReferenceByteLength = 32;

/**
 * Reference to a smart contract module.
 */
class ModuleReference {
    constructor(
        /** Internal field, the module reference represented as a hex string. */
        public readonly moduleRef: string,
        /** Internal field, buffer containing the 32 bytes for the module reference. */
        public readonly decodedModuleRef: Uint8Array
    ) {}

    toJSON(): string {
        return packBufferWithWord32Length(this.decodedModuleRef).toString(
            'hex'
        );
    }
}

/**
 * Reference to a smart contract module.
 */
export type Type = ModuleReference;

/**
 * Create a ModuleReference from a buffer of 32 bytes.
 * @param {ArrayBuffer} buffer Buffer containing 32 bytes for the hash.
 * @throws If the provided buffer does not contain exactly 32 bytes.
 * @returns {ModuleReference} A module reference.
 */
export function fromBuffer(buffer: ArrayBuffer): ModuleReference {
    const hex = Buffer.from(buffer).toString('hex');
    if (buffer.byteLength !== moduleReferenceByteLength) {
        throw new Error(
            'The provided moduleRef ' +
                hex +
                ' is invalid as module reference as it does not contain 32 bytes'
        );
    }
    return new ModuleReference(hex, new Uint8Array(buffer));
}

/**
 * Create a ModuleReference from a hex string.
 * @param {HexString} hex Hex encoding of the module reference.
 * @throws If the provided hex encoding does not correspond to a buffer of exactly 32 bytes.
 * @returns {ModuleReference} A module reference.
 */
export function fromHexString(moduleRef: HexString) {
    if (moduleRef.length !== moduleReferenceByteLength * 2) {
        throw new Error(
            'The provided moduleRef ' +
                moduleRef +
                ' is invalid as its length was not 64'
        );
    }
    return new ModuleReference(
        moduleRef,
        new Uint8Array(Buffer.from(moduleRef, 'hex'))
    );
}

/**
 * Get the module reference bytes encoded as hex.
 * @param {ModuleReference} moduleReference The module reference.
 * @returns {HexString} String with hex encoding.
 */
export function toHexString(moduleReference: ModuleReference): HexString {
    return moduleReference.moduleRef;
}

/**
 * Convert module reference from its protobuf encoding.
 * @param {Proto.ModuleRef} moduleReference The module reference in protobuf.
 * @returns {ModuleReference} The module reference.
 */
export function fromProto(moduleReference: Proto.ModuleRef): ModuleReference {
    return fromBuffer(moduleReference.value);
}

/**
 * Convert module reference into its protobuf encoding.
 * @param {ModuleReference} moduleReference The module reference.
 * @returns {Proto.ModuleRef} The protobuf encoding.
 */
export function toProto(moduleReference: ModuleReference): Proto.ModuleRef {
    return {
        value: moduleReference.decodedModuleRef,
    };
}

/**
 * Check if two module references are the same.
 * @param {ModuleReference} left
 * @param {ModuleReference} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: ModuleReference, right: ModuleReference): boolean {
    return left.moduleRef === right.moduleRef;
}
