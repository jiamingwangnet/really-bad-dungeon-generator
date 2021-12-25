exports.game = {
    seed: 3535352345235,
    Random: (n = 1, a = 1103515245, b = 12345, m = 0x80000000) => {
        const results = []
        if (typeof exports.game.seed === "string") {
            exports.game.seed = Math.abs(exports.game.seed.hashCode());
        }
        for (let i = 0; i < n; i++) {
            exports.game.seed = (a * exports.game.seed + b) % m

            results.push(exports.game.seed/m);
        }
        return results;
    }
}

String.prototype.hashCode = function () {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};