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
        astar.openHeap = new BinaryHeap()
        astar.openMap = new Map()
        astar.closedSet = new Set()
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
        if (astar.openHeap.isEmpty()) {
            astar.path = []
            bot.emit('path_found')
            return
        }

        const current = astar.openHeap.pop()
        astar.openMap.delete(current.hash())
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

        astar.nextPath(current)

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
                    // 把 existing 从堆里拿掉
                    astar.openHeap.remove(existing)     // ← 需要 heap 支持 remove
                    astar.openMap.delete(existing.hash())

                    // 用 neighbor 替换
                    neighbor.parent = current
                    neighbor.h = astar.goal.heuristic(neighbor)
                    neighbor.f = neighbor.g + neighbor.h
                    astar.openMap.set(neighbor.hash(), neighbor)
                    astar.openHeap.push(neighbor)
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
    }

    astar.reset()
    pathfinder.astar = astar
}

module.exports = inject