import GameState from './GameState'
import {sleep, isMobileOnly} from './Utils'

class ZeroAgent {
    constructor({boardSize, pvnet}) {
        this.boardSize = boardSize
        this.pvnet = pvnet
        this.level = 0
        this.numSimulations = [1, 25, 400]
    }

    setLevel(level) {
        this.level = level
    }

    async asyncGetAction(gameState) {
        if (!this.pvnet.ready)
        {
            return
        }

        let rootNode = this.newNode()
        let numSimulations = this.numSimulations[this.level] + 1

        let inferences = []

        for (let i = 0; i < numSimulations; ++i) {
            let curGameState = gameState.clone()

            await this.processInferences(inferences, this.level < 2 || numSimulations <= i + 4)

            let leafNode = this.processSelection(rootNode, curGameState)
            if (leafNode.result === GameState.RESULT_NONE) {
                inferences.push([leafNode, curGameState])
            } else {
                this.processBackup(leafNode)
            }            
        }

        await this.processInferences(inferences, true)

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
            virtualLoss: 0.0,
        }
    }

    async processInferences(inferences, force) {
        if (inferences.length === 0) {
            return
        }

        const maxInferenceQueueSize = isMobileOnly ? 1 : 4

        if (force || maxInferenceQueueSize <= inferences.length) {
            let modelInput = this.pvnet.getModelInput(inferences.reduce((a, e) => a.concat(e[1]), []))
            let promise = this.pvnet.asyncForward(modelInput)
            await sleep(0.01)  // ui가 갱신될 수 있도록 합니다.
            let modelOutput = await promise

            for (let i = 0; i < inferences.length; ++i) {
                let [ leafNode, gameState ] = inferences[i]

                this.processExpansionAndEvaluation(
                    leafNode,
                    gameState,
                    modelOutput.policies[i],
                    modelOutput.values[i])
                this.processBackup(leafNode)
            }

            inferences.splice(0, inferences.length)
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
                let virtualLoss = 0.0
                if (childNode) {
                    q = childNode.q
                    n = childNode.n
                    virtualLoss = childNode.virtualLoss
                }

                const c_puct = 5
                let u = c_puct * p * totalNSquared / (n + 1)
                let qu = q + u - (virtualLoss / (n + 1))

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
            curNode.virtualLoss += 1.0
        }

        return curNode
    }

    processExpansionAndEvaluation(leafNode, curGameState, policy, value) {
        if (0 < leafNode.children.length) {
            return
        }

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
            curNode.virtualLoss -= 1.0

            curNode = curNode.parent
            value *= -1.0
        }
    }
}

export default ZeroAgent