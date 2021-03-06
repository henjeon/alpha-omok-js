import 'fontsource-roboto'

import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { AppBar } from '@material-ui/core'
import { Container }  from '@material-ui/core'
import { Toolbar } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

import Game from './components/Game'
import Readme from './components/Readme'
import GameState from './GameState'
import ZeroAgent from './ZeroAgent'
import PVNet from './PVNet'
import {isMobileOnly, isDevelopment, sleep} from './Utils'

const useStyles = makeStyles({
    root: {
        justifyContent:'center',
        maxWidth: '100%',
        margin: '5vh',
    },
    revision: {
        justifyContent:'right',
    }
})

const BOARD_SIZE = 15

const AppState = {
    DEFAULT: { text: "" },
    MODEL_LOADING: { text: "AI를 준비하고 있습니다. 잠시 기다려 주세요." },
    WAITING_FOR_INPUT: { text: "원하는 위치를 터치하거나 컴퓨터 아이콘을 누르세요." },
    AGENT_THINKING: { text: "AI가 다음 수를 계산하고 있습니다..." },
    GAME_FINISHED: { text: "대국이 종료되었습니다. 다시 시작 버튼을 누르세요." }
}

function newGameState() {
    return new GameState({
        boardSize: BOARD_SIZE,
    })
}

function App() {
    const [appState, setAppState] = useState(AppState.DEFAULT)
    const [gameState, setGameState] = useState(newGameState())
    const [pvnet] = useState(new PVNet({
        boardSize: BOARD_SIZE,
        modelPath: './trained_model.onnx',
    }))
    const [zeroAgent] = useState(new ZeroAgent({
        boardSize: BOARD_SIZE,
        pvnet: pvnet,
    }))

    async function getComputerAction(curGameState) {
        let startTime = performance.now()                
        let pos = await zeroAgent.asyncGetAction(curGameState)        
        let endTime = performance.now()
        
        setAiThinkTime(endTime - startTime)
        
        return pos
    }

    function goToNextState(curGameState, inputPos, autoPlay) {
        let newGameState = curGameState.clone()
        if (newGameState.step(inputPos)) {
            setGameState(newGameState)

            if (newGameState.result === GameState.RESULT_NONE) {
                if (autoPlay) {
                    (async () => {
                        await sleep(1.0)
                        let pos = await getComputerAction(newGameState)
                        if (pos) {
                            goToNextState(newGameState, pos)
                        }
                        else {
                            console.warn("asyncGetAction() failed")
                        }
                    })()
                    setAppState(AppState.AGENT_THINKING)                    
                } else {
                    setAppState(AppState.WAITING_FOR_INPUT)
                }
            }
            else {
                setAppState(AppState.GAME_FINISHED)
            }
        }
        else {
            setAppState(AppState.WAITING_FOR_INPUT)
        }
    }

    // componentDidMount()
    useEffect(() => {
        (async () => {
            setAppState(AppState.MODEL_LOADING)
            await pvnet.asyncLoadModel()

            setAppState(AppState.WAITING_FOR_INPUT)
        })()

        // eslint-disable-next-line
    }, [])

    function onSelect(pos) {
        if (appState === AppState.WAITING_FOR_INPUT) {
            goToNextState(gameState, pos, true)
        }
    }

    function onRestart() {
        if (appState === AppState.WAITING_FOR_INPUT || appState === AppState.GAME_FINISHED) {
            setGameState(newGameState())
            setAppState(AppState.WAITING_FOR_INPUT)
        }
    }

    function onUndo() {
        if (appState === AppState.WAITING_FOR_INPUT || appState === AppState.GAME_FINISHED) {
            let newGameState = gameState.clone()
            if (newGameState.undo()) {
                setGameState(newGameState)
                setAppState(AppState.WAITING_FOR_INPUT)
            }
        }
    }

    function onComputer() {
        if (appState === AppState.WAITING_FOR_INPUT) {
            (async () => {
                let pos = await getComputerAction(gameState)
                if (pos) {
                    goToNextState(gameState, pos)
                }
                else {
                    console.warn("asyncGetAction() failed")
                }
            })()
            setAppState(AppState.AGENT_THINKING)
        }
    }

    function onAILevel(aiLevel) {
        zeroAgent.setLevel(aiLevel)
    }

    const [aiThinkTime, setAiThinkTime] = useState(0)
    const debugText = `
isMobileOnly: ${isMobileOnly}
backend: ${pvnet.backendHint()}
webgl.version: ${window.onnx.backend.webgl.glContext ? window.onnx.backend.webgl.glContext.version : 'undefined'}
aiThinkTime: ${aiThinkTime * 0.001}s`

    const classes = useStyles()
    return (
        <div>
            <AppBar position="static">
                <Toolbar >
                    <Grid container justify='space-between'>
                        <Typography variant='h6'>
                            AlphaOmok.js
                        </Typography>
                        <Typography variant='caption'>
                            v0.1.1
                        </Typography>
                    </Grid>
                </Toolbar>
            </AppBar>
            <Container>
                { isDevelopment && <div style={{whiteSpace:"pre"}}> {debugText}</div> }
                <Grid className={classes.root} container>
                    <Grid item>
                        <Game
                            gameState={gameState}
                            pvnet={pvnet}
                            onSelect={onSelect}
                            onRestart={onRestart}
                            onUndo={onUndo}
                            onComputer={onComputer}
                            onAILevel={onAILevel}>
                        </Game>
                        <Typography color="textPrimary">
                            {appState.text}
                        </Typography>
                    </Grid>
                </Grid>
                <Readme/>
            </Container>
        </div>
    )
}

export default App
