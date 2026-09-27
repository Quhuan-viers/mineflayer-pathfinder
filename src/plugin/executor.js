const Vec3 = require('vec3').Vec3
/**
 * 
 * @param {import('mineflayer').Bot} bot 
 */
function inject(bot) {
    const pathfinder = bot.pathfinder
    const options = pathfinder.options
    const executor = {}

    executor.reset = () => {
        executor.path = []
        executor.digging = false
        executor.done = true
    }

    executor.setPath = (path) => {
        executor.path = path
        executor.done = true
    }

    executor.getCell = () => {
        if (executor.path[0].move.done) {
            executor.path.shift()
            executor.digging = false
        }
        return executor.path[0]
    }

    executor.tickMove = () => {
        if (executor.path.length === 0) {
            executor.reset()
            return
        }
        const cell = executor.getCell()
        if (cell) {
            dig(cell)
            if (!executor.digging) {
                place(cell)
                cell.move.compute(bot)
            }
        }
    }

    function dig(cell) {
        if (cell.digPath.length === 0) return;
        if (executor.digging) return;
        const digPos = cell.digPath[0]
        const block = bot.blockAt(digPos)
        if (block.boundingBox === 'empty') {
            cell.digPath.shift()
            return
        }
        if (!bot.canDigBlock(block)) return;
        const toolType = options.digmentItem()?.type
        if (toolType) bot.equip(toolType, 'hand');
        executor.digging = true
        bot.dig(block)
            .catch(() => { })
            .finally(() => {
                executor.digging = false
                cell.digPath.shift()
            })
    }

    function place(cell) {
        if (cell.placePath.length === 0) return;
        const placePos = cell.placePath[0]
        const itemId = options.placementItem()?.id
        if (!itemId) return;
        const shapes = bot.registry.blocksByName[bot.registry.items[itemId].name].shapes
        if (options.isBlockAt(placePos) || options.willBlock(bot.entity.position, placePos, shapes)) return;
        const toPlace = options.place(placePos, itemId)
        if (toPlace) {
            toPlace.finally(() => {
                cell.placePath.shift()
            })
        }
    }

    executor.reset()

    executor.tickRun = () => executor.tickMove()
    bot.on('physicsTick', executor.tickRun)

    bot.once('end', () => bot.removeListener('physicsTick', executor.tickRun))

    pathfinder.executor = executor
}

module.exports = inject