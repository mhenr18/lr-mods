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
let speedData = null
let frameTimes = []

function getTime () {
  return performance.now() / 1000
}

function getFps () {
  let currTime = getTime()
  frameTimes = frameTimes.filter(t => currTime - t < 1.5)

  if (frameTimes.length == 0) {
    return 0
  }

  let totalTime = currTime - frameTimes[0]
  if (totalTime < 0.0001) {
    totalTime = 0.0001
  }
 
  return (frameTimes.length - 1) / totalTime
}

function getSpeed (frame) {
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

  return Math.sqrt(x*x + y*y)
}

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

function frameIndexToTimecodeString (frameIndex) {
  frameIndex = Math.round(frameIndex)

  let frames = frameIndex % 40
  let totalSeconds = frameIndex / 40
  let seconds = Math.floor(totalSeconds) % 60
  let totalMinutes = totalSeconds / 60
  let minutes = Math.floor(totalMinutes) % 60
  let totalHours = totalMinutes / 60
  let hours = Math.floor(totalHours)

  let timecodeStr = ''

  if (hours > 0) {
    timecodeStr += '' + hours + ':'
  }

  if (hours > 0 || minutes > 0) {
    if (hours > 0) {
      timecodeStr += '' + zeroPad(minutes, 2) + ':'
    } else {
      timecodeStr += '' + minutes + ':'
    }
  }

  if (minutes > 0) {
    timecodeStr += '' + zeroPad(seconds, 2) + ';'
  } else {
    timecodeStr += '' + seconds + ';'
  }

  timecodeStr += '' + zeroPad(frames, 2)
  return timecodeStr
}

async function onPlaybackStart () {
  speedoUi.show()
}

async function onPlaybackStop () {
  speedoUi.hide()
}

async function onPlaybackFrame (e) {
  let dataFrame = await speedData.getFrame(e.frameIndex)
  frameTimes.push(getTime())

  speedoUi.setState({
    timecode: frameIndexToTimecodeString(e.frameIndex),
    speed: dataFrame.speed,
    maxSpeed: dataFrame.maxSpeed,
    maxSpeedFrameIndex: dataFrame.maxSpeedFrameIndex,
    fps: getFps()
  })
}

export default class SpeedometerUi extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      timecode: '',
      visible: false,
      speed: 0,
      maxSpeed: 0,
      maxSpeedFrameIndex: 0,
      fps: 0
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
      right: '7px',
      background: 'rgba(255, 255, 255, 0.93)'
    }

    const pStyle = {
      padding: 0,
      margin: '5px',
      textAlign: 'right'
    }

    return (
      <div style={style}>
        <p style={pStyle}>{Math.round(this.state.fps).toString()} fps</p>
        <p style={pStyle}>{this.state.timecode}</p>
        <p style={pStyle}>{this.state.speed.toFixed(2)} ppf</p>
        <p style={pStyle}>{this.state.maxSpeed.toFixed(2)} ppf @ {frameIndexToTimecodeString(this.state.maxSpeedFrameIndex)}</p>
      </div>
    )
  }
}

(async function () {
  speedoUi = await ui.createComponent(SpeedometerUi)
  speedData = await track.createComputedData({ speed: 0, maxSpeed: 0, maxSpeedFrameIndex: 0 }, 
    (frame, prevData) => {
      const speed = getSpeed(frame)

      let maxSpeedFrameIndex = prevData.maxSpeedFrameIndex
      let maxSpeed = prevData.maxSpeed

      if (speed >= maxSpeed) {
        maxSpeed = speed
        maxSpeedFrameIndex = frame.index
      }

      return {
        speed: speed,
        maxSpeed: maxSpeed,
        maxSpeedFrameIndex: maxSpeedFrameIndex
      }
    })

  events.addListener('playbackStart', onPlaybackStart)
  events.addListener('playbackStop', onPlaybackStop)
  events.addListener('playbackFrame', onPlaybackFrame)
})()
