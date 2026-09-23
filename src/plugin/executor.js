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
        executor.done = false
    }

    executor.getCell = () => {
        if (executor.done) {
            executor.path.shift()
            executor.digging = false
            executor.done = false
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
            cell.move.compute(bot)
            if (!executor.digging) {
                if (cell.digPath.length !== 0) {
                    const digPos = cell.digPath[0]
                    if (options.isBlockAt(digPos)) {
                        dig(digPos)
                            .catch(() => { })
                            .finally(() => {
                                executor.digging = false
                                cell.digPath.shift()
                            })
                    }
                }
                if (cell.placePath.length !== 0 && cell.move.done) {
                    const placePos = cell.placePath[0]
                    if (!options.isBlockAt(placePos) && !options.willBlockBot(placePos)) {
                        const toPlace = place(placePos)
                        if (toPlace) {
                            toPlace.finally(() => {
                                cell.placePath.shift()
                            })
                        }
                    }
                }
            }
            if (!executor.digging) {
                if (cell.move.done) executor.done = true;
            }
        }
    }

    function dig(pos) {
        if (executor.digging) return;
        const block = bot.blockAt(pos)
        if (!bot.canDigBlock(block)) return;
        const tool = options.digmentItem()
        if (!tool) return;
        bot.equip(tool.type, 'hand')
        executor.digging = true
        return bot.dig(block)
    }

    function place(pos) {
        return options.place(pos, options.placementItem().id)
    }

    executor.reset()

    executor.tickRun = () => executor.tickMove()
    bot.on('physicsTick', executor.tickRun)

    bot.once('end', () => bot.removeListener('physicsTick', executor.tickRun))

    pathfinder.executor = executor
}

module.exports = inject