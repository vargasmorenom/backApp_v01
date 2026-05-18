class SSEManager {
    constructor() {
        this._byUser = new Map(); // userId -> Set<res>
        this._all   = new Set(); // todos los clientes (para broadcast)
    }

    add(userId, res) {
        this._all.add(res);
        if (userId) {
            if (!this._byUser.has(userId)) this._byUser.set(userId, new Set());
            this._byUser.get(userId).add(res);
        }
    }

    remove(userId, res) {
        this._all.delete(res);
        if (userId && this._byUser.has(userId)) {
            this._byUser.get(userId).delete(res);
            if (this._byUser.get(userId).size === 0) this._byUser.delete(userId);
        }
    }

    _write(res, event, data) {
        try {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch (_) {}
    }

    // Envía a todos los clientes de un usuario específico
    send(userId, event, data) {
        const clients = this._byUser.get(String(userId));
        if (!clients) return;
        clients.forEach(res => this._write(res, event, data));
    }

    // Envía a todos los clientes conectados
    broadcast(event, data) {
        this._all.forEach(res => this._write(res, event, data));
    }
}

module.exports = new SSEManager();
