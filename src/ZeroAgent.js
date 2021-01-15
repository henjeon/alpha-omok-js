import GameState from './GameState'
import {sleep} from './Utils'

class ZeroAgent {
    constructor({boardSize, pvnet}) {
        this.boardSize = boardSize
        this.pvnet = pvnet
        this.numMCTS = 25
    }

    async asyncGetAction(gameState) {
        if (!this.pvnet.ready)
        {
            return
        }

        let rootNode = this.newNode()

        for (let i = 0; i < this.numMCTS + 1; ++i) {
            let curGameState = gameState.clone()

            let leafNode = this.processSelection(rootNode, curGameState)
            if (leafNode.result === GameState.RESULT_NONE) {
                await this.processExpansionAndEvaluation(leafNode, curGameState)
            }
            this.processBackup(leafNode)

            // ui가 갱신될 수 있도록 yield합니다.
            await sleep(0.01)
        }

        let maxVisitCount = -1
        let bestNodeIndex
        for (let i = 0; i < rootNode.children.length; ++i) {
            let child = rootNode.children[i]
            if (child && maxVisitCount < child.n) {
                maxVisitCount = child.n
                bestNodeIndex = i
            }
        }

        return rootNode.childPositions[bestNodeIndex]
    }

    newNode() {
        return {
            children: [],
            childPositions: [],
            childPriors: [],
            parent: null,
            result: GameState.RESULT_NONE,
            value: 0.0,
            n: 0,
            w: 0.0,
            q: 0.0,
        }
    }

    processSelection(rootNode, curGameState) {
        let curNode = rootNode

        while (0 < curNode.n) {
            if (curNode.result !== GameState.RESULT_NONE) {
                break
            }

            let totalNSquared = Math.sqrt(curNode.n)
            
            let maxQU = 0.0
            let bestChildIndex = -1
            for (let i = 0; i < curNode.children.length; ++i) {
                let childNode = curNode.children[i]
                let p = curNode.childPriors[i]
                
                let q = 0.0
                let n = 0
                if (childNode) {
                    q = childNode.q
                    n = childNode.n
                }

                const c_puct = 5
                let u = c_puct * p * totalNSquared / (n + 1)
                let qu = q + u

                if (bestChildIndex === -1 || maxQU < qu)
                {
                    maxQU = qu
                    bestChildIndex = i
                }
            }

            let bestChildNode = curNode.children[bestChildIndex]
            if (!bestChildNode) {
                bestChildNode = this.newNode()
                bestChildNode.parent = curNode
                curNode.children[bestChildIndex] = bestChildNode
            }

            curGameState.step(curNode.childPositions[bestChildIndex])
            bestChildNode.result = curGameState.result
            if (bestChildNode.result !== GameState.RESULT_NONE) {
                bestChildNode.value = 1.0
            }

            curNode = bestChildNode
        }

        return curNode
    }

    async processExpansionAndEvaluation(leafNode, curGameState) {
        let modelInput = this.pvnet.getModelInput(curGameState)
        let {policy, value} = await this.pvnet.asyncForward(modelInput)

        let validPositions = curGameState.getValidPositions()
        let numChildren = validPositions.length

        leafNode.children = new Array(numChildren)
        leafNode.childPositions = new Array(numChildren)
        leafNode.childPriors = new Array(numChildren)

        let sumOfP = 0.0
        for (let i = 0; i < numChildren; ++i) {
            let pos = validPositions[i]
            let posIndex = pos[0] * this.boardSize + pos[1]

            leafNode.childPositions[i] = pos
            leafNode.childPriors[i] = policy[posIndex]
            
            sumOfP += policy[posIndex]
        }

        for (let i = 0; i < numChildren; ++i) {
            leafNode.childPriors[i] /= sumOfP
        }

        leafNode.value = value * -1.0
    }

    processBackup(leafNode) {
        let value = leafNode.value

        let curNode = leafNode
        while (curNode) {
            curNode.n += 1
            curNode.w += value
            curNode.q = curNode.w / curNode.n

            curNode = curNode.parent
            value *= -1.0

        }
    }
}

export default ZeroAgent