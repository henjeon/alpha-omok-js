import { Tensor, InferenceSession } from 'onnxjs'

import GameState from './GameState'
import { isMobileOnly } from './Utils'

const BATCH_SIZE = isMobileOnly ? 1 : 4
const NUM_INPUT_PLANES = 5
const HISTORY_SIZE = 5

class PVNet {
    constructor({boardSize, modelPath}) {
        this.boardSize = boardSize
        this.modelPath = modelPath
        this.ready = false
    }

    backendHint () {
        if (this.ready) {
            return this.model.session.backendHint
        } else {
            return '(not ready)'
        }
    }

    async asyncLoadModel() {
        const model = new InferenceSession({ backendHint: 'webgl' })

        console.log("Loading model:", this.modelPath)
        await model.loadModel(this.modelPath)

        console.log("Model warming up...")
        await model.run([
            new Tensor(
                new Float32Array(BATCH_SIZE * NUM_INPUT_PLANES * this.boardSize * this.boardSize),
                'float32',
                [BATCH_SIZE, NUM_INPUT_PLANES, this.boardSize, this.boardSize])   
        ])

        this.model = model
        this.ready = true
        console.log("Model was successfully loaded.")
    }

    async asyncForward(input) {
        if (!this.ready)
        {
            return
        }

        const batchSize = input.dims[0]
        const planeSize = this.boardSize * this.boardSize
        const modelOutput = await this.model.run([input])
        const policyOutput = modelOutput.get('policy').data
        const valueOutput = modelOutput.get('value').data

        let policies = []
        let values = []
        for (let i = 0; i < batchSize; ++i) {
            policies.push(policyOutput.slice(i * planeSize, (i + 1) * planeSize))
            values.push(valueOutput[i])
        }

        return { policies: policies, values: values}
    }

    getModelInput(gameStates) {
        let colorPlanes = Array(2)
        colorPlanes[0] = (new Array(this.boardSize * this.boardSize)).fill(0)
        colorPlanes[1] = (new Array(this.boardSize * this.boardSize)).fill(1)

        let batchBuffer = []
        for (let i = 0; i < gameStates.length; ++i) {
            let gameState = gameStates[i]

            let curTurn = gameState.turn
            let curColor = GameState.getTurnColor(curTurn)
            let oppColor = GameState.getTurnColor(curTurn + 1)

            let curStones = curColor === GameState.STONE_BLACK ? gameState.blackStones : gameState.whiteStones
            let oppStones = oppColor === GameState.STONE_BLACK ? gameState.blackStones : gameState.whiteStones

            let curLastStones = new Array(this.boardSize * this.boardSize).fill(0)
            let oppLastStones = new Array(this.boardSize * this.boardSize).fill(0)
            for (let j = 0; j < HISTORY_SIZE * 2; ++j) {
                let turn = (curTurn - 1) - j
                if (0 <= turn) {
                    let inputPos = gameState.history[turn]
                    let lastStones = (j % 2) !== 0 ? curLastStones : oppLastStones
                    lastStones[inputPos[0] * this.boardSize + inputPos[1]] = 1
                }
                else {
                    break
                }
            }

            batchBuffer = batchBuffer.concat(
                curStones,
                oppStones,
                curLastStones,
                oppLastStones,
                colorPlanes[curTurn % 2])
            if (i === gameStates.length - 1) {
                for (let j = gameStates.length; j < BATCH_SIZE; ++j) {
                    batchBuffer = batchBuffer.concat(
                        colorPlanes[0],
                        colorPlanes[0],
                        colorPlanes[0],
                        colorPlanes[0],
                        colorPlanes[0])
                }
            }
        }

        return new Tensor(
            batchBuffer,
            'float32',
            [BATCH_SIZE, NUM_INPUT_PLANES, this.boardSize, this.boardSize])
    }
}

export default PVNet