import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { TamkMemory } from '../wrappers/TamkMemory';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('TamkMemory', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('TamkMemory');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tamkMemory: SandboxContract<TamkMemory>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        tamkMemory = blockchain.openContract(TamkMemory.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await tamkMemory.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tamkMemory.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and tamkMemory are ready to use
    });
});
