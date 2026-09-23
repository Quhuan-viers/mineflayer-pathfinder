class BinaryHeap {
    constructor() {
        this.heap = [null]   // 1-based，index 0 占位
    }

    size() {
        return this.heap.length - 1
    }

    isEmpty() {
        return this.heap.length === 1
    }

    push(cell) {
        if (cell.heapIndex >= 0) {
            throw new Error(`cell already in heap at index ${cell.heapIndex}`)
        }
        this.heap.push(cell)
        cell.heapIndex = this.heap.length - 1
        this._bubbleUp(cell.heapIndex)
    }

    pop() {
        if (this.isEmpty()) return null

        const smallest = this.heap[1]
        smallest.heapIndex = -1

        const last = this.heap.pop()
        if (this.heap.length > 1) {
            this.heap[1] = last
            last.heapIndex = 1
            this._sinkDown(1)
        }
        return smallest
    }

    remove(cell) {
        const i = cell.heapIndex
        if (i < 0) return
        const last = this.heap.pop()
        if (i < this.heap.length) {
            this.heap[i] = last
            last.heapIndex = i
            this._bubbleUp(i)
            this._sinkDown(i)
        }
        cell.heapIndex = -1
    }

    update(cell) {
        const i = cell.heapIndex
        if (i < 0) return   // 不在堆里，忽略
        this._bubbleUp(i)
        this._sinkDown(i)
    }

    _bubbleUp(i) {
        while (i > 1) {
            const parent = i >>> 1
            if (this.heap[parent].f <= this.heap[i].f) break
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

            if (left <= n && this.heap[left].f < this.heap[smallest].f) smallest = left
            if (right <= n && this.heap[right].f < this.heap[smallest].f) smallest = right
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
        a.heapIndex = j
        b.heapIndex = i
    }
}

module.exports = BinaryHeap