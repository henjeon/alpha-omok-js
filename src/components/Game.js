import React, { useEffect, useState } from 'react'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import LinearProgress from '@material-ui/core/LinearProgress'
import IconButton from '@material-ui/core/IconButton'
import Grid from '@material-ui/core/Grid'
import Board from './Board'
import ComputerIcon from '@material-ui/icons/Computer'
import UndoIcon from '@material-ui/icons/Undo'
import ReplayIcon from '@material-ui/icons/Replay'

import GameState from '../GameState'

const useStyles = makeStyles({
    root: {
    },
    winningRatio: {
        width: '200px',
        height: '15px',
        marginTop: '8px',
        outlineStyle: 'solid',
        outlineColor: 'black',
        outlineWidth: 'thin',
        determinate: {
            color: 'red',
        }
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
}) {
    const classes = useStyles()

    const [winningRatio, setWinningRatio] = useState(50)

    useEffect(() => {
        if (gameState.result === GameState.RESULT_BLACK_WIN) {
            setWinningRatio(100)
        } else if (gameState.result === GameState.RESULT_WHITE_WIN) {
            setWinningRatio(0)
        } else if (gameState.result === GameState.RESULT_DRAW) {
            setWinningRatio(50)
        } else {
            (async () => {
                const modelInput = pvnet.getModelInput(gameState)
                const modelOutput = await pvnet.asyncForward(modelInput)
                if (modelOutput) {
                    let value = modelOutput.value
                    if (!GameState.isBlackTurn(gameState.turn)) {
                        value *= -1.0
                    }

                    value = Math.floor((value * 0.5 + 0.5) * 100)
                    value = Math.min(Math.max(value, 1), 99)

                    setWinningRatio(value)
                }
            })()
        }

        // eslint-disable-next-line
    }, [gameState.history])

    return (
        <div className={classes.root}>
            <Grid container justify='space-between'>
                <Grid item>
                    {(0 < gameState.turn) && <StyledLinearProgress
                        className={classes.winningRatio}
                        variant="determinate"
                        value={winningRatio} />}
                </Grid>
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
                onSelect={onSelect}>
            </Board>
        </div>
    )
}