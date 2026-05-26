这些文件是 RecipeExport 模组按合成表的类型自动帮你分类好的，非常贴心。它们每一个都对应游戏里一种不同的“加工”方式。

下面是每个文件代表的含义：

crafting_shaped.json
对应有序合成。就是必须按特定图案把材料摆放在工作台里才能做出的东西，比如镐、斧头。

crafting_shapeless.json
对应无序合成。材料只要种类和数量对，放哪里都行，比如蘑菇煲、发酵蛛眼。

smelting.json
对应熔炉烧炼。把东西放进熔炉，用燃料烧出来的配方。

blasting.json
对应高炉烧炼。和熔炉一样，但速度更快，专门用来烧矿石、金属等。

smoking.json
对应烟熏炉。比熔炉快，专门用来烹饪食物。

campfire_cooking.json
对应营火烹饪。把食物放在营火上烤，不需要燃料，但速度最慢。

stonecutting.json
对应切石机。用来把石类方块精确地切成楼梯、台阶等，比工作台更省材料。

smithing.json
对应锻造台。最早用于把钻石装备升级成下界合金装备，后来也用于给盔甲添加纹饰。

recipes.json
这是一个汇总文件。如果你不想一个个文件打开，可以直接用这个文件，里面包含了以上所有类型的配方，全都整合在了一起。





这个JSON文件描述了Minecraft游戏中**有型合成（crafting_shaped）**的配方数据。下面解释各个键值的含义：

## 顶层键值

| 键 | 类型 | 说明 |
|---|------|------|
| `category` | 字符串 | 固定值 `"crafting_shaped"`，表示文件内所有配方都属于有型合成类别（需要在工作台按特定图案摆放物品）。 |
| `count` | 整数 | 文件中包含的配方总数，此处为 `708`，表示 `recipes` 数组中有 708 个配方。 |
| `recipes` | 数组 | 存放所有具体合成配方的列表，每个元素是一个配方对象。 |

---

## 单个配方对象（`recipes` 数组元素）的键值

| 键 | 类型 | 说明 |
|---|------|------|
| `type` | 字符串 | 配方类型，固定为 `"crafting_shaped"`，与顶层 `category` 含义一致，可能用于程序识别。 |
| `name` | 字符串 | 配方的唯一标识名，通常为 `minecraft:物品ID`，例如 `"minecraft:acacia_boat"`。 |
| `input` | 对象 | 描述合成所需的**原材料**，键为数字字符串 `"1"` 到 `"9"`，表示合成网格的 3×3 格子（编号从左上到右下）。每个值是一个原料描述对象（见下表）。 |
| `output` | 对象 | 描述合成**产物**，通常只有一个键 `"1"`，值是一个产物描述对象（见下表）。 |
| `category` | 字符串 | 再次标记配方类别，固定为 `"crafting_shaped"`，可能用于分类或冗余信息。 |

### `input` 中每个原料对象的键值

| 键 | 类型 | 说明 |
|---|------|------|
| `value` | 字符串或数组 | 允许使用的物品。可以是单个物品 ID（字符串），也可以是多个物品 ID 组成的数组（表示此位置可使用这些物品中的任意一种）。例如 `"minecraft:acacia_planks"` 或 `["minecraft:oak_planks", "minecraft:spruce_planks", ...]`。 |
| `count` | 整数 | 该格子需要的物品数量（通常为 1，个别配方可能使用大于 1 的数量，如某些模组）。 |
| *(特殊)* | 对象 | 少数配方中会出现 `base`、`subtracted`、`neoforge:ingredient_type` 等字段，这表示 **NeoForge** 模组加载器的差异类型（difference type），例如 `"minecraft:copper_chest"` 配方中，格子5需要任意一个箱子（但不包括陷阱箱）。这是模组 API 的高级用法，不属于原版格式。 |

### `output` 中产物对象的键值

| 键 | 类型 | 说明 |
|---|------|------|
| `item` | 字符串 | 产物的物品 ID，例如 `"minecraft:acacia_boat"`。 |
| `count` | 整数 | 合成一次产出的物品数量。例如 `acacia_door` 产出 3 个门。 |

---

## 示例解读

以第一个配方 `minecraft:acacia_boat` 为例：

