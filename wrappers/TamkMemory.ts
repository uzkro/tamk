import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
} from '@ton/core';

export type TamkMemoryConfig = {
    owner: Address;
};

export function tamkMemoryConfigToCell(config: TamkMemoryConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeDict(null)
        .endCell();
}

export class TamkMemory implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new TamkMemory(address);
    }

    static createFromConfig(config: TamkMemoryConfig, code: Cell, workchain = 0) {
        const data = tamkMemoryConfigToCell(config);
        const init = { code, data };
        return new TamkMemory(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendStore(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            key: bigint;          // 256‑bit integer key
            dataHash: Buffer;     // 32‑byte hash
            version: bigint;      // 64‑bit version
        }
    ) {
        const body = beginCell()
            .storeUint(0, 32)                     // op_store = 0
            .storeUint(opts.key, 256)
            .storeBuffer(opts.dataHash)
            .storeUint(opts.version, 64)
            .endCell();

        await provider.internal(via, {
            value: opts.value,
            body,
        });
    }

    async getRetrieve(
        provider: ContractProvider,
        key: bigint
    ): Promise<{ exists: boolean; hash?: Buffer; version?: bigint }> {
        const result = await provider.get('retrieve', [
            { type: 'int', value: key },
        ]);
        const exists = result.stack.readNumber();
        if (exists === 0) {
            return { exists: false };
        }
        const valueCell = result.stack.readCell();
        const slice = valueCell.beginParse();
        const hash = slice.loadBuffer(32);
        const version = slice.loadUintBig(64);
        return { exists: true, hash, version };
    }

    async getOwner(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('get_owner', []);
        return result.stack.readAddress();
    }
}