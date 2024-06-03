import Events from './events.js';
import {stages} from "./state.js";


const verifyNewGameDefinition =  state => {

    const allPlayersValid = ['north', 'south', 'east', 'west'].reduce(
        (acc, curr) => acc && state.players && state.players[curr] && state.players[curr].length > 0,
        true
    );

    state.teamCompleted = !!(allPlayersValid &&
        state.firstStartPosition &&
        state.firstStartPosition.length > 0);
    return state;
};

const newGameLogic = (component, stateRepository) => {
    const sendTeamNotCompleted = () => {
        component.dispatchEvent(
            Events.teamNotCompleted.buildEvent()
        )
    };
    const sendTeamCompleted = () => {
        component.dispatchEvent(
            Events.teamCompleted.buildEvent()
        )
    };
    component.addEventListener(
        Events.reset.event,
        () => {
            stateRepository.reset();
        }
    );
    stateRepository.withState(state => verifyNewGameDefinition(state));

    ['north', 'south', 'east', 'west'].forEach(e => {
        component.addEventListener(
            Events[`${e}PlayerDefined`].event,
            ({detail}) => {
                const state = stateRepository.withState(state => {
                    state.stage = stages.newGameDefinition;
                    const addedPLayer = {};
                    addedPLayer[e] = detail;
                    state.players = {
                        ...state.players,
                        ...addedPLayer
                    };
                    const addedPosition = {};
                    addedPosition[detail] = e;
                    state.positions = {
                        ...state.positions,
                        ...addedPosition
                    };
                    return verifyNewGameDefinition(state);
                });
                if (state.teamCompleted) sendTeamCompleted(); else sendTeamNotCompleted();
                return state;
            }
        );
        component.addEventListener(
            Events[`${e}StartingDefined`].event,
            () => {
                const state = stateRepository.withState(state => {
                    state.stage = stages.newGameDefinition;
                    state.firstStartPosition = e;
                    const newState = verifyNewGameDefinition(state);
                    return verifyNewGameDefinition(state);
                });
                if (state.teamCompleted) sendTeamCompleted(); else sendTeamNotCompleted();
                return state;
            }
        )
    });

};                                                                                        

const isAnnonce = event =>
    [Events.annonce.event, Events.passe.event, Events.contre.event, Events.surContre.event].includes(event);

const dropAnnoncesToUndo = eventLog => {
    const dropAnnonceR = ([e, ...tail],result = [], toDrop=0) => {
        const {name}  = e;
        if (tail.length === 0 || name === Events.annoncesStarted.event) return result;
        else if (name === Events.stateUpdated.event) return dropAnnonceR(tail, result, toDrop);
        else if (name === Events.undoAnnonce.event) return dropAnnonceR(tail, result, toDrop + 1);
        else if (isAnnonce(name) && toDrop > 0) return dropAnnonceR(tail, result, toDrop - 1);
        else return dropAnnonceR(tail, [e, ...result], toDrop);

    };
    return dropAnnonceR([...eventLog].reverse());
};

const nextPositions = {
    north: 'west',
    south: 'east',
    east: 'north',
    west: 'south'
};

const initNextMaine = state => {
    const {teamCompleted, annonce, firstStartPosition, ...newState} = state;
    const nextStartingPosition = nextPositions[firstStartPosition];
    return {
        ...newState,
        history: [],
        stage: stages.annonces,
        firstStartPosition: nextStartingPosition,
        currentPlayer: state.players[nextStartingPosition],
        passe: 0,
    }
};


