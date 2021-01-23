import React, { useEffect, useState } from 'react'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import LinearProgress from '@material-ui/core/LinearProgress'
import Grid from '@material-ui/core/Grid'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import IconButton from '@material-ui/core/IconButton'
import ComputerIcon from '@material-ui/icons/Computer'
import UndoIcon from '@material-ui/icons/Undo'
import ReplayIcon from '@material-ui/icons/Replay'

import Board from './Board'
import GameState from '../GameState'

const useStyles = makeStyles({
    root: {
    },
    winningRatio: {
        width: '200px',
        height: '15px',
        outlineStyle: 'solid',
        outlineColor: 'black',
        outlineWidth: 'thin',
        determinate: {
            color: 'red',
        }
    },
    aiLevel: {
        minWidth: '100px',
    },
})

const StyledLinearProgress = withStyles({
    colorPrimary: {
        backgroundColor: "white"
    },
    barColorPrimary: {
        backgroundColor: "black"
    }
})(LinearProgress)

export default function Game({
    gameState,
    pvnet,
    onSelect,
    onRestart,
    onUndo,
    onComputer,
    onAILevel,
}) {
    const [winningRatio, setWinningRatio] = useState(50)
    const [policy, setPolicy] = useState([])
    const [aiLevel, setAILevel] = useState(0)

    useEffect(() => {
        if (gameState.result === GameState.RESULT_BLACK_WIN) {
            setWinningRatio(100)
            setPolicy([])
        } else if (gameState.result === GameState.RESULT_WHITE_WIN) {
            setWinningRatio(0)
            setPolicy([])
        } else if (gameState.result === GameState.RESULT_DRAW) {
            setWinningRatio(50)
            setPolicy([])
        } else if (0 < gameState.history.length) {
            (async () => {
                const modelInput = pvnet.getModelInput([gameState])
                const modelOutput = await pvnet.asyncForward(modelInput)
                if (modelOutput) {
                    let policy = modelOutput.policies[0] 
                    let value = modelOutput.values[0]

                    if (!GameState.isBlackTurn(gameState.turn)) {
                        value *= -1.0
                    }
    
                    value = Math.floor((value * 0.5 + 0.5) * 100)
                    value = Math.min(Math.max(value, 1), 99)
    
                    setWinningRatio(value)
                    setPolicy(policy)
                }
            })()
        } else {
            setPolicy([])
        }

        // eslint-disable-next-line
    }, [gameState.history])

    const classes = useStyles()
    return (
        <div className={classes.root}>
            <Grid container justify='space-between' alignItems='center'>
                <Grid item xs>
                    {(0 < gameState.turn) && <StyledLinearProgress                   
                        className={classes.winningRatio}
                        variant="determinate"
                        value={winningRatio} 
                    />}
                </Grid>
                <Select
                    className={classes.aiLevel} 
                    value={aiLevel}
                    onChange={(e) => {setAILevel(e.target.value);onAILevel(e.target.value)}}>
                    <MenuItem value={0}>Easy</MenuItem>
                    <MenuItem value={1}>Medium</MenuItem>
                    <MenuItem value={2}>Hard</MenuItem>
                </Select>        
                <Grid item>
                    <Grid container justify='flex-end'>
                        <IconButton size='small' onClick={() => onRestart()}>
                            <ReplayIcon />
                        </IconButton>
                        <IconButton size='small' onClick={() => onUndo()}>
                            <UndoIcon />
                        </IconButton>
                        <IconButton size='small' onClick={() => onComputer()}>
                            <ComputerIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>
            <Board
                boardSize={gameState.boardSize}
                history={gameState.history}
                policy={policy}
                onSelect={onSelect}/>
        </div>
    )
}