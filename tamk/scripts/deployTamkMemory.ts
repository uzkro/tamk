import { toNano } from '@ton/core';
import { TamkMemory } from '../wrappers/TamkMemory';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tamkMemory = provider.open(TamkMemory.createFromConfig({}, await compile('TamkMemory')));

    await tamkMemory.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(tamkMemory.address);

    // run methods on `tamkMemory`
}
