/**
 * 2048 游戏核心逻辑 - 支持动画的方块对象版本
 */
class Game2048 {
  constructor(size = 4) {
    this.size = size
    this.tiles = []
    this.score = 0
    this.bestScore = 0
    this.won = false
    this.over = false
    this._nextId = 1
    this._consumedIds = []

    // 当前局统计
    this.moves = 0            // 步数
    this.mergeCount = 0       // 合并次数
    this.maxMergeScore = 0    // 最大单次合并得分
    this.startTime = 0        // 游戏开始时间戳

    // 历史统计
    this.totalGames = 0       // 总局数
    this.totalWins = 0        // 通关次数
  }

  /**
   * 初始化/重新开始游戏
   */
  setup() {
    this.tiles = []
    this.score = 0
    this.won = false
    this.over = false
    this._nextId = 1
    this._consumedIds = []
    this.moves = 0
    this.mergeCount = 0
    this.maxMergeScore = 0
    this.startTime = Date.now()
    this.addRandomTile()
    this.addRandomTile()
    this.loadBestScore()
    this.loadHistory()
  }

  /**
   * 加载最高分
   */
  loadBestScore() {
    try {
      const best = wx.getStorageSync('bestScore2048')
      if (best) this.bestScore = parseInt(best)
    } catch (e) {
      console.error('加载最高分失败', e)
    }
  }

  /**
   * 保存最高分
   */
  saveBestScore() {
    try {
      wx.setStorageSync('bestScore2048', this.bestScore)
    } catch (e) {
      console.error('保存最高分失败', e)
    }
  }

  /**
   * 加载历史统计
   */
  loadHistory() {
    try {
      const data = wx.getStorageSync('history2048')
      if (data) {
        this.totalGames = parseInt(data.totalGames) || 0
        this.totalWins = parseInt(data.totalWins) || 0
      }
    } catch (e) {
      console.error('加载历史统计失败', e)
    }
  }

  /**
   * 保存历史统计
   */
  saveHistory() {
    try {
      wx.setStorageSync('history2048', {
        totalGames: this.totalGames,
        totalWins: this.totalWins,
      })
    } catch (e) {
      console.error('保存历史统计失败', e)
    }
  }

  /**
   * 生成唯一ID
   */
  _newId() {
    return this._nextId++
  }

