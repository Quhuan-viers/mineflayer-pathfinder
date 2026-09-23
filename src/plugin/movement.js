const { Cell, Move } = require('../types')
const { PlayerState } = require('prismarine-physics')
/**
 * 
 * @param {import('mineflayer').Bot} bot 
 */
function inject(bot) {
    const pathfinder = bot.pathfinder
    const astar = pathfinder.astar
    const movement = {}

    movement.stabilize = () => {
        const stablePath = astar.path.slice()
        for (let index = 0; index < stablePath.length; index++) {
            const cell = stablePath[index]
            switch (cell.move.name) {
                case 'walk': {
                    const final = cell.position.offset(0.5, 0, 0.5)

                    cell.move.check = () => {
                        const offset = bot.entity.position.minus(final)
                        if (Math.abs(offset.x) <= 0.4 && Math.abs(offset.z) <= 0.4) {
                            if (Math.abs(offset.y) <= 0.1) return true;
                            bot.setControlState('forward', false)
                        }
                        bot.look(yawTo(bot.entity.position, final), 0)
                        return false
                    }
                    cell.move.start = () => {
                        bot.setControlState('forward', true)
                    }
                    cell.move.end = () => {
                        bot.setControlState('forward', false)
                    }
                    break
                }
                case 'sprint': {
                    const final = cell.position.offset(0.5, 0, 0.5)

                    cell.move.check = () => {
                        const offset = bot.entity.position.minus(final)
                        if (Math.abs(offset.x) <= 0.45 && Math.abs(offset.z) <= 0.45) {
                            if (Math.abs(offset.y) <= 0.1) return true;
                            bot.setControlState('forward', false)
                            bot.setControlState('sprint', false)
                        }
                        bot.look(yawTo(bot.entity.position, final), 0)
                        return false
                    }
                    cell.move.start = () => {
                        bot.setControlState('forward', true)
                        bot.setControlState('sprint', true)
                    }
                    cell.move.end = () => {
                        bot.setControlState('forward', false)
                        bot.setControlState('sprint', false)
                    }
                    break
                }
                case 'sneak': {
                    const final = cell.position.offset(0.5, 0, 0.5)
                    cell.move.check = () => {
                        const offset = bot.entity.position.minus(final)
                        if (Math.abs(offset.x) <= 0.25 && Math.abs(offset.z) <= 0.25) {
                            if (Math.abs(offset.y) <= 0.1) return true;
                            bot.setControlState('forward', false)
                            bot.setControlState('sneak', false)
                        }
                        bot.look(yawTo(bot.entity.position, final), 0)
                        return false
                    }
                    cell.move.start = () => {
                        bot.setControlState('forward', true)
                        bot.setControlState('sneak', true)
                    }
                    cell.move.end = () => {
                        bot.setControlState('forward', false)
                        bot.setControlState('sneak', false)
                    }
                    break
                }
                case 'forwardUp': {
                    const final = cell.position.offset(0.5, 0, 0.5)

                    const check = (bot) => {
                        const offset = bot.entity.position.minus(final)
                        if (Math.abs(offset.x) <= 0.4 && Math.abs(offset.z) <= 0.4) {
                            if (offset.y >= -0.2 && offset.y <= 0.2) return true;
                            bot.setControlState('forward', false)
                        }
                        return false
                    }

                    cell.move.check = (bot) => {
                        if (check(bot)) return true;
                        bot.look(yawTo(bot.entity.position, final), 0)
                        const control = {
                            forward: true,
                            back: false,
                            left: false,
                            right: false,
                            jump: true,
                            sprint: false,
                            sneak: false
                        }
                        if (simulateUntil(check, control, 20)) bot.setControlState('jump', true);
                        return false
                    }
                    cell.move.start = () => {
                        bot.setControlState('forward', true)
                    }
                    cell.move.end = () => {
                        bot.setControlState('forward', false)
                        bot.setControlState('jump', false)
                    }
                    break
                }
                case 'up': {
                    const final = cell.position.offset(0.5, 0, 0.5)

                    const check = (bot) => {
                        const offset = bot.entity.position.minus(final)
                        return Math.abs(offset.y) <= 0.1
                    }

                    cell.move.check = (bot) => {
                        if (check(bot)) return true;
                        const control = {
                            forward: false,
                            back: false,
                            left: false,
                            right: false,
                            jump: true,
                            sprint: false,
                            sneak: false
                        }
                        if (simulateUntil(check, control, 20)) bot.setControlState('jump', true);
                        return false
                    }
                    cell.move.start = () => {
                    }
                    cell.move.end = () => {
                        bot.setControlState('jump', false)
                    }
                    break
                }
                case 'walkJump': {
                    const final = cell.position.offset(0.5, 0, 0.5)
                    const check = (bot) => {
                        const offset = bot.entity.position.minus(final)
                        if (Math.abs(offset.x) <= 0.3 && Math.abs(offset.z) <= 0.3) {
                            if (Math.abs(offset.y) <= 0.1) return true;
                            bot.setControlState('forward', false)
                        }
                        return false
                    }
                    cell.move.check = (bot) => {
                        if (check(bot)) return true;
                        bot.look(yawTo(bot.entity.position, final), 0)
                        const control = {
                            forward: true,
                            back: false,
                            left: false,
                            right: false,
                            jump: true,
                            sprint: false,
                            sneak: false
                        }
                        if (simulateUntil(check, control, 20)) bot.setControlState('jump', true);
                    }
                    cell.move.start = () => {
                        bot.setControlState('forward', true)
                    }
                    cell.move.end = () => {
                        bot.setControlState('forward', false)
                        bot.setControlState('jump', false)
                    }
                    break
                }
                case 'sprintJump': {
                    const final = cell.position.offset(0.5, 0, 0.5)
                    const check = (bot) => {
                        const offset = bot.entity.position.minus(final)
                        if (Math.abs(offset.x) <= 0.4 && Math.abs(offset.z) <= 0.4) {
                            if (Math.abs(offset.y) <= 0.1) return true;
                            bot.setControlState('forward', false)
                            bot.setControlState('sprint', false)
                        }
                        return false
                    }
                    cell.move.check = (bot) => {
                        if (check(bot)) return true;
                        bot.look(yawTo(bot.entity.position, final), 0)
                        const control = {
                            forward: true,
                            back: false,
                            left: false,
                            right: false,
                            jump: true,
                            sprint: true,
                            sneak: false
                        }
                        if (simulateUntil(check, control, 20)) bot.setControlState('jump', true);
                    }
                    cell.move.start = () => {
                        bot.setControlState('forward', true)
                        bot.setControlState('sprint', true)
                    }
                    cell.move.end = () => {
                        bot.setControlState('forward', false)
                        bot.setControlState('sprint', false)
                        bot.setControlState('jump', false)
                    }
                    break
                }
            }
            if (cell.move.name === 'walkJump' || cell.move.name === 'sprintJump') {
                const final = cell.parent.position.offset(0.5, 0, 0.5)

                const sneak = cell.clone()
                sneak.position.update(cell.position)
                sneak.move = new Move('sneak', 1)
                sneak.move.check = (bot) => {
                    bot.look(yawTo(bot.entity.position, final), bot.entity.pitch)
                    const offset = bot.entity.position.minus(final)
                    const speed = Math.hypot(bot.entity.velocity.x, bot.entity.velocity.y, bot.entity.velocity.z)
                    return Math.abs(offset.x) <= 0.1 && Math.abs(offset.z) <= 0.1 && Math.abs(offset.y) <= 0.1 && speed <= 0.1
                }
                sneak.move.start = () => {
                    bot.setControlState('forward', true)
                    bot.setControlState('sneak', true)
                }
                sneak.move.end = () => {
                    bot.setControlState('forward', false)
                    bot.setControlState('sneak', false)
                }
                stablePath.splice(index, 0, sneak)
                index++
            }
        }
        return stablePath
    }

    function simulateUntil(check, control, maxTicks) {
        const state = new PlayerState(bot, control ?? bot.controlState)

        state.entity = {
            position: state.pos,
            velocity: state.vel
        }

        state.setControlState = (stateName, stateBoolean) => state.control[stateName] = stateBoolean
        state.world = bot.world

        for (let i = 0; i <= maxTicks; i++) {
            if (check(state)) return true;
            bot.physics.simulatePlayer(state, bot.world)
            state.entity.onGround = state.onGround
        }

        return false
    }

    pathfinder.movement = movement
}

function yawTo(from, to) {
    return Math.atan2(-(to.x - from.x), -(to.z - from.z))
}

module.exports = inject