import { ChannelCredentials, Metadata } from '@grpc/grpc-js';
import { GrpcTransport } from '@protobuf-ts/grpc-transport';
import ConcordiumGRPCClient from '@concordium/common-sdk/lib/GRPCClient';

export default function createConcordiumClient(
    address: string,
    port: number,
    credentials: ChannelCredentials,
    metadata: Metadata,
    timeout: number,
    options?: Record<string, unknown>
): ConcordiumGRPCClient {
    const grpcTransport = new GrpcTransport({
        host: `${address}:${port}`,
        channelCredentials: credentials,
        options: options,
    });
    return new ConcordiumGRPCClient(timeout, grpcTransport);
}
