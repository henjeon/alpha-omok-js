import React, {useState, useEffect, useRef} from 'react'
import { makeStyles } from '@material-ui/core/styles'

// 이미지 출처: https://tools.w3cub.com/gomoku
import canvasBg from '../canvas_bg.png'

const CELL_SIZE = 30
const STONE_RADIUS = 12

const useStyles = makeStyles({
    canvas: {
        //border: '1px solid black',
        backgroundColor: '#dab050',
    },
})

const imageBgCached = new Image()
imageBgCached.src = canvasBg

function boardPosToPixel(row, col) {
    let x = CELL_SIZE / 2 + col * CELL_SIZE
    let y = CELL_SIZE / 2 + row * CELL_SIZE

    return [x, y]
}

function drawStone(context, row, col, turn) {
    let [x, y] = boardPosToPixel(row, col)

    context.beginPath()
    context.arc(x, y, STONE_RADIUS, 0, 2 * Math.PI)
    context.fillStyle = (turn % 2 === 0) ? 'black' : 'white'
    context.fill()
    context.closePath()        
    context.stroke()

    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = (turn % 2 !== 0) ? 'black' : 'white'
    context.fillText(turn + 1, x, y)
}

function drawLastStoneIndicator(context, row, col) {
    let [x, y] = boardPosToPixel(row, col)

    context.beginPath()
    context.arc(x, y, STONE_RADIUS * 1.4, 0, 2 * Math.PI)
    context.strokeStyle = 'blue'
    context.closePath()        
    context.stroke()
}

function draw(canvas, history, policy, boardSize) {
    const context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(imageBgCached, 0, 0, canvas.width, canvas.height)

    // stone
    for (let i = 0; i < history.length; ++i)
    {
        let [row, col] = history[i]
        
        drawStone(context, row, col, i)
    }

    // last stone indicator
    if (0 < history.length) {
        let [row, col] = history[history.length - 1]
        drawLastStoneIndicator(context, row, col)
    }

    // policy
    if (policy) {
        for (let i = 0; i < policy.length; ++i)
        {
            let row = Math.floor(i / boardSize)
            let col = i % boardSize
            let [x, y] = boardPosToPixel(row, col)

            let p = Math.floor(policy[i] * 100.0)
            if (0 < p && !history.find((pos) => (pos[0] === row && pos[1] === col))) {
                let size = p/100 * STONE_RADIUS + 5
                context.fillStyle = 'red'
                context.fillStyle = 'rgba(255, 0, 0, 0.5)'
                context.beginPath()
                context.arc(x, y, size, 0, 2 * Math.PI)
                context.closePath()        
                context.fill()
            }
        }
    }
}

export default function Board({boardSize, history, policy, onSelect}) {
    const classes = useStyles()
    const canvasRef = useRef()
    const [ready, setReady] = useState(false)

    // componentDidMount()
    useEffect(() => {
        const canvas = canvasRef.current
        
        //const dpi = window.devicePixelRatio
        const dpi = 1
        const canvasSize = CELL_SIZE * boardSize
        canvas.width = canvasSize * dpi
        canvas.height = canvasSize * dpi

        const imageBg = new Image()
        imageBg.onload = () => { setReady(true) }
        imageBg.src = canvasBg

        // eslint-disable-next-line
    }, [])  

    useEffect(() => {
        if (ready) {
            draw(canvasRef.current, history, policy, boardSize)
        }
    }, [ready, history, policy, boardSize])

    function onClick(event) {
        let x = event.pageX - event.target.offsetLeft
        let y = event.pageY - event.target.offsetTop

        let row = Math.floor(y / CELL_SIZE)
        let col = Math.floor(x / CELL_SIZE)

        if (onSelect)
        {
            onSelect([row, col])
        }
    }
   
    return (
        <div>
            <canvas className={classes.canvas} ref={canvasRef} onClick={onClick}/>
        </div>
    )
}