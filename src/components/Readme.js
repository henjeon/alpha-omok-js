import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Accordion from '@material-ui/core/Accordion'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Typography from '@material-ui/core/Typography'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import ReactMarkdown from 'react-markdown'

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
    linebreak: {
        whiteSpace: 'pre-wrap',
    }
}))

const textWhatIsIt = `
# AlphaOmok.js
_2021.01.21 전형규(oasis@henjeon.com)_

## 개요

이 데모는 알파제로처럼 강화학습과 신경망을 사용하여 다음 수를 탐색하는 간단한 오목 게임으로,
강화학습을 공부하면서 배운 내용을 실습하기 위한 목적으로 제작되었습니다. 
\n\n
소스코드 및 자세한 설명은 [여기](https://github.com/henjeon/alpha-omok-js)에 있습니다.

## 기능

* 컴퓨터와 한 번씩 번갈아서 오목을 둘 수 있습니다. 모바일 기기에서도 잘 동작합니다.
* 현재 대국 상태를 평가하여 어느 쪽이 유리한 지와 주요 착수점을 출력합니다.
* AI의 난이도를 설정할 수 있습니다. 모바일 기기에서는 _HARD_ 난이도의 실행 속도가 너무 느리므로 선택하지 않는 것이 좋습니다.

## 강화학습 방법

약 4일 동안 40,000번의 selfplay를 통해 오목을 두는 법을 학습했습니다. 수의 탐색은 다른 오목 인공지능과 비슷하게 MCTS를 사용합니다.

학습 속도를 단축하기 위해 멀티스레딩을 적극적으로 활용했습니다. pytorch 대신 libtorch로 모든 학습 코드를 구현했습니다. 

## 웹페이지에 올리기

onnx.js를 사용해서 학습한 모델을 실행합니다. backend로는 _webgl_을 사용하며 wasm(web assembly)보다 세 배 정도 빠르게 동작합니다.

ui는 _react_와 _material-ui_를 사용하고 있습니다.

모바일 기기에서도 실행가능하도록 MCTS 시뮬레이션 수를 크게 줄였습니다. 하나의 수를 탐색할 때 _EASY_ 난이도는 1번, _MEDIUM_ 난이도는 25번, _HARD_ 난이도는 400번의 시뮬레이션을 처리합니다.
_HARD_ 난이도에서 수 하나를 찾는 시간은 PC에서 대략 30초가 걸립니다. 같은 설정으로 모바일 기기는 10배 이상 느리게 동작합니다.
`

const textChangeLog = `

### 2020.01.24

* PC나 태블릿 같은 모바일 기기가 아닌 디바이스에서의 AI 탐색 성능을 개선했습니다. 
모바일 기기에서 이 기능을 활성화하려면 브라우저의 '데스크톱 사이트' 기능을 켜 보세요.

* 바둑돌 위에 착수점 힌트가 표시되던 문제를 수정했습니다.
* 다시 시작 후 바둑돌이 없는데 착수점 힌트가 표시되던 문제를 수정했습니다.

### 2021.01.21

* 최초 배포
`

export default function SimpleExpansionPanel() {
    const classes = useStyles()

    return (
        <div className={classes.root}>
            <Accordion >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography className={classes.heading}>이게 뭔가요?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div>
                        <ReactMarkdown source={textWhatIsIt}/>
                    </div>
                </AccordionDetails>
            </Accordion >
            <Accordion >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography className={classes.heading}>변경점</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div>
                        <ReactMarkdown source={textChangeLog}/>
                    </div>
                </AccordionDetails>
            </Accordion >
        </div>
    )
}
