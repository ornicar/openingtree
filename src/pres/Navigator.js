import React from 'react'
import ChessEcoCodes from 'chess-eco-codes'
import OpeningManager from '../app/OpeningManager'
import {Container, Row, Col} from 'reactstrap'

export default class Navigator extends React.Component {
    
    constructor(props){
        super(props)
        this.openingManager = new OpeningManager()
        this.state = {
            currentMove:0,
          }        
    }

    shouldComponentUpdate(newProps) {
        //console.log(newProps)
        if(newProps.fen !== this.openingManager.fen()) {
            if(newProps.move.from === "ab1") {
                this.openingManager = new OpeningManager()
                return true
            }
            this.openingManager.addPly(newProps.fen, newProps.move)
            return true
        }
        return true
    }

    previous() {
        let newState = this.openingManager.moveBack()
        this.props.onChange(newState.fen, newState.move)
        this.setState({currentMove:this.openingManager.currentMove()})
    }

    next() {
        let newState = this.openingManager.moveForward()
        this.props.onChange(newState.fen, newState.move)
        this.setState({currentMove:this.openingManager.currentMove()})
    }

    moveTo(index) {
        return () => {
            let newState = this.openingManager.moveTo(index*2+1)
            this.props.onChange(newState.fen, newState.move)
            this.setState({currentMove:this.openingManager.currentMove()})
        }
    }

    render(){
        let opening = ChessEcoCodes(this.openingManager.fen())
        if(this.openingManager.currentMove() !== this.state.currentMove) {
            console.log('weird');
        }
        if (opening) {
            this.opening = opening.name
        }
        return <Container>
            <Row>
            <Col lg="6" className="navSection"><button onClick= {this.previous.bind(this)}>&lt;prev</button> </Col>
            <Col lg="6" className="navSection"><button onClick = {this.next.bind(this)}>next&gt;</button></Col></Row>
            <Row>{this.opening}</Row>
            {
            this.openingManager.pgnListSoFar()? 
            (this.openingManager.pgnListSoFar().map((move, index)=>
                <Row onClick={this.moveTo(index).bind(this)} className={`navCol ${this.openingManager.currentMove() === index? 'selectedMove':''}`}>
                    <Col sm="12" className = "navMove border">{`${move.moveNumber}.${move.whitePly} ${move.blackPly}`}</Col>
                </Row>))
            :''}
        </Container>
    }
}