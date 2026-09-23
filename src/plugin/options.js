const Vec3 = require('vec3').Vec3
const placeableList = require('../data/placeable.json')
/**
 * 
 * @param {import('mineflayer').Bot} bot 
 */
function inject(bot) {
    const pathfinder = bot.pathfinder

    const options = {}

    options.placeCost = 3
    options.digCost = 3

    options.canPlace = true
    options.canDig = true

    options.placeCount = []
    options.digCount = []

    options.computePlace = (cell) => {
        for (let index = 0; index < options.placeCount.length; index++) {
            if (options.placeCount[index] === 0) continue;
            options.placeCount[index]--
            cell.move.cost += options.placeCost
            break
        }
    }

    options.computeDig = (cell) => {
        const needTools = bot.blockAt(cell.position).harvestTools
        if (needTools) {
            for (const toolType in needTools) {
                if (bot.inventory.count(toolType) === 0) continue;
                const tier = options.getItemTier(bot.registry.items[toolType])
                if (!tier) continue;
                options.digCount[tier] -= 1
                break
            }
        }
        cell.move.cost += options.digCost
    }

    options.definedPlace = (cell) => {
        if (options.canPlace) {
            for (const name of placeableList) {
                options.placeCount.push(bot.inventory.count(bot.registry.itemsByName[name].id))
            }
        }
    }

    options.definedDig = (cell) => {
        if (options.canDig) {
            bot.inventory.items().forEach((item) => {
                const tier = options.getItemTier(item)
                if (tier) {
                    options.digCount[tier] = (options.digCount[tier] ?? 0) + item.maxDurability - (item.durabilityUsed ?? 0)
                }
            })
        }
    }

    const TIER_PREFIX = {
        wooden_: 0, golden_: 0,
        stone_: 1, iron_: 2, diamond_: 3,
    };

    options.getItemTier = (item) => {
        if (!item?.name) return null;
        for (const [p, t] of Object.entries(TIER_PREFIX)) {
            if (item.name.startsWith(p)) return t;
        }
        return null;
    }

    options.isBlockAt = (pos) => {
        const block = bot.blockAt(pos)
        if (!block || block.boundingBox !== 'block') return false;
        return true
    }

    options.placementItem = () => {
        let item = null
        for (const name of placeableList) {
            const candidate = bot.registry.itemsByName[name]
            if (bot.inventory.count(candidate.id) > 0) {
                item = candidate
                break
            }
        }
        return item
    }

    options.digmentItem = () => {
        const items = bot.inventory.items()
        for (let i = 0; i < items.length; i++) {
            if (options.getItemTier(items[i])) return items[i];
        }
        return null
    }

    const FACE_DIRS = [
        new Vec3(0, -1, 0),
        new Vec3(0, 1, 0),
        new Vec3(0, 0, -1),
        new Vec3(0, 0, 1),
        new Vec3(-1, 0, 0),
        new Vec3(1, 0, 0),
    ]

    function vectorToFace(v) {
        if (v.y < 0) return 0
        if (v.y > 0) return 1
        if (v.z < 0) return 2
        if (v.z > 0) return 3
        if (v.x < 0) return 4
        if (v.x > 0) return 5
    }

    options.getSupport = (pos) => {
        pos = pos.floored()

        const refs = []
        for (const dir of FACE_DIRS) {
            const refPos = pos.plus(dir)
            if (!options.isBlockAt(refPos)) continue;

            const face = dir.scaled(-1)
            const center = refPos.offset(0.5, 0.5, 0.5)
            const faceCenter = center.plus(face.scaled(0.5))
            refs.push({ refPos, face, faceCenter })
        }
        return refs
    }

    options.hasSupport = (pos, cantFace) => {
        const blocks = options.getSupport(pos)
        if (cantFace) {
            for (const block of blocks) {
                if (block.face.equals(cantFace)) return false;
            }
        }
        return blocks.length !== 0
    }

    options.canPlaceFrom = (standPos, targetPos, reach = 4.5) => {
        // standPos 允许是真实坐标或方块坐标
        // targetPos 必须是方块坐标
        const targetBlock = targetPos.floored()
        const refs = options.getSupport(targetBlock)
        if (refs.length === 0) return null;

        const eyeHeight = bot.entity.eyeHeight
        const eyePos = standPos.offset(0, eyeHeight, 0)
        const standBlock = standPos.floored()

        for (const ref of refs) {
            if (standBlock.equals(ref.refPos)) continue;

            const delta = ref.faceCenter.minus(eyePos)
            const dist = delta.norm()
            if (dist > reach) continue;
            if (dist < 0.001) continue;

            const rayDir = delta.scale(1 / dist)
            const hit = bot.world.raycast(eyePos, rayDir, dist + 0.5)
            if (!hit) continue;
            if (!hit.position.equals(ref.refPos)) continue;
            if (hit.face !== vectorToFace(ref.face)) continue;

            return { refPos: ref.refPos, face: ref.face, to: hit.intersect }
        }
        return null
    }

    /**
     * 执行放置。不判断，只动作。
     */
    options.place = (pos, item) => {
        if (item) bot.equip(item, 'hand');

        const placement = options.canPlaceFrom(bot.entity.position, pos)

        if (!placement) return null;

        const eyeHeight = bot.entity.eyeHeight
        const eyePos = bot.entity.position.offset(0, eyeHeight, 0)
        const delta = placement.to.minus(eyePos)
        const yaw = Math.atan2(-delta.x, -delta.z)
        const pitch = Math.atan2(delta.y, Math.hypot(delta.x, delta.z))
        bot.look(yaw, pitch, true)

        const refBlock = bot.blockAt(placement.refPos)
        return bot.placeBlock(refBlock, placement.face)
    }

    /**
     * 放方块后，bot 会不会被卡住？
     */
    options.willBlockBot = (pos) => {
        const shapes = bot.blockAt(pos).shapes
        const pBox = playerAABB(bot.entity.position)

        for (const shape of shapes) {
            const bBox = blockAABB(pos, shape)
            if (intersects(pBox, bBox)) return true
        }
        return false
    }

    pathfinder.options = options
}

function playerAABB(pos, width, height) {
    const h = width / 2
    return {
        minX: pos.x - h,
        minY: pos.y,
        minZ: pos.z - h,
        maxX: pos.x + h,
        maxY: pos.y + height,
        maxZ: pos.z + h,
    }
}

function blockAABB(blockPos, shape = [0, 0, 0, 1, 1, 1]) {
    return {
        minX: blockPos.x + shape[0],
        minY: blockPos.y + shape[1],
        minZ: blockPos.z + shape[2],
        maxX: blockPos.x + shape[3],
        maxY: blockPos.y + shape[4],
        maxZ: blockPos.z + shape[5],
    }
}

function intersects(a, b) {
    return a.maxX > b.minX && a.minX < b.maxX
        && a.maxY > b.minY && a.minY < b.maxY
        && a.maxZ > b.minZ && a.minZ < b.maxZ
}

module.exports = inject