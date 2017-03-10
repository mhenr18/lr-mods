import track from 'lr/track'
import events from 'lr/events'
import ui from 'lr/ui'
import React from 'react'

module.info = {
  name: 'Speedometer',
  version: '0.1.0',
  author: 'Matthew Henry',
  icon: module.resolvePath('./icon.svg')
}

let speedoUi = null

async function onPlaybackStart () {
  speedoUi.show()
}

async function onPlaybackStop () {
  speedoUi.hide()
}

async function onPlaybackFrame (e) {
  let frame = await track.getFrame(e.frameIndex)
  let rider = frame.entities[0]

  // rider point indexes are 4-9 inclusive.
  // note that we calculate speed as (pos - prevPos) rather than directly using
  // the vel as the vel always has gravity applied to it
  let x = 0
  let y = 0
  for (let i = 4; i <= 9; ++i) {
    x += (rider.points[i].pos.x - rider.points[i].prevPos.x)
    y += (rider.points[i].pos.y - rider.points[i].prevPos.y)
  }

  x /= 6
  y /= 6

  speedoUi.setState({
    speed: Math.sqrt(x*x + y*y)
  })
}

export default class SpeedometerUi extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      visible: false,
      speed: 0
    }
  }

  hide () {
    this.setState({ visible: false })
  }

  show () {
    this.setState({ visible: true })
  }

  render () {
    if (!this.state.visible) {
      return null
    }

    const style = { 
      fontFamily: 'Roboto, sans-serif', 
      fontSize: 14, 
      position: 'absolute', 
      top: '7px', 
      right: '7px'
    }

    const pStyle = {
      padding: 0,
      margin: '5px',
      textAlign: 'right'
    }

    return (
      <div style={style}>
        <p style={pStyle}>{this.state.speed.toFixed(2)} ppf</p>
      </div>
    )
  }
}

(async function () {
  speedoUi = await ui.createComponent(SpeedometerUi)

  events.addListener('playbackStart', onPlaybackStart)
  events.addListener('playbackStop', onPlaybackStop)
  events.addListener('playbackFrame', onPlaybackFrame)
})()
