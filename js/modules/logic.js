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


    component.addEventListener(
        Events.passe.event,
        () => {
            repository.withState(state => {
                const passe = state.annonce && state.passe ===3 ? state.passe : state.passe +1;
                if (passe >= 3){
                    return {
                        ...state,
                        passe,
                        stage:stages.annoncesEnd
                    }
                }else return {
                    ...state,
                    passe: passe ? passe:0,
                    currentPlayer: findNextPlayer(state, state.currentPlayer)
                };
            });
            component.dispatchEvent(Events.stateUpdated.buildEvent());
        }
    );

    component.addEventListener(
        Events.annonce.event,
        ({detail: {amount, suit, player}}) => {
            repository.withState(state => {
                return {
                    ...setNextPlayer(state),
                    annonce: {
                        amount, suit, player
                    },
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
                    ...setNextPlayer(state),
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
                    ...setNextPlayer(state),
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
        ({detail: {belote, score: maineScore}}) => {
            repository.withState(state => {
                const [attacker, defender] = maineRoles(state);
                const {annonce:{contre=false, surContre=false}} = state;
                const contreAmount = contre && surContre ? 640 : contre ? 320 : 0;
                const {winnerScore, loserScore} = (() => {
                    if (contre){
                        const winnerScore = contreAmount + (belote === attacker ? 20 : 0);
                        const loserScore = belote === defender ? 20 : 0;
                        return {winnerScore, loserScore};
                    }else {
                        const winnerScore = Math.round(maineScore / 10) * 10 + (belote === attacker ? 20 : 0);
                        const remainder = 162 - maineScore;
                        const loserScore = Math.round(remainder / 10) * 10 + (belote === defender ? 20 : 0);
                        return {winnerScore, loserScore};
                    }
                })();
                const maine = {};
                maine[attacker] = winnerScore;
                maine[defender] = loserScore;
                const score = appendScore(state, maine);
                return {
                    ...initNextMaine(state),
                    score
                }
            });
            component.dispatchEvent(Events.annoncesStarted.buildEvent());
        });

    component.addEventListener(
        Events.maineFinishedDedans.event,
        ({detail: {belote}}) => {
            repository.withState(state => {
                const [attacker, defender] = maineRoles(state);
                const {annonce:{amount,contre=false, surContre=false}} = state;
                const contreAmount = amount > 180 && contre && surContre ? 2000 :
                    amount > 180 && contre ? 1000 :
                    contre && surContre ? 640 :
                    contre ? 320 : 0;
                const maine = {};
                maine[attacker] = 0;
                maine[defender] = (contre? contreAmount : 160) + (belote ? 20 : 0);
                return {
                    ...initNextMaine(state),
                    score: appendScore(state, maine)
                };
            });
            component.dispatchEvent(Events.annoncesStarted.buildEvent());
        }
    );


    //TODO: manage sur-contre
    component.addEventListener(
        Events.maineFinishedCapot.event,
        ({detail: {belote}}) => {
            repository.withState(state => {
                const [attacker, defender] = maineRoles(state);
                const maine = {};
                const {annonce:{amount:_amount,contre=false, surContre=false}} = state;
                const amount = _amount >= 180 && contre && surContre ? 2000:
                    _amount >= 180 && contre ? 1000 : 
                        contre ? 320 : _amount;
                maine[attacker] = (amount > 250 ? amount: 250) + (belote ? 20 : 0);
                maine[defender] = 0;
                return {
                    ...initNextMaine(state),
                    score: appendScore(state, maine)
                };
            });
            component.dispatchEvent(Events.annoncesStarted.buildEvent());
        }
    );

    const penalty = maine => {
        repository.withState(state => {
            return {
                ...initNextMaine(state),
                score: appendScore(state, maine)
            }
        });
        component.dispatchEvent(Events.annoncesStarted.buildEvent());
    };


    component.addEventListener(
        Events.maineFinishedNsPenalty.event,
        () => penalty({ns: 0, ew: 160})
    );
    component.addEventListener(
        Events.maineFinishedEwPenalty.event,
        () => penalty({ns: 160, ew: 0})
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

export {dropAnnoncesToUndo};

export default logic;
