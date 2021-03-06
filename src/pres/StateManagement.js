import Chess from 'chess.js'
import * as Constants from '../app/Constants'
import {trackEvent} from '../app/Analytics'
import {copyText} from './loader/Common'

function turnColor() {
    return fullTurnName(this.chess.turn())
}

function fullTurnName(shortName) {
    return shortName === 'w' ? Constants.PLAYER_COLOR_WHITE : Constants.PLAYER_COLOR_BLACK
}

function playerColor() {
    return this.state.settings.playerColor
}

function brushes() {
    if(!this.playerColor() || this.playerColor() === this.turnColor()) {
        return this.forBrushes
    }
    return this.againstBrushes
}

function calcMovable() {
const dests = {}
    this.chess.SQUARES.forEach(s => {
        const ms = this.chess.moves({square: s, verbose: true})
        if (ms.length) dests[s] = ms.map(m => m.to)
    })
    return {
        free: false,
        dests,
        color: this.turnColor()
    }
}

function orientation() {
    return this.state.settings.orientation
}

function onMove(from, to) {
    const chess = this.chess
    let move = chess.move({ from, to, promotion: 'q'})
    this.setState({ fen: chess.fen(), lastMove: move})
}


function onMoveAction(from, to) {
    this.onMove(from,to)
    trackEvent(Constants.EVENT_CATEGORY_CHESSBOARD, "Move")
}

function navigateTo(fen, previousMove){
    this.chess = new Chess(fen)
    this.setState({fen:fen, lastMove:previousMove})
}
function updateProcessedGames(downloadLimit, n, parsedGame) {
    let totalGamesProcessed = this.state.gamesProcessed+n
    this.state.openingGraph.addPGN(parsedGame.pgnStats, parsedGame.parsedMoves,
            parsedGame.latestFen,parsedGame.playerColor)
    this.setState({
        gamesProcessed: totalGamesProcessed,
        downloadingGames: (totalGamesProcessed<downloadLimit || downloadLimit>=Constants.MAX_DOWNLOAD_LIMIT)?this.state.downloadingGames:false
    })
    // continue to download games if 
    // 1. we have not reached download limit OR
    //    there is no download limit set (downloadLimit>MAX condition)
    // 2. user did not hit stop button
    return (totalGamesProcessed < downloadLimit || downloadLimit>=Constants.MAX_DOWNLOAD_LIMIT)&& this.state.downloadingGames
}
function moveToShape(move) {
    return {
        orig:move.orig,
                    dest: move.dest,
                    brush: this.brushes()[move.level]
    }
}

function autoShapes() {
    var moves = this.movesToShow()
    if(moves) {
        var shapes = moves.map(this.moveToShape.bind(this))
        return this.fillArray(shapes,  25)
    }
    return this.fillArray([], 25) // dummy arrow to clear out existing arrows
}

function movesToShow() {
    if(!this.state.openingGraph.hasMoves) {
        return null;
    }
    var moves = this.state.openingGraph.movesForFen(this.chess.fen())
    return moves?moves.sort((a,b)=>b.details.count-a.details.count):[]
}



function gameResults() {
    return this.state.openingGraph.gameResultsForFen(this.chess.fen())
}

function fillArray(arr, len) {
    for (var i = arr.length; i < len; i++) {
        arr.push({'orig':'i'+i, 'dest':'i'+(i+1), brush:this.brushes()[0]});
    }
    return arr;
}

function reset() {
    this.chess = new Chess()
    this.setState({fen: this.chess.fen(), lastMove:null})
}

function clear() {
    this.state.openingGraph.clear()
    this.state.gamesProcessed = 0
    this.reset()
}

function settingsChange(name, value) {
    let settings = this.state.settings
    settings[name] = value;
    this.setState({
        'settings':settings
    })
}

function launch(url) {
    return () => {
      window.open(url, "_blank")
    }
  }


