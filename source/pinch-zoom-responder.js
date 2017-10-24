import MatrixMath from 'react-native/Libraries/Utilities/MatrixMath'

export class PinchZoomResponder {
  constructor (responders, options = {}) {
    this.responders = responders
    this.transformX = typeof options.transformX === 'undefined' ? true : options.transformX
    this.transformY = typeof options.transformY === 'undefined' ? true : options.transformY
    this.handlers = {
      onStartShouldSetResponder: this.onStartShouldSetResponder.bind(this),
      onMoveShouldSetResponder: this.onMoveShouldSetResponder.bind(this),
      onStartShouldSetResponderCapture: this.onStartShouldSetResponderCapture.bind(this),
      onMoveShouldSetResponderCapture: this.onMoveShouldSetResponderCapture.bind(this),
      onResponderGrant: this.onResponderGrant.bind(this),
      onResponderMove: this.onResponderMove.bind(this),
      onResponderReject: this.onResponderReject.bind(this),
      onResponderRelease: this.onResponderRelease.bind(this),
      onResponderTerminate: this.onResponderTerminate.bind(this),
      onResponderTerminationRequest: this.onResponderTerminationRequest.bind(this)
    }
    this.touches = {}
    this.transform = MatrixMath.createIdentityMatrix()
    this.tempTransformMatrix = MatrixMath.createIdentityMatrix()
  }

  onStartShouldSetResponder () { /* console.log('start should set'); */ return true }
  onMoveShouldSetResponder () { /* console.log('move should set'); */ return true }
  onStartShouldSetResponderCapture () { /* console.log('start set capture'); */ return true }
  onMoveShouldSetResponderCapture () { /* console.log('move set capture'); */ return true }
  onResponderReject (e) { /* console.log('reject') */ }
  onResponderTerminationRequest () { /* console.log('terminate request'); */ return false }

  storeOriginalTouches (touches) {
    touches.forEach((touch) => {
      if (!this.touches[touch.identifier]) {
        this.touches[touch.identifier] = touch
      }
      if (!touch.touches) { return }
      touch.touches.forEach((secondaryTouch) => {
        if (secondaryTouch.identifier !== touch.identifier &&
            !this.touches[secondaryTouch.identifier]) {
          this.touches[secondaryTouch.identifier] = secondaryTouch
        }
      })
    })
  }

  clearOldTouches (touches) {
    for (var key in this.touches) {
      var found = false
      for (var i in touches) {
        if (touches[i].identifier == key) {
          found = true
        }
      }
      if (!found) {
        delete this.touches[key]
      }
    }
  }

  onResponderGrant (e) {
    this.updateTouchState(e)
  }

  updateTouchState (e) {
    var oldTouchCount = Object.keys(this.touches).length
    this.clearOldTouches(e.nativeEvent.touches)
    this.storeOriginalTouches(e.nativeEvent.touches)
    var newTouchCount = Object.keys(this.touches).length
    if (oldTouchCount < 2 && newTouchCount >= 2) {
      this.onPinchZoomStart(e)
    } else if (oldTouchCount >= 2 && newTouchCount < 2) {
      this.onPinchZoomEnd(e)
    }
    if (newTouchCount < 2) {
      this.touches = {}
    }
    this.storeCenter(e)
  }

  onResponderMove (e) {
    this.updateTouchState(e)
    if (e.nativeEvent.touches.length === 2) {
      var gestureState = this.gestureState(e)
    }
    if (this.responders.onResponderMove) {
      return this.responders.onResponderMove(e, gestureState)
    }
  }

  onPinchZoomStart (e) {
    if (this.responders.onPinchZoomStart) {
      return this.responders.onPinchZoomStart(e)
    }
  }

  onPinchZoomEnd (e) {
    if (this.responders.onPinchZoomEnd) {
      return this.responders.onPinchZoomEnd(e)
    }
  }

  onResponderRelease (e) {
    this.updateTouchState(e)
  }

  onResponderTerminate (e) {
  }

  storeCenter (e) {
    this.scaleCenterX = this.center(e.nativeEvent, 'locationX')
    this.scaleCenterY = this.center(e.nativeEvent, 'locationY')
  }

  gestureState (e) {
    this.reuseIdentityMatrix(this.transform)
    var transform = this.transform

    var scaleX = 1
    var dx = 0
    var cx = 0

    if (this.transformX) {
      scaleX = this.scale(e.nativeEvent, 'locationX')
      dx = this.delta(e.nativeEvent, 'locationX')
      cx = this.scaleCenterX;
    }

    var scaleY = 1
    var dy = 0
    var cy = 0

    if (this.transformY) {
      scaleY = this.scale(e.nativeEvent, 'locationY')
      dy = this.delta(e.nativeEvent, 'locationY')
      cy = this.scaleCenterY
    }

    this.reuseIdentityMatrix(this.tempTransformMatrix)
    MatrixMath.reuseTranslate2dCommand(this.tempTransformMatrix, dx, dy)
    MatrixMath.multiplyInto(transform, this.tempTransformMatrix, transform)

    this.reuseIdentityMatrix(this.tempTransformMatrix)
    MatrixMath.reuseTranslate2dCommand(this.tempTransformMatrix, -cx, -cy)
    MatrixMath.multiplyInto(transform, this.tempTransformMatrix, transform)

    this.reuseIdentityMatrix(this.tempTransformMatrix)
    MatrixMath.reuseScale3dCommand(this.tempTransformMatrix, scaleX, scaleY, 1)
    MatrixMath.multiplyInto(transform, this.tempTransformMatrix, transform)

    this.reuseIdentityMatrix(this.tempTransformMatrix)
    MatrixMath.reuseTranslate2dCommand(this.tempTransformMatrix, cx, cy)
    MatrixMath.multiplyInto(transform, this.tempTransformMatrix, transform)

    return {
      transform, cx, cy, scaleX, scaleY, dx, dy
    }
  }

  delta (nativeEvent, field) {
    return nativeEvent.touches.reduce((totalDelta, touch) => {
      return totalDelta + (touch[field] - this.touches[touch.identifier][field])
    }, 0) / nativeEvent.touches.length
  }

  scale (nativeEvent, field) {
    var spread = this.spread(nativeEvent, field)
    var startSpread = this.startSpread(nativeEvent, field)
    if (startSpread === 0) {
      var _scale = 1
    } else {
      _scale = spread / (this.startSpread(nativeEvent, field) * 1.0)
    }
    return _scale
  }

  startSpread (nativeEvent, field) {
    var locations = nativeEvent.touches.map((touch) => this.touches[touch.identifier][field])
    return Math.max(...locations) - Math.min(...locations)
  }

  spread (nativeEvent, field) {
    var locations = nativeEvent.touches.map((touch) => touch[field])
    return Math.max(...locations) - Math.min(...locations)
  }

  center (nativeEvent, field) {
    var totalPage = nativeEvent.touches.reduce((total, touch) => {
      return total + touch[field]
    }, 0)
    return totalPage / nativeEvent.touches.length
  }

  reuseIdentityMatrix(matrixCommand) {
    matrixCommand[0] = 1
    matrixCommand[1] = 0
    matrixCommand[2] = 0
    matrixCommand[3] = 0

    matrixCommand[4] = 0
    matrixCommand[5] = 1
    matrixCommand[6] = 0
    matrixCommand[7] = 0

    matrixCommand[8] = 0
    matrixCommand[9] = 0
    matrixCommand[10] = 1
    matrixCommand[11] = 0

    matrixCommand[12] = 0
    matrixCommand[13] = 0
    matrixCommand[14] = 0
    matrixCommand[15] = 1
  }
}
