import Game2048 from '../../utils/game'

const game = new Game2048(4)
const SLIDE_DURATION = 130

Page({
  data: {
    tiles: [],
    score: 0,
    bestScore: 0,
    over: false,
    won: false,
    keepPlaying: false,
    newRecord: false,
    showFireworks: false,
    fireworkParticles: [],
    // 统计数据
    moves: 0,
    maxTile: 0,
    mergeCount: 0,
    gameTime: '00:00',
    avgScore: 0,
    maxMergeScore: 0,
    totalGames: 0,
    totalWins: 0,
  },

  touchStartX: 0,
  touchStartY: 0,
  animating: false,
  _prevBestScore: 0,
  _timer: null,

  audioCtx: { move: null, merge: null, gameover: null, win: null, slide: null },

  onLoad() {
    game.setup()
    this.updateView()
    this.initAudio()
    this.startTimer()
  },

  onShow() {
    game.loadBestScore()
    game.loadHistory()
    this.setData({ bestScore: game.bestScore, totalGames: game.totalGames, totalWins: game.totalWins })
    this._prevBestScore = game.bestScore
  },

  onHide() {
    this.stopTimer()
    this.destroyAudio()
  },
  onUnload() {
    this.stopTimer()
    this.destroyAudio()
  },

  initAudio() {
    const sounds = [
      { key: 'move', src: '/audio/move.wav' },
      { key: 'slide', src: '/audio/slide.wav' },
      { key: 'merge', src: '/audio/merge.wav' },
      { key: 'gameover', src: '/audio/gameover.wav' },
      { key: 'win', src: '/audio/win.wav' },
    ]
    sounds.forEach(({ key, src }) => {
      const ctx = wx.createInnerAudioContext()
      ctx.src = src
      ctx.volume = 0.6
      // 关键：不遵守系统静音开关，否则 iOS 侧静音时无声
      ctx.obeyMuteSwitch = false
      ctx.onError((err) => {
        console.warn('音频播放错误:', key, err.errMsg)
      })
      this.audioCtx[key] = ctx
    })
  },

  destroyAudio() {
    Object.values(this.audioCtx).forEach(ctx => { if (ctx) ctx.destroy() })
    this.audioCtx = { move: null, merge: null, gameover: null, win: null, slide: null }
  },

  playSound(key) {
    const ctx = this.audioCtx[key]
    if (!ctx) return
    try { ctx.stop() } catch (e) {}
    ctx.play()
  },

  /**
   * 启动游戏计时器
   */
  startTimer() {
    this.stopTimer()
    this._timer = setInterval(() => {
      if (game.over || this.animating) return
      const elapsed = Math.floor((Date.now() - game.startTime) / 1000)
      const min = String(Math.floor(elapsed / 60)).padStart(2, '0')
      const sec = String(elapsed % 60).padStart(2, '0')
      this.setData({ gameTime: `${min}:${sec}` })
    }, 1000)
  },

  /**
   * 停止计时器
   */
  stopTimer() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  /**
   * 生成礼花粒子数据
   */
  generateFireworkParticles() {
    const particles = []
    const colors = [0, 1, 2, 3, 4]
    // 3组爆发点
    const bursts = [
      { x: 30, y: 35 },
      { x: 70, y: 30 },
      { x: 50, y: 55 },
    ]
    let id = 0
    bursts.forEach((burst, bi) => {
      const count = 18
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count + (bi * 0.3)
        const spread = 15 + Math.random() * 20
        const tx = burst.x + Math.cos(angle) * spread
        const ty = burst.y + Math.sin(angle) * spread
        particles.push({
          id: id++,
          x: tx,
          y: ty,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: bi * 200 + Math.random() * 100,
          dur: 500 + Math.random() * 400,
        })
      }
      // 额外散落粒子
      for (let i = 0; i < 8; i++) {
        particles.push({
          id: id++,
          x: burst.x + (Math.random() - 0.5) * 40,
          y: burst.y + (Math.random() - 0.5) * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: bi * 200 + 100 + Math.random() * 200,
          dur: 600 + Math.random() * 500,
        })
      }
    })
    return particles
  },

  /**
   * 显示礼花特效（2秒后自动消失）
   */
  showFireworkEffect() {
    const particles = this.generateFireworkParticles()
    this.setData({ showFireworks: true, fireworkParticles: particles })
    setTimeout(() => {
      this.setData({ showFireworks: false, fireworkParticles: [] })
    }, 2000)
  },

  updateView(isSlidePhase = false) {
    const state = game.getState()
    const tiles = state.tiles.map(t => ({
      ...t,
      left: t.c * 156,
      top: t.r * 156,
      showNew: isSlidePhase ? false : t.isNew,
      showMerged: isSlidePhase ? false : t.isMerged,
    }))

    // 更新用时
    const elapsed = Math.floor((Date.now() - game.startTime) / 1000)
    const min = String(Math.floor(elapsed / 60)).padStart(2, '0')
    const sec = String(elapsed % 60).padStart(2, '0')

    this.setData({
      tiles,
      score: state.score,
      bestScore: state.bestScore,
      over: state.over,
      won: state.won,
      // 统计数据
      moves: state.moves,
      maxTile: state.maxTile,
      mergeCount: state.mergeCount,
      gameTime: `${min}:${sec}`,
      avgScore: state.avgScore,
      maxMergeScore: state.maxMergeScore,
      totalGames: state.totalGames,
      totalWins: state.totalWins,
    })
  },

  onTouchStart(e) {
    if (game.over || this.animating) return
    const touch = e.touches[0]
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
  },

  onTouchMove() {},

  onTouchEnd(e) {
    if (game.over || this.animating) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const MIN_SWIPE = 30

    if (Math.max(absDeltaX, absDeltaY) < MIN_SWIPE) return

    let direction
    if (absDeltaX > absDeltaY) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    // 记录移动前的最高分
    this._prevBestScore = game.bestScore

    const moved = game.move(direction)
    if (moved) {
      this.playSound('move')
      this.playSound('slide')
      this.animating = true
      this.updateView(true)

      setTimeout(() => {
        const hadMerge = game.tiles.some(t => t.isMerged)
        const isNewRecord = game.score > this._prevBestScore
        game.finishMove()
        this.updateView(false)

        // 合并音效
        if (hadMerge) {
          this.playSound('merge')
        }

        // 胜利：播放庆祝音效
        if (game.won && !this.data.keepPlaying) {
          setTimeout(() => this.playSound('win'), 200)
        }

        // 游戏结束
        if (game.over) {
          setTimeout(() => {
            this.playSound('gameover')
            // 判断是否破纪录
            if (isNewRecord) {
              this.setData({ newRecord: true })
              this.showFireworkEffect()
            }
          }, 200)
        }

        this.animating = false
      }, SLIDE_DURATION)
    }
  },

  onNewGame() {
    game.setup()
    this.animating = false
    this.setData({ keepPlaying: false, newRecord: false, showFireworks: false })
    this.updateView(false)
    this.startTimer()
  },

  onKeepPlaying() {
    this.setData({ keepPlaying: true })
    game.won = false
    this.setData({ won: false })
  },
})