function showError(message, trackingEvent, subMessage, action, severity) {
    let errorActionText, errorAction
    let messageSeverity = severity || Constants.ERROR_SEVERITY_ERROR
    if(action === Constants.ERROR_ACTION_VISIT_OLD_SITE) {
        errorActionText="Visit old site"
        errorAction = launch("https://www.openingtree.com/old")
    } else if(action !== Constants.ERROR_ACTION_NONE){
        errorActionText="Report this"
        errorAction = this.toggleFeedback(true)
    }
    this.setState({message:message, subMessage:subMessage,
        errorAction:errorAction, errorActionText:errorActionText,
        messageSeverity:messageSeverity})
    let eventName = messageSeverity+"Shown"
    if(trackingEvent) {
        eventName = eventName+":"+trackingEvent
    }
    trackEvent(Constants.EVENT_CATEGORY_MESSAGE_SHOWN,eventName, message)
}

function showInfo(message, trackingLabel) {
    this.setState({message:message, messageSeverity:Constants.ERROR_SEVERITY_SUCCESS})
    trackEvent(Constants.EVENT_CATEGORY_MESSAGE_SHOWN,"infoShown",
        trackingLabel?trackingLabel:message)
}


function closeError() {
    this.setState({message:'', subMessage:''})
}

function toggleFeedback(diagnosticsOpen) {
    return () => {
        let feedbackOpen = this.state.feedbackOpen
        this.closeError()
        this.setState({feedbackOpen:!feedbackOpen,
                diagnosticsDataOpen:diagnosticsOpen})
    }
}

function setDownloading(val) {
    this.setState({downloadingGames:val})
}

function toggleDiagnosticsData() {
    this.setState({diagnosticsDataOpen:!this.state.diagnosticsDataOpen})
}

function copyDiagnostics() {
    copyText("diagnosticsText")
    this.showInfo("Copied Diagnostics data")
}


function importGameState(importState) {
    this.setState({
      settings:importState.settings,
      openingGraph:importState.openingGraph,
      gamesProcessed:importState.gamesProcessed
    })
  }
  function getChessboardWidth(){
    // have to manually set the width to pixels instead of "vw" value
    // this is because chessground component does not behave well with "vw" values
    if (window.innerWidth<=768) {
      return `${Math.round(window.innerWidth*95/100)}px` //95vw
    } else if ((window.innerWidth<=1024)) {
      return `${Math.round(window.innerWidth*40/100)}px` // 40vw
    } else {
      return "512px"
    }

  }

function getDiagnosticsValue() {
  return `--------------------
  ${navigator.userAgent}
  -------------------
  ${JSON.stringify(this.state)}
  -------------------
  `
}
function getRedditLink() {
    return `https://www.reddit.com/message/compose/?to=${Constants.OPENNIG_TREE_REDDIT}&subject=${this.getSubject()}&message=%0D%0A%0D%0A%0D%0A${this.getBody()}`
}

function getEmailLink() {
    return `mailto:${Constants.OPENING_TREE_EMAIL}?subject=${this.getSubject()}&body=%0D%0A%0D%0A%0D%0A${this.getBody()}`
}

function getSubject() {
    return this.state.diagnosticsDataOpen?"Possible Openingtree bug":"Feedback on Openingtree"
}
function getBody() {
    return this.state.diagnosticsDataOpen?this.getDiagnosticsValue():""
}


function addStateManagement(obj){
    obj.orientation  = orientation
    obj.turnColor = turnColor
    obj.calcMovable = calcMovable
    obj.onMove = onMove
    obj.onMoveAction = onMoveAction
    obj.autoShapes = autoShapes
    obj.updateProcessedGames = updateProcessedGames
    obj.settingsChange = settingsChange
    obj.reset = reset
    obj.clear = clear
    obj.navigateTo = navigateTo
    obj.playerColor = playerColor
    obj.fillArray = fillArray
    obj.brushes = brushes
    obj.moveToShape = moveToShape
    obj.movesToShow = movesToShow
    obj.gameResults = gameResults
    obj.showError = showError
    obj.showInfo = showInfo
    obj.closeError = closeError
    obj.toggleFeedback = toggleFeedback.bind(obj)
    obj.setDownloading = setDownloading
    obj.toggleDiagnosticsData = toggleDiagnosticsData.bind(obj)
    obj.copyDiagnostics = copyDiagnostics.bind(obj)
    obj.importGameState = importGameState
    obj.getDiagnosticsValue = getDiagnosticsValue
    obj.getChessboardWidth = getChessboardWidth
    obj.getEmailLink = getEmailLink
    obj.getSubject = getSubject
    obj.getBody = getBody.bind(obj)
    obj.getRedditLink = getRedditLink
}

export {addStateManagement}