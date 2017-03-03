import * as track from 'lr/track'
import * as ui from 'lr/ui'
import * as tools from 'lr/tools'
import React from 'react'

module.info = {
  name: 'Polygon Tool',
  version: '0.1.0',
  author: 'Matthew Henry',
  icon: module.resolvePath('./polygon.svg')
}

let startX = null
let startY = null
let toolUi = null

function addCircle (centerX, centerY, arcX, arcY, numSegments) {
  let dx = arcX - centerX
  let dy = arcY - centerY
  let radius = Math.sqrt(dx * dx + dy * dy)
  let angle = Math.atan2(dy, dx)
  let segmentAngle = (2 * Math.PI) / numSegments
  let px = arcX
  let py = arcY

  if (radius == 0) {
    return
  }

  for (let i = 1; i <= numSegments; ++i) {
    var nx = centerX + radius * Math.cos(angle + segmentAngle * i)
    var ny = centerY + radius * Math.sin(angle + segmentAngle * i)

    if (i == numSegments) {
      nx = arcX
      ny = arcY
    }

    track.addLine({
      x1: px,
      y1: py,
      x2: nx,
      y2: ny,
      type: 2
    })

    px = nx
    py = ny
  }
}

async function onCursorDown (x, y) {
  startX = x
  startY = y

  onCursorDrag(x, y)
}

async function onCursorDrag (x, y) {
  track.revertChanges()
  addCircle(startX, startY, x, y, toolUi.state.numSegments)
}

async function onCursorUp (x, y) {
  track.commitChanges()
}

async function onActivate () {
  toolUi.show()
}

async function onDeactivate () {
  toolUi.hide()
}


export default class CircleToolUi extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      numSegments: 16,
      visible: false
    }

    this._onInputChange = this.onInputChange.bind(this)
  }

  hide () {
    this.setState({
      visible: false
    })
  }

  show () {
    this.setState({
      visible: true
    })
  }

  onInputChange (e) {
    this.setState({
      numSegments: parseInt(e.target.value)
    })
  }

  render () {
    if (!this.state.visible) {
      return null
    }

    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14 }}>
        <label>Num segments: </label>
        <input type="text" value={this.state.numSegments || ''} 
          onChange={this._onInputChange} />
      </div>
    )
  }
}

(async function () {
  toolUi = await ui.createComponent(CircleToolUi)

  tools.registerTool('polygon', {
    onCursorDown, 
    onCursorDrag, 
    onCursorUp,
    onActivate,
    onDeactivate,
    usesSwatches: true,
    hotkey: 'c',
    icon: module.resolvePath('./polygon.svg'),
  })
})()
