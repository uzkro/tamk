import { useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { beginCell, toNano, Address } from '@ton/core';
import { sha256 } from '@ton/crypto';
import LZString from 'lz-string';
import toast from 'react-hot-toast';
import { TonClient } from '@ton/ton';

// Temporary zero address for testing – replace with your deployed contract address!
const CONTRACT_ADDRESS = Address.parse('0:0000000000000000000000000000000000000000000000000000000000000000');
const CLIENT = new TonClient({ endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC' });

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [key, setKey] = useState('');
  const [data, setData] = useState('');
  const [version, setVersion] = useState(1);
  const [memories, setMemories] = useState<{ key: string; hash: string; version: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const storeMemory = async () => {
    if (!tonConnectUI.connected) return toast.error('Connect wallet first!');
    if (!key.trim()) return toast.error('Key cannot be empty');
    if (!data.trim()) return toast.error('Data cannot be empty');

    setLoading(true);
    try {
      const compressed = LZString.compressToUint8Array(data);
      const dataHash = await sha256(Buffer.from(compressed));

      const body = beginCell()
        .storeUint(0, 32) // op = store
        .storeBuffer(Buffer.from(key))
        .storeBuffer(dataHash)
        .storeUint(version, 64)
        .endCell();

      await tonConnectUI.sendTransaction({
        messages: [
          {
            address: CONTRACT_ADDRESS.toString(),
            amount: toNano('0.01').toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
        validUntil: Date.now() + 5 * 60 * 1000,
      });

      toast.success('Memory stored on-chain!');
      console.log('Compressed data (store off-chain):', compressed);
    } catch (e) {
      toast.error('Failed to store: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const retrieveMemory = async () => {
    if (!key.trim()) return toast.error('Enter a key to retrieve');

    setLoading(true);
    try {
      const keyCell = beginCell().storeBuffer(Buffer.from(key)).endCell();
      const stack = [{ type: 'slice' as const, cell: keyCell }];

      const result = await CLIENT.runMethod(CONTRACT_ADDRESS, 'retrieve', stack);
      const hasValue = result.stack.readNumber();

      if (hasValue === 1) {
        const valueCell = result.stack.readCell();
        const slice = valueCell.beginParse();

        const hashBuffer = slice.loadBuffer(32);
        const hashHex = hashBuffer.toString('hex');
        const ver = slice.loadUint(64);

        setMemories((prev) => [...prev, { key, hash: hashHex, version: ver }]);
        toast.success('Memory retrieved!');
      } else {
        toast.error('No memory found for this key');
      }
    } catch (e) {
      toast.error('Failed to retrieve: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Agent image – place your transparent PNG in public/agent-icon.png */}
      <img src="/agent-icon.png" alt="AI Agent" className="agent-image" />

      <header className="header">
        <h1>TAMK: TON Agent Memory Kit</h1>
        <button onClick={() => tonConnectUI.openModal()} disabled={tonConnectUI.connected}>
          {tonConnectUI.connected ? 'Connected' : 'Connect Wallet'}
        </button>
      </header>

      <main className="main">
        <div className="form">
          <div className="form-group">
            <label>
              Key
              <span className="tooltip-icon" data-tooltip="Unique identifier for your memory. Use any string (e.g., 'user_123', 'doc_v2').">?</span>
            </label>
            <input
              placeholder="e.g., conversation_001"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              Data
              <span className="tooltip-icon" data-tooltip="The information to store. Can be JSON, text, or any string. It will be compressed before hashing.">?</span>
            </label>
            <textarea
              placeholder="Paste your JSON or text here..."
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              Version
              <span className="tooltip-icon" data-tooltip="Version number for this memory. Increment when updating an existing key.">?</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={version}
              onChange={(e) => setVersion(+e.target.value)}
            />
          </div>

          <div className="button-group">
            <button onClick={storeMemory} disabled={loading}>
              Store Memory
            </button>
            <button onClick={retrieveMemory} disabled={loading}>
              Retrieve Memory
            </button>
          </div>
        </div>

        <div className="history">
          <h2>Memory History</h2>
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Hash (first 10 chars)</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {memories.map((m, i) => (
                <tr key={i}>
                  <td>{m.key}</td>
                  <td>{m.hash.slice(0, 10)}…</td>
                  <td>{m.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;