  /**
   * 在空位随机添加一个方块
   */
  addRandomTile() {
    const occupied = new Set()
    this.tiles.forEach(t => occupied.add(t.r * this.size + t.c))
    const empty = []
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!occupied.has(r * this.size + c)) empty.push({ r, c })
      }
    }
    if (empty.length === 0) return null
    const pos = empty[Math.floor(Math.random() * empty.length)]
    const tile = {
      id: this._newId(),
      value: Math.random() < 0.9 ? 2 : 4,
      r: pos.r,
      c: pos.c,
      isNew: true,
      isMerged: false,
    }
    this.tiles.push(tile)
    return tile
  }

  /**
   * 执行移动操作
   * @param {string} direction - 方向: 'left', 'right', 'up', 'down'
   */
  move(direction) {
    if (this.over) return false

    // 保存每个方块的上一帧位置，重置动画标记
    this.tiles.forEach(t => {
      t.prevR = t.r
      t.prevC = t.c
      t.isNew = false
      t.isMerged = false
    })
    this._consumedIds = []

    const isHorizontal = (direction === 'left' || direction === 'right')
    const isReverse = (direction === 'right' || direction === 'down')

    let moved = false
    let totalScoreGain = 0

    // 逐行/逐列处理
    for (let i = 0; i < this.size; i++) {
      // 筛选当前行/列的方块
      let lineTiles = this.tiles.filter(t => {
        return isHorizontal ? t.r === i : t.c === i
      })

      // 按目标方向排序（靠近目标边的排前面）
      lineTiles.sort((a, b) => {
        const posA = isHorizontal ? a.c : a.r
        const posB = isHorizontal ? b.c : b.r
        return isReverse ? posB - posA : posA - posB
      })

      // 压缩并合并
      let targetPos = isReverse ? this.size - 1 : 0
      let lastPlacedTile = null
      let lastWasMerged = false

      for (const tile of lineTiles) {
        if (this._consumedIds.includes(tile.id)) continue

        if (lastPlacedTile && !lastWasMerged && lastPlacedTile.value === tile.value) {
          // 合并：被吞并的方块滑到合并位置，然后消失
          if (isHorizontal) {
            tile.c = lastPlacedTile.c
          } else {
            tile.r = lastPlacedTile.r
          }
          lastPlacedTile.value *= 2
          lastPlacedTile.isMerged = true
          lastWasMerged = true
          totalScoreGain += lastPlacedTile.value
          this._consumedIds.push(tile.id)
          if (lastPlacedTile.value === 2048) this.won = true
          // 统计合并数据
          this.mergeCount++
          if (lastPlacedTile.value > this.maxMergeScore) {
            this.maxMergeScore = lastPlacedTile.value
          }
        } else {
          // 移动到目标位置
          if (isHorizontal) {
            tile.c = targetPos
          } else {
            tile.r = targetPos
          }
          lastPlacedTile = tile
          lastWasMerged = false
          targetPos += isReverse ? -1 : 1
        }

        // 检查是否有位移
        if (tile.prevR !== tile.r || tile.prevC !== tile.c) {
          moved = true
        }
      }
    }

    if (moved) {
      this.moves++
      this.score += totalScoreGain
      if (this.score > this.bestScore) {
        this.bestScore = this.score
        this.saveBestScore()
      }

      // 延迟添加新方块（先播放滑动动画）
      this._pendingNewTile = true
      // 注意：游戏结束判断移到 finishMove() 中，
      // 因为需要等新方块添加后再判断是否无路可走
    }

    return moved
  }

  /**
   * 完成动画后：移除被吞并的方块，添加新方块，检查游戏是否结束
   */
  finishMove() {
    // 移除被吞并的方块
    this.tiles = this.tiles.filter(t => !this._consumedIds.includes(t.id))
    this._consumedIds = []

    // 添加新方块
    if (this._pendingNewTile) {
      this.addRandomTile()
      this._pendingNewTile = false
    }

    // 新方块添加后再判断游戏是否结束
    if (!this.movesAvailable()) {
      this.over = true
      // 记录历史统计
      this.totalGames++
      if (this.won) this.totalWins++
      this.saveHistory()
    }
  }

  /**
   * 检查是否还有可用的移动
   */
  movesAvailable() {
    // 检查是否有空格
    const occupied = new Set()
    this.tiles.forEach(t => occupied.add(t.r * this.size + t.c))
    if (occupied.size < this.size * this.size) return true

    // 检查是否有相邻的相同方块
    const grid = Array.from({ length: this.size }, () => Array(this.size).fill(0))
    this.tiles.forEach(t => { grid[t.r][t.c] = t.value })

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = grid[r][c]
        if (c < this.size - 1 && val === grid[r][c + 1]) return true
        if (r < this.size - 1 && val === grid[r + 1][c]) return true
      }
    }
    return false
  }

  /**
   * 获取当前游戏状态
   */
  getState() {
    return {
      tiles: this.tiles.map(t => ({
        id: t.id,
        value: t.value,
        r: t.r,
        c: t.c,
        isNew: t.isNew || false,
        isMerged: t.isMerged || false,
      })),
      score: this.score,
      bestScore: this.bestScore,
      won: this.won,
      over: this.over,
      // 统计数据
      moves: this.moves,
      mergeCount: this.mergeCount,
      maxMergeScore: this.maxMergeScore,
      maxTile: this.tiles.length > 0 ? Math.max(...this.tiles.map(t => t.value)) : 0,
      avgScore: this.moves > 0 ? Math.round(this.score / this.moves * 10) / 10 : 0,
      totalGames: this.totalGames,
      totalWins: this.totalWins,
    }
  }
}

export default Game2048
