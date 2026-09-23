# mc-pathfinder

A pathfinding plugin for [mineflayer](https://github.com/PrismarineJS/mineflayer). The bot walks to a target by itself, digs when something is in the way, places blocks to bridge gaps, and does running jumps over holes it can't cross.

Only what's needed for movement is implemented. Nothing fancy like wall climbing or elytra.

## Install

```bash
npm install mc-pathfinder
```

## Usage

```js
const { pathfinder, goals } = require('mc-pathfinder')
const { GoalBlock } = goals

bot.loadPlugin(pathfinder)

bot.on('chat', (username, message) => {
    if (message === 'move') {
        const target = bot.players[username].entity.position
        bot.pathfinder.goto(new GoalBlock(target))
    }
})
```

## Goals

| Goal | Behaviour |
| --- | --- |
| `GoalBlock` | Get to a block |
| `GoalDigBlock` | Get in range to dig a block |
| `GoalPlaceBlock` | Get in range to place a block on a position (bridges over if needed) |
| `GoalLookAtBlock` | Get in range to look at a block |

## What the bot can do

- Walk / run / sneak (sneaking when bridging)
- Running jumps over gaps up to ~3-4 blocks
- Go up and down slopes, drop down multiple blocks
- Jump straight up onto blocks when the space above your head is clear
- Handle slabs and other low obstacles as regular steps
- Dig blocks in the way, including digging straight down
- Place blocks to build a bridge when there is no floor
- Currently can't climb walls or swim — not yet.

The default placing material is `cobblestone`. Edit `src/data/placeable.json` to change it.

## Notes

No fallback / obstacle-recovery logic in this version. Make sure the bot has a pickaxe and some blocks in its inventory before pathfinding, or it will get stuck.

Was made by adapting the general idea of [mineflayer-pathfinder](https://github.com/PrismarineJS/mineflayer-pathfinder), but everything here is written from scratch and fairly ad-hoc. Use at your own risk.

[中文版](README.zh-CN.md)