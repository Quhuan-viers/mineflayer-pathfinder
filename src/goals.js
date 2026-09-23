const Vec3 = require('vec3').Vec3

class Goal {
    constructor(position = new Vec3(0, 0, 0)) {
        this.position = position
    }

    heuristic(cell) {
        // const offset = this.position.minus(cell.position)
        // return (Math.abs(offset.x) + Math.abs(offset.z)) * Math.SQRT2 + Math.abs(offset.y)
        const dx = this.position.x - cell.position.x
        const dy = this.position.y - cell.position.y
        const dz = this.position.z - cell.position.z
        return distanceXZ(dx, dz) + Math.abs(dy)
    }
}

function distanceXZ(dx, dz) {
    dx = Math.abs(dx)
    dz = Math.abs(dz)
    return Math.abs(dx - dz) + Math.min(dx, dz) * Math.SQRT2
}

class GoalBlock extends Goal {
    constructor(position) {
        super(position.floored())
    }

    isEnd(cell) {
        return this.position.equals(cell.position)
    }
}
class GoalDigBlock extends GoalBlock {
    constructor(position, bot) {
        super(position)
        this.bot = bot
    }

    isEnd(cell) {
        const eyePos = cell.position.offset(0.5, eyeHeight, 0.5)
        const delta = this.position.offset(0.5, 0.5, 0.5).minus(eyePos)
        const dist = delta.norm()
        if (dist > 4.5) return false
        const hit = this.bot.world.raycast(eyePos, delta.scale(1 / dist), dist)
        if (!hit) return false;
        if (hit.position.equals(cell.position)) return true;
        return false
    }
}
const FACE_DIRS = [
    new Vec3(0, -1, 0),  // 底面
    new Vec3(0, 1, 0),   // 顶面
    new Vec3(0, 0, -1),  // 北
    new Vec3(0, 0, 1),   // 南
    new Vec3(-1, 0, 0),  // 西
    new Vec3(1, 0, 0),   // 东
]
class GoalLookAtBlock extends GoalBlock {
    constructor(position, bot, options = {}) {
        super(position)
        this.bot = bot
        this.reach = options.reach ?? 4.5
    }

    isEnd(cell) {
        // 1. 眼睛位置 = 站位方块中心 + 眼睛高度
        const eyeHeight = this.bot.entity.eyeHeight
        const eyePos = new Vec3(
            cell.position.x + 0.5,
            cell.position.y + eyeHeight,
            cell.position.z + 0.5
        )

        // 2. 枚举六个面
        for (const dir of FACE_DIRS) {
            const faceCenter = this.position.offset(
                0.5 + dir.x * 0.5,
                0.5 + dir.y * 0.5,
                0.5 + dir.z * 0.5
            )

            const delta = faceCenter.minus(eyePos)
            const dist = delta.norm()
            if (dist > this.reach) continue
            if (dist < 0.001) continue   // 眼睛正好在面上，跳过

            // 3. raycast
            const rayDir = delta.scale(1 / dist)
            const hit = this.bot.world.raycast(eyePos, rayDir, this.reach)
            if (!hit) continue

            if (hit.position.x === this.position.x &&
                hit.position.y === this.position.y &&
                hit.position.z === this.position.z) {
                return true
            }
        }
        return false
    }
}

class GoalPlaceBlock extends GoalBlock {
    constructor(position, bot) {
        super(position)
        this.bot = bot
    }

    isEnd(cell) {
        const placement = this.bot.pathfinder.options.canPlaceFrom(cell.position.offset(0.5, 0, 0.5), this.position)
        if (placement) {
            return true
        }
        return false
    }
}

module.exports = {
    GoalBlock,
    GoalDigBlock,
    GoalPlaceBlock,
    GoalLookAtBlock
}