const Vec3 = require('vec3').Vec3
const { Cell, Move } = require('../types')
/**
 * 
 * @param {import('mineflayer').Bot} bot 
 */
function inject(bot) {
    const pathfinder = bot.pathfinder
    const astar = pathfinder.astar
    const options = pathfinder.options
    const generator = {}

    generator.getNeighbors = (cell) => {
        const neighbors = new Map()

        function insert(did) {
            if (!did) return false;
            const existing = neighbors.get(did.hash())
            if (!existing || did.move.cost < existing.move.cost) {
                neighbors.set(did.hash(), did)
            }
            return true
        }

        for (const dir of forwardDir) {
            const isDiagonal = dir.x !== 0 && dir.z !== 0
            const canEnterDiagonal = isDiagonal ? _canEnter(cell.position.offset(dir.x, 0, 0)) && _canEnter(cell.position.offset(0, 0, dir.z)) : false
            for (const gen of didDirs) {
                const did = gen(cell, dir, isDiagonal, canEnterDiagonal)
                if (!insert(did)) continue;
            }
        }

        for (const gen of dids) {
            const did = gen(cell)
            if (!insert(did)) continue;
        }

        return Array.from(neighbors.values()).map((e) => e)
    }

    const forward = (cell, dir, isDiagonal, canEnterDiagonal) => {
        const begin = cell.position.clone()

        if (isDiagonal && !canEnterDiagonal) return;
        const final = begin.offset(dir.x, 0, dir.z)

        const did = cell.clone()
        did.position.update(final)
        did.g += 1
        did.move = new Move('sprint', 1)

        if (options.isBlockAt(final)) {
            if (!options.canDig) return;
            options.computeDig(did)
            did.digPath.push(final.clone())
        }

        if (options.isBlockAt(final.offset(0, 1, 0))) {
            if (!options.canDig) return;
            options.computeDig(did)
            did.digPath.push(final.offset(0, 1, 0))
        }

        if (!options.isBlockAt(final.offset(0, -1, 0))) {
            if (!options.canPlace) return;
            if (isDiagonal) return;
            did.move = new Move('sneak', 1)
            options.computePlace(did)
            did.placePath.push(final.offset(0, -1, 0))
        }

        return did
    }

    const forwardFall = (cell, dir, isDiagonal, canEnterDiagonal) => {
        if (isDiagonal && !canEnterDiagonal) return;
        const final = cell.position.offset(dir.x, -1, dir.z)

        const did = cell.clone()
        did.position.update(final)
        did.g += 1
        did.move = new Move('walk', 3)

        if (options.isBlockAt(final)) {
            if (!options.canDig) return;
            options.computeDig(did)
            did.digPath.push(final.clone())
        }

        if (options.isBlockAt(final.offset(0, 1, 0))) {
            if (!options.canDig) return;
            options.computeDig(did)
            did.digPath.push(final.offset(0, 1, 0))
        }

        if (!options.isBlockAt(final.offset(0, -1, 0))) {
            if (!options.canPlace) return;
            if (isDiagonal) return;
            if (!options.hasSupport(final.offset(0, -1, 0), new Vec3(0, 1, 0))) return;
            options.computePlace(did)
            did.placePath.push(final.offset(0, -1, 0))
        }

        return did
    }

    const forwardUp = (cell, dir, isDiagonal, canEnterDiagonal) => {
        if (isDiagonal && !canEnterDiagonal) return;
        const final = cell.position.offset(dir.x, 1, dir.z)

        const did = cell.clone()
        did.position.update(final)
        did.g += 2
        did.move = new Move('forwardUp', 3)
        const height = getTopY(final.offset(0, -1, 0))
        if (height > 1) return;
        if (height <= 0.6) {
            did.move = new Move('sprint', 1)
            final.translate(0, height, 0)
        }

        if (options.isBlockAt(final)) {
            if (!options.canDig) return;
            options.computeDig(did)
            did.digPath.push(final.clone())
        }

        if (options.isBlockAt(final.offset(0, 1, 0))) {
            if (!options.canDig) return;
            options.computeDig(did)
            did.digPath.push(final.offset(0, 1, 0))
        }

        if (!options.isBlockAt(final.offset(0, -1, 0))) return;

        return did
    }

    const fall = (cell, dir, isDiagonal, canEnterDiagonal) => {
        const begin = cell.position.clone()
        if (isDiagonal && !canEnterDiagonal) return;
        const dirFall = begin.offset(dir.x, 0, dir.z)
        if (!_canEnter(dirFall)) return;
        const blockFall = _getFall(dirFall.offset(0, -1, 0))
        const final = blockFall ? blockFall.position.offset(0, 1, 0) : dirFall

        if (final.y - begin.y === 0) return;

        if (!_canEnter(final) || !_canStanding(final)) return;

        const cost = begin.y - final.y
        const did = cell.clone()
        did.g += cost
        did.position.update(final)
        did.move = new Move('walk', cost)

        return did
    }

    const up = (cell) => {
        const begin = cell.position.clone()
        if (options.isBlockAt(begin)) return;
        const final = begin.offset(0, 1, 0)

        const did = cell.clone()
        did.g += 1
        did.position.update(final)
        did.move = new Move('up', 1)

        if (options.isBlockAt(final)) {
            if (!options.canDig) return;
            options.computeDig(did)
            did.digPath.push(final.clone())
        }

        options.computePlace(did)
        did.placePath.push(begin.clone())

        return did
    }

    const down = (cell) => {
        const begin = cell.position.clone()
        const final = begin.offset(0, -1, 0)

        const did = cell.clone()
        did.g += 1
        did.position.update(final)
        did.move = new Move('walk', 1)

        if (options.isBlockAt(final)) {
            if (!options.canDig) return;
            options.computeDig(did)
            did.digPath.push(final.clone())
        }

        if (!options.isBlockAt(final.offset(0, -1, 0))) {
            if (!options.canPlace) return;
            if (!options.hasSupport(final.offset(0, -1, 0), new Vec3(0, 1, 0))) return;
            options.computePlace(did)
            did.placePath.push(final.offset(0, -1, 0))
        }

        return did
    }

    const jump = (cell, dir, isDiagonal, canEnterDiagonal) => {
        const begin = cell.position.clone()
        if (isDiagonal && !canEnterDiagonal) return;
        const step = _getJump(begin, dir)
        if (step === 0) return;
        if (isDiagonal && step === 4) return;
        const final = begin.offset(dir.x * step, 0, dir.z * step)

        if (!_canEnter(final) || !_canStanding(final)) return;

        const jump = cell.clone()
        jump.position.update(final)
        jump.g += step
        jump.move = new Move('walkJump', 2)
        if (step > 2) jump.move.name = 'sprintJump';
        return jump
    }

    const didDirs = [forward, forwardFall, forwardUp, fall, jump]
    const dids = [up]

    function _canEnter(position) {
        const body = bot.blockAt(position)
        if (!body || body.boundingBox !== 'empty') return false;
        const head = bot.blockAt(position.offset(0, 1, 0))
        if (!head || head.boundingBox !== 'empty') return false;
        return true
    }

    function _canStanding(position) {
        const below = bot.blockAt(position.offset(0, -1, 0))
        if (!below || below.boundingBox !== 'block') return false;
        return true
    }

    function _getFall(position) {
        const current = position.clone()
        for (let i = 0; i < 4; i++) {
            const block = bot.blockAt(current)
            if (block && block.boundingBox !== 'empty') {
                return block
            }
            current.translate(0, -1, 0)
        }
        return null
    }

    function _getJump(position, dir) {
        const current = position.offset(dir.x, 0, dir.z)
        for (let i = 1; i <= 4; i++) {
            if (!_canEnter(current)) return 0;
            const headUp = bot.blockAt(current.offset(0, 2, 0))
            if (!headUp || headUp.boundingBox !== 'empty') return 0;
            if (_canStanding(current)) return i;
            current.translate(dir.x, 0, dir.z)
        }
        return 0
    }

    function getTopY(pos) {
        const block = bot.blockAt(pos)
        if (!block || block.shapes.length === 0) return pos.y

        let maxY = 0
        for (const shape of block.shapes) {
            if (shape[4] > maxY) maxY = shape[4]   // shape[4] = maxY
        }
        return pos.y + maxY
    }

    pathfinder.generator = generator
}

const forwardDir = [
    new Vec3(0, 0, -1),  // 北
    new Vec3(-1, 0, -1), // 西北
    new Vec3(1, 0, -1),  // 东北
    new Vec3(0, 0, 1),   // 南
    new Vec3(-1, 0, 1),  // 西南
    new Vec3(1, 0, 1),   // 东南
    new Vec3(-1, 0, 0),  // 西
    new Vec3(1, 0, 0),   // 东
]

module.exports = inject