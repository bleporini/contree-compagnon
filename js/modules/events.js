const buildEventValue = evt => ({
    event: evt,
    buildEvent: playerName => new CustomEvent(evt, {bubbles:true, detail: playerName})
});
const buildEvent = evt => ({
    event: evt,
    buildEvent: () => new Event(evt, {bubbles:true})
});


const Events = {
    dummy: buildEvent('dummy'),
    stateUpdated: buildEvent('stateUpdated'),
    init: buildEvent('init'),
    reset: buildEvent('reset'),
    newGame: buildEvent('newGame'),
    northPlayerDefined: buildEventValue('northPlayerDefined'),
    southPlayerDefined: buildEventValue('southPlayerDefined'),
    eastPlayerDefined: buildEventValue('eastPlayerDefined'),
    westPlayerDefined: buildEventValue('westPlayerDefined'),
    northStartingDefined: buildEvent('northStartingDefined'),
    southStartingDefined: buildEvent('southStartingDefined'),
    eastStartingDefined: buildEvent('eastStartingDefined'),
    westStartingDefined: buildEvent('westStartingDefined'),
    teamCompleted: buildEvent('teamCompleted'),
    teamNotCompleted: buildEvent('teamNotCompleted'),
    gameStarted: buildEvent('gameStarted'),
    annoncesStarted: buildEvent('annoncesStarted'),
    passe: buildEvent('passe'),
    annonce: buildEventValue('annonce'),
    contre: buildEvent('contre'),
    surContre: buildEvent('surContre'),
    undoAnnonce: buildEvent('undoAnnonce'),
    endAnnonces: buildEvent('endAnnonces'),
    annoncesValidated: buildEvent('annoncesValidated'),
    maineStarted: buildEvent('maineStarted'),
    maineFinished: buildEventValue('maineFinished'),
    maineFinishedCapot: buildEventValue('maineFinishedCapot'),
    maineFinishedDedans: buildEventValue('maineFinishedDedans'),
    maineFinishedNsPenalty: buildEvent('maineFinishedNsPenalty'),
    maineFinishedEwPenalty: buildEvent('maineFinishedEwPenalty'),
    all : () => Object.keys(Events)
        .filter(k => k !== 'all')
        
};

export default Events;