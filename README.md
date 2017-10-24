# pinch-zoom-responder

Easily add pinch and zoom gestures to your React Native components.

# Setup

```sh
npm install --save react-native-pinch-zoom-responder
```

# Usage

```javascript
import React, {
  Component
} from 'react'
import {
  View,
  Text
} from 'react-native'
import PinchZoomResponder from 'react-native-pinch-zoom-responder'

class MyComponent extends Component {
  constructor (props) {
    super(props)
    this.pinchZoomResponder = new PinchZoomResponder({
      onPinchStart: (e) => {
        console.log('pinch started')
      },

      onPinchEnd: (e) => {
        console.log('pinch ended')
      },

      onResponderMove: (e, gestureState) => {
        console.log('GestureState is ', gestureState)
      }
    })
  }

  render () {
    return (
      <View {...this.pinchZoomResponder.handlers}>
        <Text>Pinch me!</Text>
      </View>
    )
  }
}
```

The gestureState object has the shape:

```javascript
{
  transform, cx, cy, scaleX, scaleY, dx, dy
}
```

- `transform` is a 4x4 matrix that can be used with `react-native/Libraries/Utilities/MatrixMath` to easily transform points and graphics.
- `cx` is the pinch X center
- `cy` is the pinch Y center
- `scaleX` is the pinch x scale
- `scaleY` is the pinch y scale
- `dx` is the current delta x of the center of the pinch
- `dy` is the current delta y of the center of the pinch
