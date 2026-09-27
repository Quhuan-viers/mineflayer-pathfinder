const BinaryHeap = require('../heap')
const { Cell } = require('../types')
const placeable = require('../data/placeable.json')
function inject(bot) {
    const pathfinder = bot.pathfinder
    const options = pathfinder.options
    const astar = {}

    astar.reset = () => {
        astar.path = []
        astar.goal = null
        astar.openHeap = new BinaryHeap('heapIndex', 'f')
        astar.openMap = new Map()
        astar.closedSet = new Set()
        astar.listHeap = new BinaryHeap('listIndex', 'h')
        astar.listMap = new Map()
        astar.expandedCount = 0
    }

    astar.setGoal = (goal) => {
        astar.goal = goal
    }

    astar.setBegin = (position) => {
        const begin = new Cell(position)
        begin.h = astar.goal.heuristic(begin)
        begin.f = begin.g + begin.h
        options.definedPlace(begin)
        options.definedDig(begin)
        astar.openHeap.push(begin)
        astar.openMap.set(begin.hash(), begin)
    }

    astar.findPath = () => {
        if (astar.openHeap.isEmpty() && astar.listMap.size === 0) {
            astar.path = []
            bot.emit('path_found')
            return
        }

        let current
        if (astar.listMap.size === 0) {
            current = astar.openHeap.pop()
        } else {
            current = astar.listHeap.pop()
            astar.listMap.delete(current.hash())
            astar.openHeap.remove(current)
        }
        astar.openMap.delete(current.hash())
        if (astar.closedSet.has(current.hash())) {
            setImmediate(() => astar.findPath())
            return
        }

        if (astar.goal.isEnd(current)) {
            astar.path = []
            let n = current
            while (n.parent) {
                astar.path.push(n)
                n = n.parent
            }
            astar.path.reverse()
            bot.emit('path_found')
            return
        }

        for (const n of astar.nextPath(current)) {
            if (!astar.listMap.has(n.hash()) && !astar.closedSet.has(n.hash())) {
                astar.listHeap.push(n)
                astar.listMap.set(n.hash(), n)
            }
        }
        setImmediate(() => astar.findPath())
    }

    astar.nextPath = (current) => {
        astar.expandedCount++
        astar.closedSet.add(current.hash())

        const neighbors = pathfinder.generator.getNeighbors(current)
        for (const neighbor of neighbors) {
            if (astar.closedSet.has(neighbor.hash())) continue

            const g = current.g + neighbor.move.cost
            const existing = astar.openMap.get(neighbor.hash())

            if (existing) {
                if (neighbor.g < existing.g) {
                    existing.g = neighbor.g
                    existing.h = neighbor.h
                    existing.f = neighbor.f
                    existing.parent = current
                    astar.openHeap.update(existing)
                }
            } else {
                neighbor.parent = current
                neighbor.g = g
                neighbor.h = astar.goal.heuristic(neighbor)
                neighbor.f = neighbor.g + neighbor.h
                astar.openMap.set(neighbor.hash(), neighbor)
                astar.openHeap.push(neighbor)
            }
        }
        return neighbors
    }

    astar.reset()
    pathfinder.astar = astar
}

module.exports = inject