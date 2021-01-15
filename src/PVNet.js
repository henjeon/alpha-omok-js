import { Tensor, InferenceSession } from 'onnxjs'

import GameState from './GameState'

const NUM_INPUT_PLANES = 5
const HISTORY_SIZE = 5

class PVNet {
    constructor({boardSize, modelPath}) {
        this.boardSize = boardSize
        this.modelPath = modelPath
        this.ready = false
    }

    async asyncLoadModel() {
        const model = new InferenceSession({ backendHint: 'webgl' })

        console.log("Loading model:", this.modelPath)
        await model.loadModel(this.modelPath)

        console.log("Model warming up...")
        await model.run([
            new Tensor(
                new Float32Array(1 * NUM_INPUT_PLANES * this.boardSize * this.boardSize),
                'float32',
                [1, NUM_INPUT_PLANES, this.boardSize, this.boardSize])   
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

        const modelOutput = await this.model.run([input])
        const policy = modelOutput.get('policy').data
        const value = modelOutput.get('value').data[0]

        return { policy: policy, value: value}
    }

    getModelInput(gameState) {
        let curTurn = gameState.turn
        let curColor = GameState.getTurnColor(curTurn)
        let oppColor = GameState.getTurnColor(curTurn + 1)

        let curStones = curColor === GameState.STONE_BLACK ? gameState.blackStones : gameState.whiteStones
        let oppStones = oppColor === GameState.STONE_BLACK ? gameState.blackStones : gameState.whiteStones

        let curLastStones = new Array(this.boardSize * this.boardSize).fill(0)
        let oppLastStones = new Array(this.boardSize * this.boardSize).fill(0)
        for (let i = 0; i < HISTORY_SIZE * 2; ++i) {
            let turn = (curTurn - 1) - i
            if (0 <= turn) {
                let inputPos = gameState.history[turn]
                let lastStones = (i % 2) !== 0 ? curLastStones : oppLastStones
                lastStones[inputPos[0] * this.boardSize + inputPos[1]] = 1
            }
            else {
                break
            }
        }

        let colorStones = new Array(this.boardSize * this.boardSize)
        if (GameState.isBlackTurn(curTurn)) {
            colorStones.fill(0)
        } else  {
            colorStones.fill(1)
        }

        return new Tensor(
            curStones.concat(oppStones, curLastStones, oppLastStones, colorStones),
            'float32',
            [1, NUM_INPUT_PLANES, this.boardSize, this.boardSize])
    }
}

export default PVNet