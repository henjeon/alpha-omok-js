class GameState {

    static STONE_BLACK = 1
    static STONE_WHITE = -1

    static RESULT_NONE = 99
    static RESULT_BLACK_WIN = GameState.STONE_BLACK
    static RESULT_WHITE_WIN = GameState.STONE_WHITE
    static RESULT_DRAW = 0

    static isBlackTurn(turn) {
        return (turn % 2 === 0)
    }

    static getTurnColor(turn) {
        return GameState.isBlackTurn(turn) ? GameState.STONE_BLACK : GameState.STONE_WHITE
    }

    constructor({boardSize}) {
        this.boardSize = boardSize

        this.turn = 0
        this.result = GameState.RESULT_NONE
        this.blackStones = new Array(boardSize * boardSize).fill(0)
        this.whiteStones = new Array(boardSize * boardSize).fill(0)
        this.history = []
    }

    clone() {
        let newInstance = new GameState({ boardSize: this.boardSize })

        newInstance.turn = this.turn
        newInstance.result = this.result
        newInstance.blackStones = this.blackStones.slice()
        newInstance.whiteStones = this.whiteStones.slice()
        newInstance.history = this.history.slice()

        return newInstance
    }

    getValidPositions() {
        let output = []

        for (let i = 0; i < this.boardSize * this.boardSize; ++i) {
            if (this.blackStones[i] === 0 && this.whiteStones[i] === 0) {
                output.push([Math.floor(i / this.boardSize), i % this.boardSize])
            }
        }

        return output
    }

    step(inputPos) {
        let posIndex = inputPos[0] * this.boardSize + inputPos[1]

        if (this.blackStones[posIndex] === 1 || this.whiteStones[posIndex] === 1) {
            return false
        }

        if (GameState.isBlackTurn(this.turn)) {
            this.blackStones[posIndex] = 1
        } else {
            this.whiteStones[posIndex] = 1
        }

        this.history.push(inputPos)
        this.turn = this.turn + 1
        this.result = this.checkResult(inputPos)

        return true
    }

    undo() {
        if (0 < this.turn) {
            let lastPos = this.history[this.history.length - 1]
            let lastPosIndex = lastPos[0] * this.boardSize + lastPos[1]

            this.turn = this.turn - 1
            this.blackStones[lastPosIndex] = 0
            this.whiteStones[lastPosIndex] = 0
            this.history.pop()

            return true
        }
        else {
            return false
        }
    }

    checkResult(lastInputPos) {
        let targetStones, targetResult
        if (GameState.isBlackTurn(this.turn - 1)) {
            targetStones = this.blackStones
            targetResult = GameState.RESULT_BLACK_WIN
        } else {
            targetStones = this.whiteStones
            targetResult = GameState.RESULT_WHITE_WIN
        }

        const winStoneCount = 5

        // 가로 방향
		{
			let row = lastInputPos[0]
			let col = lastInputPos[1] - winStoneCount + 1
			let sum = 0
			for (let i = 0; i < winStoneCount * 2 - 1; ++i) {
				if (0 <= col && col < this.boardSize && targetStones[row*this.boardSize + col] === 1) {
					if (++sum === winStoneCount) {
						return targetResult
					}
				} else {
					sum = 0
				}

				++col
			}
        }
        
        // 세로방향
		{
			let row = lastInputPos[0] - winStoneCount + 1
			let col = lastInputPos[1]
			let sum = 0
			for (let i = 0; i < winStoneCount * 2 - 1; ++i) {
				if (0 <= row && row < this.boardSize && targetStones[row*this.boardSize + col] === 1) {
					if (++sum === winStoneCount) {
						return targetResult
					}
				} else {
					sum = 0
				}

				++row
			}			
        }
        
        // 대각선 위 방향
		{
			let row = lastInputPos[0] + winStoneCount - 1
			let col = lastInputPos[1] - winStoneCount + 1
			let sum = 0
			for (let i = 0; i < winStoneCount * 2 - 1; ++i) {
				if (0 <= row && row < this.boardSize && 0 <= col && col < this.boardSize &&
					targetStones[row*this.boardSize + col] === 1) {

					if (++sum === winStoneCount) {
						return targetResult
					}
				} else {
					sum = 0
				}

				--row
				++col
			}
        }
        
        // 대각선 아래 방향
		{
			let row = lastInputPos[0] - winStoneCount + 1
			let col = lastInputPos[1] - winStoneCount + 1
			let sum = 0
			for (let i = 0; i < winStoneCount * 2 - 1; ++i) {
				if (0 <= row && row < this.boardSize && 0 <= col && col < this.boardSize &&
					targetStones[row*this.boardSize + col] === 1) {

					if (++sum === winStoneCount) {
						return targetResult
					}
				} else {
					sum = 0
				}

				++row
				++col
			}
        }
        
        // 비김
        if (this.boardSize * this.boardSize <= this.turn) {
            return GameState.RESULT_DRAW
        }

        return GameState.RESULT_NONE
    }
}

export default GameState