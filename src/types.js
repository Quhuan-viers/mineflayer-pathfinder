// src/types.js
const Vec3 = require('vec3').Vec3

class Cell {
    constructor(position = new Vec3(0, 0, 0), g = 0, h = 0, parent = null) {
        this.position = position.floored()
        this.g = g
        this.h = h
        this.f = this.g + this.h
        this.parent = parent

        // 优化堆
        this.heapIndex = -1
        this.closed = false

        this.digPath = []
        this.placePath = []
    }

    hash() {
        return `${this.position}`
    }

    clone() {
        return new Cell(this.position, this.g, this.h, this.parent)
    }
}

class Move {
    constructor(name, cost, start, end, check) {
        this.name = name
        this.cost = cost
        this.start = start
        this.end = end
        this.check = check
        this.turn = true
        this.done = false
    }

    compute(bot) {
        if (this.done) return;
        if (this.turn) {
            this.start()
            this.turn = false
        }
        if (this.check(bot)) {
            this.end()
            this.done = true
        }
    }
}

module.exports = {
    Cell,
    Move
}