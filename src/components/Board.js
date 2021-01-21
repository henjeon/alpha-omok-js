import React, {useEffect, useRef} from 'react'
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

const imageBg = new Image()
imageBg.src = canvasBg

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

function draw(canvas, history) {
    const context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(imageBg, 0, 0, canvas.width, canvas.height)

    for (let i = 0; i < history.length; ++i)
    {
        let [row, col] = history[i]
        
        drawStone(context, row, col, i)
    }

    if (0 < history.length) {
        let [row, col] = history[history.length - 1]
        drawLastStoneIndicator(context, row, col)
    }
}

function drawPolicy(canvas, policy, boardSize) {
    const context = canvas.getContext('2d')

    for (let i = 0; i < policy.length; ++i)
    {
        let row = Math.floor(i / boardSize)
        let col = i % boardSize
        let [x, y] = boardPosToPixel(row, col)

        let p = Math.floor(policy[i] * 100.0)
        if (0 < p) {
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

export default function Board({boardSize, history, policy, onSelect}) {
    const classes = useStyles()
    const canvasRef = useRef()

    // componentDidMount()
    useEffect(() => {
        const canvas = canvasRef.current
        
        //const dpi = window.devicePixelRatio
        const dpi = 1
        const canvasSize = CELL_SIZE * boardSize
        canvas.width = canvasSize * dpi
        canvas.height = canvasSize * dpi        

        // eslint-disable-next-line
    }, [])  

    useEffect(() => {
        draw(canvasRef.current, history)
    }, [history])

    useEffect(() => {
        drawPolicy(canvasRef.current, policy, boardSize)
    }, [policy, boardSize])

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