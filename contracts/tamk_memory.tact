import "@stdlib/deploy";

message Store {
    key: Int;        // 256-bit integer key
    dataHash: Int;   // 256-bit hash as integer
    version: Int;
}

message MemoryValue {
    hash: Int;
    version: Int;
}

contract TamkMemory with Deployable {
    owner: Address;
    memories: map<Int, MemoryValue>;

    init(owner: Address) {
        self.owner = owner;
        self.memories = emptyMap();
    }

    receive(msg: Store) {
        require(context().sender == self.owner, "Only owner can store");
        self.memories.set(msg.key, MemoryValue{hash: msg.dataHash, version: msg.version});
    }

    get fun retrieve(key: Int): MemoryValue? {
        return self.memories.get(key);
    }

    get fun owner(): Address {
        return self.owner;
    }
}