const annoncesLogic = (component, repository) => {

    const findNextPlayer = (state, currentPlayer) => {
        const currentPostition = state.positions[currentPlayer];
        const nextPosition = nextPositions[currentPostition];
        return state.players[nextPosition];
    };

    const setNextPlayer = state => ({
        ...state,
        currentPlayer: findNextPlayer(state, state.currentPlayer)
    });

    const addHistoryItem = (state, annonce) => {
        const {history= []} = state;
        return {
            ...state,
            history: [annonce, ...history]
        }
    };

    component.addEventListener(
        Events.passe.event,
        () => {
            repository.withState(state => {
                const passe = state.passe ? state.passe +1: 1;
                if ((state.annonce && passe === 3) || passe > 3){
                    return {
                        ...addHistoryItem(state, {player:state.currentPlayer, amount: 'Passe'}),
                        passe,
                        stage:stages.annoncesEnd
                    }
                }else return {
                    ...addHistoryItem(state, {player:state.currentPlayer, amount: 'Passe'}),
                    passe: passe ? passe:0,
                    currentPlayer: findNextPlayer(state, state.currentPlayer)
                };
            });
            component.dispatchEvent(Events.stateUpdated.buildEvent());
        }
    );

    component.addEventListener(
        Events.annonce.event,
        ({detail: annonce}) => {
            repository.withState(state => {
                return {
                    ...addHistoryItem(
                        setNextPlayer(state),
                        annonce
                    ),
                    annonce,
                    passe:0
                }
            });
            component.dispatchEvent(Events.stateUpdated.buildEvent())
        }
    );

    component.addEventListener(
        Events.contre.event,
        () => {
            repository.withState(state => ({
                    ...addHistoryItem(
                        setNextPlayer(state),
                        {player: state.currentPlayer, amount:'Contré'}
                    ),
                    annonce: {
                        ...state.annonce,
                        contre: {
                            player: state.currentPlayer
                        }
                    },
                    passe:0
                })
            );
            component.dispatchEvent(Events.stateUpdated.buildEvent())
        }
    );
    component.addEventListener(
        Events.surContre.event,
        () => {
            repository.withState(state => ({
                    ...addHistoryItem(
                        setNextPlayer(state),
                        {player: state.currentPlayer, amount:'Sur contré'}
                    ),
                    annonce: {
                        ...state.annonce,
                        surContre: {
                            player: state.currentPlayer
                        },
                        passe:0
                    }
                })
            );
            component.dispatchEvent(Events.stateUpdated.buildEvent())
        }
    );


    component.addEventListener(
        Events.annoncesValidated.event,
        () => {
            const {annonce} = repository.withState(state => {
                if(state.annonce)
                    return {
                        ...state,
                        stage: stages.maine
                    };
                else return initNextMaine(state)
            });
            const eventBuilder = annonce ? Events.maineStarted : Events.stateUpdated;
            component.dispatchEvent(
                eventBuilder.buildEvent()
            );
        }
    );


    component.addEventListener(
        Events.undoAnnonce.event,
        () => {
            const eventLog = repository.getRepository().eventLog;
            repository.withState(state => {
                return {
                    ...state,
                    currentPlayer: state.players[state.firstStartPosition],
                    annonce: undefined,
                    history:[],
                    stage: stages.annonces,
                    passe:0
                };
            });
            dropAnnoncesToUndo(eventLog).map(({name, detail}) =>
                new CustomEvent(name, {detail})
            ).forEach(e =>
                component.dispatchEvent(e)
            );
            component.dispatchEvent(Events.stateUpdated.buildEvent())
        }
    );
};

const lToF = arrow => function (...args) {
    return arrow(this, ...args);
};

const computeScore = ({
                             annonce: {amount, player, contre, surContre},
                             positions, nsScore, ewScore, belote, capot, nsPenalty, ewPenalty
                         }) => {
    const nsBelote = belote === 'ns' ? 20 : 0;
    const ewBelote = belote === 'ew' ? 20 : 0;
    const announcedCapot = amount === 500;
    const pos = positions[player];
    const team = (pos === 'north' || pos === 'south') ? 'ns' : 'ew';
    const failScore = surContre && announcedCapot ? 2000 :
        contre && announcedCapot? 1000:
            surContre? 640:
                contre ? 320:
                    announcedCapot ? 500 : 160;
    const winScore= surContre && announcedCapot ? 2000 :
        contre && announcedCapot? 1000:
            surContre? 640:
                contre ? 320:
                    announcedCapot ? 500 : 250;

    const _nsScore = nsPenalty ? 0: ewPenalty ? failScore :
        team === 'ns' && capot ? 162 :
            capot? 0 :
                (nsScore !== undefined ? Number(nsScore) : 162 - ewScore)
    ;
    const _ewScore = ewPenalty ? 0 : nsPenalty ? failScore :
        team === 'ew' && capot ? 162 :
            capot ? 0 :
                (ewScore !== undefined ? Number(ewScore) : 162 - nsScore);
    const validForm = !(_nsScore < 0 || _ewScore < 0);
    const nsFail = nsPenalty || validForm && (
        team === 'ew' && contre ? _ewScore + ewBelote >= amount :
            team==='ns' && announcedCapot ? !capot : team === 'ns' && _nsScore + nsBelote < amount
    );
    const ewFail = ewPenalty || validForm && (
        team === 'ns' && contre ? _nsScore + nsBelote >= amount:
            team === 'ew' && announcedCapot ? ! capot : team==='ew' && _ewScore + ewBelote < amount
    );
    const nsPoints = team === 'ns' && capot ?
        winScore + nsBelote + ewBelote:
        capot? 0: Math.round(_nsScore / 10) * 10 + nsBelote;
    const ewPoints = team === 'ew' && capot ?
        winScore + nsBelote + ewBelote:
        capot? 0: Math.round(_ewScore / 10) * 10 + ewBelote;

    const effectiveNsScore = nsFail ? 0 : ewFail ? failScore + ewBelote + nsBelote : nsPoints;
    const effectiveEwScore = ewFail ? 0 : nsFail ? failScore + nsBelote + ewBelote : ewPoints;


    return {
        nsScore: _nsScore,
        ewScore: _ewScore,
        nsFail,
        ewFail,
        effectiveEwScore,
        effectiveNsScore,
        validForm
    };
};

