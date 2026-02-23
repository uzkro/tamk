import {
    Address,
    beginCell,
    Cell,
    Contract,
    ContractABI,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode
} from '@ton/core';

export type TamkMemoryConfig = {};

export function tamkMemoryConfigToCell(config: TamkMemoryConfig): Cell {
    return beginCell().endCell();
}

export class TamkMemory implements Contract {
    abi: ContractABI = { name: 'TamkMemory' }

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

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
}
