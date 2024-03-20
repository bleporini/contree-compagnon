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
                const passe = state.passe ? state.passe +1: 1;
                if ((state.annonce && passe === 3) || passe > 3){
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



const computeScore = ({
                          annonce: {amount, player, contre, surContre},
                          positions, nsScore, ewScore, belote, capot, nsPenalty, ewPenalty
                      }) => {
    const nsBelote = belote === 'ns' ? 20 : 0;
    const ewBelote = belote === 'ew' ? 20 : 0;
    const announcedCapot = amount === 500;
    const pos = positions[player];
    const team = (pos === 'north' || pos === 'south') ? 'ns': 'ew';
    if(nsPenalty || ewPenalty) return {
        effectiveNsScore: nsPenalty ? 0 : 160,
        effectiveEwScore: ewPenalty ? 0 : 160,
        validForm: true
    };
    const score = () => {
        if (capot)
            if (team === 'ns') return {
                _nsScore: 162 + nsBelote,
                _ewScore: 0
            }; else return {
                _nsScore: 0,
                _ewScore: 162 + ewBelote
            };
        else return {
            _nsScore: (nsScore !== undefined ? Number(nsScore) : 162 - ewScore) + nsBelote,
            _ewScore: (ewScore !== undefined ? Number(ewScore) : 162 - nsScore) + ewBelote
        }
    };
    const {_nsScore, _ewScore} = score();
    const validForm = !(_nsScore < 0 || _ewScore < 0);
    const nsFail = validForm && team === 'ns' && _nsScore < (amount===500?162+nsBelote:amount);
    const ewFail = validForm && team === 'ew' && _ewScore < (amount===500?162+ewBelote:amount);
    if(contre) {
        const inStake = announcedCapot && surContre? 2000:
            announcedCapot ? 1000 :
                surContre ? 640 : 320;
        return {
            nsScore: _nsScore,
            ewScore: _ewScore,
            effectiveNsScore: validForm && (ewFail || (team === 'ns' && !nsFail)) ? inStake + ewBelote + nsBelote : 0,
            effectiveEwScore: validForm && (nsFail || (team === 'ew' && !ewFail)) ? inStake + ewBelote + nsBelote : 0,
            nsFail,
            ewFail,
            validForm
        };
    }
    if(capot){ //TODO refactor to unify capot and contre sections
        const score = (
            announcedCapot && surContre ? 2000 :
                announcedCapot && contre ? 1000 :
                    announcedCapot ? 500 : 250
        ) + nsBelote + ewBelote;
        return {
            effectiveNsScore: team === 'ns' ? score : 0,
            effectiveEwScore: team === 'ew' ? score : 0,
            validForm:true
        }
    }
    const inStake = (amount === 500?amount: 160);
    const effectiveNsScore = nsFail ? 0 : ewFail ? inStake+ewBelote+nsBelote : Math.round(_nsScore/10)*10 ;
    const effectiveEwScore = ewFail ? 0 : nsFail ? inStake+nsBelote+ewBelote : Math.round(_ewScore/10)*10 ;
    return {
        nsScore: _nsScore,
        ewScore: _ewScore,
        effectiveNsScore,
        effectiveEwScore,
        nsFail,
        ewFail,
        validForm
    }

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
