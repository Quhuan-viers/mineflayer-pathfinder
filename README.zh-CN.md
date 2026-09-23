# mc-pathfinder

给 [mineflayer](https://github.com/PrismarineJS/mineflayer) 用的寻路插件。机器人会自己走到目标点,前面有方块就挖掉,没路就自己搭桥,遇到绕不过的坑会助跑跳过。

只做了移动需要的东西,像爬墙、鞘翅这些花活没有。

## 安装

```bash
npm install mc-pathfinder
```

## 使用

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

## 目标类型

| 目标 | 行为 |
| --- | --- |
| `GoalBlock` | 走到某个方块 |
| `GoalDigBlock` | 走到能挖到某个方块的位置 |
| `GoalPlaceBlock` | 走到能把方块放在某个位置的位置(够不着会自己搭路) |
| `GoalLookAtBlock` | 走到能看到某个方块的位置 |

## 机器人会做的事

- 走路/跑步/潜行(搭桥时潜行)
- 跨越最多 3~4 格的助跑跳
- 上下坡、多格下落
- 头顶没挡住时直接原地蹦上去
- 半砖之类的低矮障碍按台阶处理
- 挖掉挡路的方块,包括直接往下挖
- 没有路时自己放方块搭桥
- 目前不会爬墙、不会游泳——以后再说。

默认搭路用的是 `cobblestone`,想改就编辑 `src/data/placeable.json`。

## 注意

这个版本没有遇到障碍自动换路的逻辑。寻路前保证机器人身上有稿子和方块,不然它会卡住。

整体思路参考了 [mineflayer-pathfinder](https://github.com/PrismarineJS/mineflayer-pathfinder),但这边的代码全是自己写的,比较随性,用起来自担风险。

[English](README.md)