const { toNano } = require('@ton/core');
const { TamkMemory } = require('../contracts/output/TamkMemory_TamkMemory.ts'); // note .js
const { NetworkProvider } = require('@ton/blueprint');

/**
 * @param {import('@ton/blueprint').NetworkProvider} provider
 */
async function run(provider) {
    const code = TamkMemory.code;
    const owner = provider.sender().address;
    if (!owner) throw new Error('Sender address not available');

    const tamkMemory = provider.open(
        TamkMemory.createFromConfig({ owner }, code)
    );

    await tamkMemory.sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(tamkMemory.address);

    console.log('✅ Contract deployed at:', tamkMemory.address.toString());
    console.log('🔍 Testnet explorer: https://testnet.tonscan.org/address/' + tamkMemory.address.toString());
}

module.exports = { run };