// src/types.js
const Vec3 = require('vec3').Vec3

class Cell {
    constructor(position = new Vec3(0, 0, 0), g = 0, h = 0, parent = null, placeCount = 0, digCount = 0) {
        this.position = position.floored()
        this.g = g
        this.h = h
        this.f = this.g + this.h
        this.parent = parent

        // 优化堆
        this.heapIndex = -1
        this.listIndex = -1
        this.closed = false

        this.placeCount = placeCount
        this.digCount = digCount

        this.digPath = []
        this.placePath = []
    }

    hash() {
        return `${this.position}`
    }

    clone() {
        return new Cell(this.position, this.g, this.h, this.parent, this.placeCount, this.digCount)
    }
}

class Move {
    constructor(name, cost) {
        this.name = name
        this.cost = cost
        this.topY = 0
        this.start = null
        this.end = null
        this.check = null
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