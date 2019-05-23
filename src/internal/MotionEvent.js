const CROSS = 'cross'
const DRAG = 'drag'

class MotionEvent {
  constructor (kline, dataBounds, viewPortHandler) {
    this.kline = kline
    this.dataBounds = dataBounds
    this.viewPortHandler = viewPortHandler
    // 事件模型
    this.eventMode = CROSS
    this.mouseDownPoint = { x: 0, y: 0 }
  }

  /**
   * 鼠标按下时事件
   * @param e
   */
  mouseDown (e) {
    let point = this.getCanvasPoint(e)
    if (!this.isValidEvent(point)) {
      return
    }
    this.eventMode = DRAG
    this.mouseDownPoint.x = e.x
    this.mouseDownPoint.y = e.y
    this.kline.tooltipChart.setCross(point.y, false)
    this.kline.freshen()
  }

  /**
   * 鼠标抬起时事件
   * @param e
   */
  mouseUp (e) {
    let point = this.getCanvasPoint(e)
    if (!this.isValidEvent(point)) {
      return
    }
    this.eventMode = CROSS
    this.kline.tooltipChart.setCross(point.y, true)
    this.kline.freshen()
  }

  mouseLeave (e) {
    let point = this.getCanvasPoint(e)
    this.kline.tooltipChart.setCross(point.y, false)
    this.kline.freshen()
  }

  /**
   * 鼠标移动时事件
   * @param e
   */
  mouseMove (e) {
    let point = this.getCanvasPoint(e)
    if (!this.isValidEvent(point)) {
      this.kline.tooltipChart.setCross(point.y, false)
      this.kline.freshen()
      return
    }
    if (this.eventMode === DRAG) {
      let moveDist = e.x - this.mouseDownPoint.x
      if (moveDist > this.dataBounds.dataSpace / 2) {
        if (this.dataBounds.min === 0 || this.dataBounds.dataList.length < this.dataBounds.range) {
          return false
        }

        this.mouseDownPoint.x = e.x

        let moveRange = +Math.abs(moveDist / this.dataBounds.dataSpace).toFixed(0)
        if (moveRange === 0) {
          moveRange = 1
        }

        this.dataBounds.min -= moveRange
        if (this.dataBounds.min <= 0) {
          this.dataBounds.min = 0
        }
        this.kline.freshen()
      } else if (moveDist < 0 - this.dataBounds.dataSpace / 2) {
        if (this.dataBounds.min + this.dataBounds.range === this.dataBounds.dataList.length || this.dataBounds.dataList.length < this.dataBounds.range) {
          return false
        }

        this.mouseDownPoint.x = e.x

        let moveRange = +Math.abs(moveDist / this.dataBounds.dataSpace).toFixed(0)
        if (moveRange === 0) {
          moveRange = 1
        }

        this.dataBounds.min += moveRange
        if (this.dataBounds.min >= this.dataBounds.dataList.length - this.dataBounds.range) {
          this.dataBounds.min = this.dataBounds.dataList.length - this.dataBounds.range
        }
        this.kline.freshen()
      }
    } else if (this.eventMode === CROSS) {
      this.dataBounds.calcCurrentDataIndex(point.x)
      this.kline.tooltipChart.setCross(point.y, true)
      this.kline.freshen()
    }
  }

  /**
   * 鼠标滚轮事件
   * @param e
   */
  mouseWheel (e) {
    let touchStartPosition = this.dataBounds.min
    let touchRange = this.dataBounds.range
    let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
    // 是否缩小
    let isZoomingOut = delta === 1
    let scaleX = 1

    if (isZoomingOut) {
      scaleX = 0.95
      if (this.dataBounds.range >= this.dataBounds.maxRange) {
        // 无法继续缩小
        return false
      }
    } else {
      scaleX = 1.05
      if (this.dataBounds.range <= this.dataBounds.minRange) {
        // 无法继续放大
        return false
      }
    }

    // 计算缩放后的range大小
    this.dataBounds.range = +(touchRange / scaleX).toFixed(0)

    this.dataBounds.range = Math.min(Math.max(this.dataBounds.range, this.dataBounds.minRange), this.dataBounds.maxRange)

    this.dataBounds.min = touchStartPosition + touchRange - this.dataBounds.range
    if (this.dataBounds.min + this.dataBounds.range > this.dataBounds.dataList.length) {
      this.dataBounds.min = 0
    }
    if (this.dataBounds.min < 0) {
      this.dataBounds.min = 0
    }
    this.kline.freshen()
  }

  /**
   * 是否是有效事件
   * @param point
   * @returns {boolean}
   */
  isValidEvent (point) {
    return !(point.x < this.viewPortHandler.contentLeft() ||
      point.x > this.viewPortHandler.contentRight() ||
      point.y < this.viewPortHandler.contentTop() ||
      point.y > this.viewPortHandler.contentBottom())
  }

  /**
   * 获取事件对应画布上的点
   * @param e
   * @returns {{x: number, y: number}}
   */
  getCanvasPoint (e) {
    let rect = this.kline.canvasDom.getBoundingClientRect()
    let x = Math.round(e.clientX - rect.left)
    let y = Math.round(e.clientY - rect.top)
    return { x: x * 2, y: y * 2 }
  }
}

export default MotionEvent