```json
{
  "type": "crafting_shaped",
  "name": "minecraft:acacia_boat",
  "input": {
    "1": {"value": "minecraft:acacia_planks", "count": 1},
    "3": {"value": "minecraft:acacia_planks", "count": 1},
    "4": {"value": "minecraft:acacia_planks", "count": 1},
    "5": {"value": "minecraft:acacia_planks", "count": 1},
    "6": {"value": "minecraft:acacia_planks", "count": 1}
  },
  "output": {
    "1": {"item": "minecraft:acacia_boat", "count": 1}
  },
  "category": "crafting_shaped"
}
```

- 名称：金合欢木船
- 输入：需要 5 个金合欢木板，分别放在网格的 1、3、4、5、6 号格（即第一行左右、第二行全部三个格子？实际编号：1(左上)、3(右上)、4(中左)、5(中心)、6(中右)）。这是船的经典配方图案（中间一行放满三个木板，两侧各一个木板）。
- 输出：1 个金合欢木船。

---

## 总结

- `input` 的格子编号 `1`-`9` 对应 3×3 合成网格的位置（左上为 1，从上到下、从左到右编号）。
- 未在 `input` 中出现的格子视为**空**。
- `value` 可以是**单个物品**或**物品列表**（允许替代品）。
- 带有 `base`/`subtracted` 的配方是**模组扩展**（NeoForge），用于实现“除了某物品之外的任意物品”。
- 输出物品数量因配方而异（如门、台阶、楼梯等通常产出多个）。








## 二、`crafting_shapeless.json`（无序合成）

无序合成指在工作台中**不需要按特定图案摆放**材料，只要配方所需物品齐全即可。

### 顶层键值

| 键 | 类型 | 说明 |
|---|------|------|
| `category` | 字符串 | 固定为 `"crafting_shapeless"`，表示文件内所有配方属于无序合成类别。 |
| `count` | 整数 | 配方总数，此处为 `322`。 |
| `recipes` | 数组 | 存放所有无序合成配方的列表。 |

### 单个配方对象键值

| 键 | 类型 | 说明 |
|---|------|------|
| `type` | 字符串 | 配方类型，固定为 `"crafting_shapeless"`。 |
| `name` | 字符串 | 配方唯一标识，格式 `minecraft:物品ID`。 |
| `input` | 对象 | 描述原材料，键为数字字符串 `"1"` 到 `"9"`（表示网格中的格子，但顺序不重要，只统计哪些格子有物品）。每个值是一个原料描述对象。 |
| `output` | 对象 | 描述产物，只有一个键 `"1"`，值是一个产物描述对象。 |
| `category` | 字符串 | 冗余，同顶层 `category`。 |

`input` 中每个原料对象的键值与有型合成相同：

- `value`：可以是单个物品 ID（字符串），或允许的多个物品 ID 数组，或 NeoForge 差异类型对象（含 `base`、`subtracted`、`neoforge:ingredient_type`）。
- `count`：该格子所需物品数量（通常为 1）。

`output` 中产物对象的键值：

- `item`：产物物品 ID。
- `count`：产出数量。
- （可选）`components`：附加组件（例如谜之炖菜的药水效果）。

### 示例解读

以 `minecraft:acacia_button` 为例：

```json
{
  "type": "crafting_shapeless",
  "name": "minecraft:acacia_button",
  "input": {
    "1": { "value": "minecraft:acacia_planks", "count": 1 }
  },
  "output": { "1": { "item": "minecraft:acacia_button", "count": 1 } },
  "category": "crafting_shapeless"
}
```

- 名称：金合欢木按钮
- 输入：1 个金合欢木板（放在任意格子）
- 输出：1 个金合欢木按钮

另一个例子 `minecraft:acacia_planks`：

```json
{
  "type": "crafting_shapeless",
  "name": "minecraft:acacia_planks",
  "input": {
    "1": {
      "value": [
        "minecraft:acacia_log",
        "minecraft:acacia_wood",
        "minecraft:stripped_acacia_log",
        "minecraft:stripped_acacia_wood"
      ],
      "count": 1
    }
  },
  "output": { "1": { "item": "minecraft:acacia_planks", "count": 4 } },
  "category": "crafting_shapeless"
}
```

- 输入：可以是金合欢原木、金合欢木、去皮金合欢原木或去皮金合欢木中的任意一种，数量 1。
- 输出：4 个金合欢木板。

复杂例子（谜之炖菜配方）会携带 `components`，例如：

