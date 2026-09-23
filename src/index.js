const plugins = {
    options: require('./plugin/options'),
    astar: require('./plugin/astar'),
    generator: require('./plugin/generator'),
    movement: require('./plugin/movement'),
    executor: require('./plugin/executor')
}

/**
 * 
 * @param {import('mineflayer').Bot} bot 
 */
function inject(bot) {
    bot.pathfinder = {}
    const internalPlugins = Object.keys(plugins).map(key => plugins[key])
    bot.loadPlugins(internalPlugins)

    const pathfinder = bot.pathfinder
    const options = pathfinder.options
    const astar = pathfinder.astar
    const executor = pathfinder.executor
    const movement = pathfinder.movement

    pathfinder.goto = (goal) => {
        astar.reset()
        astar.setGoal(goal)
        astar.setBegin(bot.entity.position)
        astar.findPath()
        bot.once('path_found', () => {
            executor.path = movement.stabilize()
        })
    }
}

module.exports = {
    pathfinder: inject,
    goals: require('./goals')
}