const maineLogic = (component, repository) => {

    const maineRoles = ({annonce: {player}, positions}) => {
        const position = positions[player];
        return ['north', 'south'].includes(position) ? ['ns', 'ew'] : ['ew', 'ns'];
    };

    const appendScore = ({score = {maines: [], total: {ns: 0, ew: 0}}}, maine) => {
        score.maines.push(maine);
        score.total = score.maines.reduce(
            ({ns: nsTotal, ew: ewTotal}, {ns, ew}) => ({
                ns: nsTotal + ns,
                ew: ewTotal + ew
            })
        );
        return score;
    };



    component.addEventListener(
        Events.maineFinished.event,
        ({detail: maine}) => {
            repository.withState(state => {
                const score = appendScore(state, maine);
                return {
                    ...initNextMaine(state),
                    score
                }
            });
            component.dispatchEvent(Events.annoncesStarted.buildEvent());
        });





    component.addEventListener(
        Events.maineNsScoreEntered.event,
        ({detail:{nsScore=0,belote, capot, nsPenalty, ewPenalty}}) =>
            repository.withState(({annonce,positions} ) => {
                component.dispatchEvent(
                    Events.maineScoreComputed.buildEvent(
                        computeScore({annonce, positions, nsScore, belote, capot, nsPenalty, ewPenalty})
                    )
                )

            })
    );
    component.addEventListener(
        Events.maineEwScoreEntered.event,
        ({detail: {ewScore=0, belote, capot, nsPenalty, ewPenalty}}) =>
            repository.withState(({annonce,positions} ) => {
                component.dispatchEvent(
                    Events.maineScoreComputed.buildEvent(
                        computeScore({annonce, positions, ewScore, belote, capot, nsPenalty, ewPenalty})
                    )
                )

            })

    );
};



const logic = {
    logicComponent: {},
    start : (app, stateRepository) =>{

        logic.logicComponent = app.createComponent('logic');

        newGameLogic(logic.logicComponent, stateRepository);
        annoncesLogic(logic.logicComponent, stateRepository);
        maineLogic(logic.logicComponent, stateRepository);

        app.addEventListener(
            Events.gameStarted.event,
            () => stateRepository.withState(state => {
                state.currentPlayer = state.players[state.firstStartPosition];
                state.stage = stages.annonces;
                logic.logicComponent.dispatchEvent(Events.annoncesStarted.buildEvent());
                return state;
            })
        );

        logic.logicComponent.addEventListener(
            Events.newGame.event,
            () => stateRepository.withState(state => {
                const {annonce, score, passe, currentPlayer, ...rest} = state;
                return {
                    ...verifyNewGameDefinition(rest),
                    stage: stages.newGameDefinition
                };
            })
        );

        logic.logicComponent.addEventListener(
            Events.dummy.event,
            () => console.log('Logic: dummy')
        )


    }
};

export {dropAnnoncesToUndo, computeScore};

export default logic;