```json
"output": {
  "1": {
    "item": "minecraft:suspicious_stew",
    "count": 1,
    "components": {
      "minecraft:suspicious_stew_effects": [
        { "id": "minecraft:fire_resistance", "duration": 60 }
      ]
    }
  }
}
```

这表示产出带有效果的谜之炖菜。

---

## 三、`stonecutting.json`（切石机配方）

切石机是专门用于加工石材、铜块等方块的功能性方块，配方通常比工作台更经济（例如 1 个方块 → 2 个台阶或 1 个楼梯）。其 JSON 结构与合成配方略有不同。

### 顶层键值

| 键 | 类型 | 说明 |
|---|------|------|
| `category` | 字符串 | 固定为 `"stonecutting"`，表示所有配方属于切石机加工类型。 |
| `count` | 整数 | 配方总数，此处为 `275`。 |
| `recipes` | 数组 | 存放所有切石机配方的列表。 |

### 单个配方对象键值

| 键 | 类型 | 说明 |
|---|------|------|
| `type` | 字符串 | 配方类型，固定为 `"minecraft:stonecutting"`（注意命名空间形式）。 |
| `name` | 字符串 | 配方唯一标识，通常描述输入和输出，例如 `"minecraft:andesite_slab_from_andesite_stonecutting"`。 |
| `input` | 对象 | 描述**单个**输入物品。与合成配方不同，切石机每次只处理一种物品，所以 `input` 对象中只有一个键 `"1"`（尽管格式仍沿用数字键），值是一个原料描述对象。 |
| `output` | 对象 | 描述产物，同样只有一个键 `"1"`，值是一个产物描述对象。 |
| `category` | 字符串 | 固定为 `"stonecutting"`。 |

`input` 中的原料描述对象与之前相同：`value` 可以是字符串（单个物品）或数组（允许的多种物品），`count` 表示消耗数量（通常为 1）。

`output` 中的产物对象：`item` 和 `count`。

**关键区别**：切石机配方不需要指定网格位置，因为它是单物品输入、单配方产出，输出数量因产物类型而异（例如台阶通常是 2 个，楼梯是 1 个，雕纹方块是 1 个等）。

### 示例解读

以 `andesite_slab_from_andesite_stonecutting` 为例：

```json
{
  "type": "minecraft:stonecutting",
  "name": "minecraft:andesite_slab_from_andesite_stonecutting",
  "input": { "1": { "value": "minecraft:andesite", "count": 1 } },
  "output": { "1": { "item": "minecraft:andesite_slab", "count": 2 } },
  "category": "stonecutting"
}
```

- 输入：1 个安山岩
- 输出：2 个安山岩台阶

另一个例子 `chiseled_nether_bricks_from_nether_bricks_stonecutting`：

```json
{
  "type": "minecraft:stonecutting",
  "name": "minecraft:chiseled_nether_bricks_from_nether_bricks_stonecutting",
  "input": { "1": { "value": "minecraft:nether_bricks", "count": 1 } },
  "output": { "1": { "item": "minecraft:chiseled_nether_bricks", "count": 1 } },
  "category": "stonecutting"
}
```

- 输入：1 个下界砖块
- 输出：1 个雕纹下界砖块

铜块相关的切石配方也是类似的，例如：

```json
{
  "type": "minecraft:stonecutting",
  "name": "minecraft:cut_copper_from_copper_block_stonecutting",
  "input": { "1": { "value": "minecraft:copper_block", "count": 1 } },
  "output": { "1": { "item": "minecraft:cut_copper", "count": 4 } },
  "category": "stonecutting"
}
```

- 输入：1 个铜块
- 输出：4 个切制铜块

---

## 总结对比

| 特性 | 有序合成 (`crafting_shaped`) | 无序合成 (`crafting_shapeless`) | 切石机 (`stonecutting`) |
|------|------------------------------|--------------------------------|--------------------------|
| 合成位置 | 工作台（3×3 网格） | 工作台（3×3 网格） | 切石机 |
| 图案要求 | **需要特定形状** | **不需要特定形状** | 单物品输入，自动匹配 |
| 输入数量 | 可能多个格子（最多 9） | 可能多个格子（最多 9） | 固定 1 个输入 |
| 输出数量 | 因配方而异 | 因配方而异 | 通常台阶 2 个，楼梯/雕纹 1 个，特殊如切制铜块 4 个 |
| 配方文件 | `crafting_shaped.json` | `crafting_shapeless.json` | `stonecutting.json` |

