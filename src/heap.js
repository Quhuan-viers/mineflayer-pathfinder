class BinaryHeap {
    constructor(indexKey, findKey) {
        this.indexKey = indexKey
        this.findKey = findKey
        this.heap = [null]   // 1-based，index 0 占位
    }

    size() {
        return this.heap.length - 1
    }

    isEmpty() {
        return this.heap.length === 1
    }

    push(cell) {
        if (cell[this.indexKey] >= 0) {
            throw new Error(`cell already in heap at index ${cell[this.indexKey]}`)
        }
        this.heap.push(cell)
        cell[this.indexKey] = this.heap.length - 1
        this._bubbleUp(cell[this.indexKey])
    }

    pop() {
        if (this.isEmpty()) return null

        const smallest = this.heap[1]
        smallest[this.indexKey] = -1

        const last = this.heap.pop()
        if (this.heap.length > 1) {
            this.heap[1] = last
            last[this.indexKey] = 1
            this._sinkDown(1)
        }
        return smallest
    }

    remove(cell) {
        const i = cell[this.indexKey]
        if (i < 0) return
        const last = this.heap.pop()
        if (i < this.heap.length) {
            this.heap[i] = last
            last[this.indexKey] = i
            this._bubbleUp(i)
            this._sinkDown(i)
        }
        cell[this.indexKey] = -1
    }

    update(cell) {
        const i = cell[this.indexKey]
        if (i < 0) return   // 不在堆里，忽略
        this._bubbleUp(i)
        this._sinkDown(i)
    }

    _bubbleUp(i) {
        while (i > 1) {
            const parent = i >>> 1
            if (this.heap[parent][this.findKey] <= this.heap[i][this.findKey]) break
            this._swap(i, parent)
            i = parent
        }
    }

    _sinkDown(i) {
        const n = this.heap.length - 1
        while (true) {
            const left = i * 2
            const right = left + 1
            let smallest = i

            if (left <= n && this.heap[left][this.findKey] < this.heap[smallest][this.findKey]) smallest = left
            if (right <= n && this.heap[right][this.findKey] < this.heap[smallest][this.findKey]) smallest = right
            if (smallest === i) break

            this._swap(i, smallest)
            i = smallest
        }
    }

    _swap(i, j) {
        const a = this.heap[i]
        const b = this.heap[j]
        this.heap[i] = b
        this.heap[j] = a
        a[this.indexKey] = j
        b[this.indexKey] = i
    }
}

module.exports = BinaryHeap