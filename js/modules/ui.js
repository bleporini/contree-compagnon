import Events from './events.js';
import {stages} from "./state.js";


const downloadDebug = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' +
        localStorage.getItem('stateRepository'));
    element.setAttribute('download', 'debug.json');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

const loadWelcome = (app) => {
    document.getElementById('debug').onclick = downloadDebug;

    const navigator = document.getElementById('navigator');
    document.getElementById('start-new-game').onclick = () => {
        const evt = Events.newGame.buildEvent();
        app.dispatchEvent(evt);
        navigator.resetToPage('game-start.html');
    };
};

const setButtonDisable = (btn, disable) => () => {
    const isDisabled = btn.classList.contains('disabled');
    if (disable && ! isDisabled) btn.classList.toggle('disabled');
    else if(isDisabled && !disable) btn.classList.toggle('disabled');
};


const loadNewGame = (app) =>{
    document.getElementById('debug').onclick = downloadDebug;

    const state = app.state();
    const startBtn = document.getElementById('startGame');
    startBtn.onclick = () =>
        app.dispatchEvent(Events.gameStarted.buildEvent());
    startBtn.disabled = !state.teamCompleted;

    document.getElementById("reset").onclick = () => app.dispatchEvent(Events.reset.buildEvent());

    app.addEventListener(
        Events.teamCompleted.event,
        () => startBtn.disabled = false
    );

    app.addEventListener(
        Events.teamNotCompleted.event,
        () => startBtn.disabled = true
    );


    ['north', 'south', 'east', 'west'].forEach(e => {
        const input = document.getElementById(`${e}`);
        input.value = state.players && state.players[e] ? state.players[e] : '';
        const label = Array.from(
            document.getElementById(`${e}Partance`).labels
        ).find(l => l.classList.contains('center'));
        label.innerHTML = input.value ? input.value : label.innerHTML;


        input.onchange = () => {
            label.innerHTML = input.value;
            const evt = Events[`${e}PlayerDefined`].buildEvent(input.value);
            app.dispatchEvent(evt);
        };
        input.onkeyup = ({target:{value}}) =>
            label.innerHTML = value ? value : label.innerHTML;


        document.getElementById(`${e}Partance`).onchange = () =>
            app.dispatchEvent(Events[`${e}StartingDefined`].buildEvent());
    });

    document.getElementById('newGameForm').partance.value =
        state.firstStartPosition ? state.firstStartPosition : '';


};

const suitElement = s =>
    `<i class="bi bi-suit-${s}-fill ${['heart', 'diamond'].includes(s) ? 'text-danger' : ''}"></i>`;

const contreSign = '<i class="fa-solid fa-circle-exclamation" style="color: orange;"></i>';
const surContreSign = '<i class="fa-solid text-danger fa-triangle-exclamation"></i>';

const loadScore = (app) => {
    document.getElementById('debug').onclick = downloadDebug;

    const {
        players:{north, south, east, west},
        score:{maines, total:{ns:nsTotal, ew:ewTotal}} = {maines:[], total:{ns:0, ew:0}}
    } = app.state();
    document.getElementById('northsouth').innerHTML = `${north} / ${south}`;
    document.getElementById('eastwest').innerHTML = `${east} / ${west}`;
    const scoreBody = document.getElementById('scoreBody');
    const createScoreRow = ({ns, ew}) => {
        const row = document.createElement('tr');
        const nsCell = document.createElement('td');
        const ewCell = document.createElement('td');
        nsCell.append(ns);
        ewCell.append(ew);
        row.append(nsCell, ewCell);
        scoreBody.append(row);
    };
    maines.forEach(createScoreRow);
    document.getElementById('nsTotal').innerHTML = nsTotal;
    document.getElementById('ewTotal').innerHTML = ewTotal;
};

const loadAnnonces = (app, container) => {
    document.getElementById('debug').onclick = downloadDebug;
    const annoncesBtns = Array.from(
        document.querySelectorAll('ons-button.annonce')
    );
    const contreButton = document.getElementById('contre');
    const surContreButton = document.getElementById('surContre');
    const annonceElem = document.getElementById('currentAnnonce');
    const okButton = document.getElementById('okAnnonces');
    const undoButton = document.getElementById('undoAnnonceBtn');
    const passeButton = document.getElementById('passe');

    document.getElementById('newGame').onclick = () =>
        app.dispatchEvent(
            Events.newGame.buildEvent()
        );

    const repaint = () => {
        const state = app.state();
        const {currentPlayer, players, firstStartPosition} = state;
        document.getElementById('currentPlayer').innerHTML = currentPlayer;
        document.getElementById('partance').innerHTML = players[firstStartPosition];


        const isCurrentPlayerInTheSameTeamAsAnnonce = () => {
            const {
                currentPlayer,
                annonce: {player, contre: {player: contrePlayer} = {player: undefined}},
                players: {north, south, east, west}
            } = state;
            const annoncePlayer = contrePlayer ? contrePlayer : player;
            const teams = [[north, south], [east, west]];
            const team = teams.find(t => t.includes(currentPlayer));
            const teamMate = team.find(m => m !== currentPlayer);
            return teamMate === annoncePlayer || currentPlayer === annoncePlayer;
        };

        const paintRegularAnnonce = (amount, suit, player) => {
            const toDisable = [
                surContreButton,
                okButton,
                ...annoncesBtns.filter(btn =>
                    Number(btn.getAttributeNode('data-amount').value) <= amount
                )
            ];
            const toEnable = [
                passeButton,
                ...annoncesBtns.filter(btn =>
                    Number(btn.getAttributeNode('data-amount').value) > amount)
            ];

            if (isCurrentPlayerInTheSameTeamAsAnnonce()) toDisable.push(contreButton);
            else toEnable.push(contreButton);

            toDisable.forEach(btn => btn.disabled =  true);
            toEnable.forEach(btn => btn.disabled=false);

            annonceElem.innerHTML =
                `${player} : ${amount} ${suitElement(suit)}`;
        };

        const paintContre = (amount, suit, player, contrePlayer) => {
            const toDisable = [okButton, contreButton, ...annoncesBtns];
            const toEnable = [passeButton];
            if (isCurrentPlayerInTheSameTeamAsAnnonce()) toDisable.push(surContreButton);
            else toEnable.push(surContreButton);

            toDisable.forEach(btn => btn.disabled=true);
            toEnable.forEach(btn => btn.disabled=false);

            annonceElem.innerHTML =
                `${player} : ${amount} ${suitElement(suit)}, ${contreSign} Contré par ${contrePlayer}`;
        };

        const paintSurContre = (amount, suit, player, contrePlayer, surContrePlayer) => {
            [okButton, contreButton, surContreButton, ...annoncesBtns]
                .forEach(btn => btn.disabled=true);

            setButtonDisable(passeButton, false)();
            annonceElem.innerHTML =
                `${player} : ${amount} ${suitElement(suit)},
                            ${surContreSign} Contré par ${contrePlayer}, surcontré par ${surContrePlayer}`;
        };

        const paintAnnoncesEnd = () => {
            [
                contreButton,
                surContreButton,
                passeButton,
                ...annoncesBtns
            ].forEach(btn => btn.disabled=true);

            [okButton, undoButton].forEach(btn => btn.disabled=false);
        };

        if (state.annonce) {
            const {amount, suit, player, contre, surContre} = state.annonce;
            if (surContre) paintSurContre(amount, suit, player, contre.player, surContre.player);
            else if (contre) paintContre(amount, suit, player, contre.player);
            else paintRegularAnnonce(amount, suit, player);
        } else {
            annonceElem.innerHTML = 'Pas d\'annonce';
            [surContreButton, contreButton]
                .forEach(btn => btn.disabled=true);
            [passeButton, ...annoncesBtns]
                .forEach(btn => btn.disabled=false);
        }
        if (state.stage === stages.annoncesEnd) paintAnnoncesEnd();

    };
    repaint();

    passeButton.onclick = () =>
        app.dispatchEvent(
            Events.passe.buildEvent()
        );

    app.addEventListener(
        Events.stateUpdated.event,
        () => repaint()
    );

    annoncesBtns.forEach(b =>
        b.onclick = () => {
            const amount = Number(b.getAttributeNode('data-amount').value);

            app.dispatchEvent(
                Events.annonce.buildEvent({
                    amount: amount,
                    suit: b.getAttributeNode('data-suit').value,
                    player: app.state().currentPlayer
                })
            );
        }
    );
    undoButton.onclick = () =>
        app.dispatchEvent(
            Events.undoAnnonce.buildEvent()
    );

    contreButton.onclick = () =>
        app.dispatchEvent(
            Events.contre.buildEvent()
    );
    surContreButton.onclick = () =>
        app.dispatchEvent(
            Events.surContre.buildEvent()
    );
    okButton.onclick = () => {
        app.dispatchEvent(
            Events.annoncesValidated.buildEvent()
        );
    };

    /*    loadFragmentBuilder(container)('annonces.html')
            .then(() => loadScore(app, document.getElementById('score'))).then(() => {



                }
            })*/;
};

const loadMaine = (app, container) => {
    document.getElementById('debug').onclick = downloadDebug;

    const {
        firstStartPosition,
        annonce:{amount, suit, player, contre, surContre},
        players:{north, south, east, west},
        players
    }= app.state();
    const scoreBtns = Array.from(
        document.querySelectorAll('input.score')
    );
    const beloteRadios = Array.from(
        document.querySelectorAll('ons-radio.belote')
    );
    const beloteLabels = Array.from(
        document.querySelectorAll('label.belote')
    );
    const beloteCheck = document.getElementById('belote');
    beloteRadios.forEach(b => b.disabled = true);
    beloteLabels.forEach(l => l.classList.toggle('disabled'));
    beloteCheck.onchange = e => {
        beloteLabels.forEach(l => l.classList.toggle('disabled'));
        return beloteRadios.forEach(b => b.disabled = !e.target.checked);
    };

    const [p1, p2] = [[north, south], [east, west]].find(t => t.includes(player));
    const contreStr = surContre ? ' Sur contré' : contre ? 'Contré' : '';
    document.getElementById('annonce').innerHTML =
        `${amount === 500? 'Capot' : amount} ${suitElement(suit)} ${p1} / ${p2}${contreStr}`;
    document.getElementById('partance').innerHTML = players[firstStartPosition];
    document.getElementById('nsTeamPenalty').innerHTML = `${north} / ${south}`;
    document.getElementById('ewTeamPenalty').innerHTML = `${east} / ${west}`;
    document.getElementById('nsBelote').labels[0].innerHTML = `${north} / ${south}`;
    document.getElementById('ewBelote').labels[0].innerHTML = `${east} / ${west}`;
    const nsScore = document.getElementById('nsScore');
    const ewScore = document.getElementById('ewScore');
    const submit = document.getElementById('sumbitMaine');
    nsScore.labels[0].innerHTML = `${north} / ${south}`;
    ewScore.labels[0].innerHTML = `${east} / ${west}`;
    let nsScoreVal = nsScore.value;
    let ewScoreVal = ewScore.value;

    const enterScoreBtn = document.getElementById('enterScore');
    const capotBtn = document.getElementById('score250');
    const nsPenalty = document.getElementById('score160ns');
    const ewPenalty = document.getElementById('score160ew');
    const eventDetail = () => ({
        nsScore: nsScore.value === '' ? 0: nsScore.value ,
        ewScore: ewScore.value === '' ? 0 : ewScore.value,
        belote: beloteCheck.checked && beloteRadios.find(b => b.checked) ?
            beloteRadios.find(b => b.checked).dataset.team : false,
        capot: capotBtn.checked,
        nsPenalty: nsPenalty.checked,
        ewPenalty: ewPenalty.checked
    });

    scoreBtns.forEach(b =>
        b.addEventListener('click', () => {
            const disabled = ! enterScoreBtn.checked;
            nsScore.disabled = disabled;
            ewScore.disabled = disabled;
        })
    );

    nsScore.onkeyup = () => {
        if (nsScoreVal !== nsScore.value) {
            nsScoreVal = nsScore.value;
            app.dispatchEvent(
                Events.maineNsScoreEntered.buildEvent(eventDetail())
            );
        }
    };
    ewScore.onkeyup = () => {
        if (ewScoreVal !== ewScore.value) {
            ewScoreVal = ewScore.value;
            app.dispatchEvent(
                Events.maineEwScoreEntered.buildEvent(eventDetail())
            );
        }
    };
    [...beloteRadios, beloteCheck, capotBtn, nsPenalty, ewPenalty, enterScoreBtn].map(b =>
        b.onclick = () => app.dispatchEvent(
            Events.maineNsScoreEntered.buildEvent(eventDetail())
        )
    );

    const effectiveNsBadge = document.getElementById('effectiveNsScore');
    const effectiveEwBadge = document.getElementById('effectiveEwScore');

    app.addEventListener(
        Events.maineScoreComputed.event,
        ({detail: {nsScore: ns, ewScore: ew, nsFail, ewFail, effectiveNsScore, effectiveEwScore, validForm}}) => {
            nsScore.value = ns;
            ewScore.value = ew;
            if(nsFail) nsScore.classList.add('text-bg-danger'); else nsScore.classList.remove('text-bg-danger');
            if(ewFail) ewScore.classList.add('text-bg-danger'); else ewScore.classList.remove('text-bg-danger');
            effectiveNsBadge.innerHTML = effectiveNsScore;
            effectiveEwBadge.innerHTML = effectiveEwScore;
            const badgeColors = (badge, fail) => {
                if(!validForm){
                    badge.classList.remove('text-bg-primary');
                    badge.classList.remove('text-bg-danger');
                    badge.classList.add('text-bg-warning');
                }else if (fail) {
                    badge.classList.remove('text-bg-primary');
                    badge.classList.remove('text-bg-warning');
                    badge.classList.add('text-bg-danger');
                } else {
                    badge.classList.remove('text-bg-danger');
                    badge.classList.remove('text-bg-warning');
                    badge.classList.add('text-bg-primary');
                }


            };
            badgeColors(effectiveNsBadge, nsFail);
            badgeColors(effectiveEwBadge, ewFail);
            submit.disabled = ! validForm;
        }
    );


    const maineForm = document.forms.maineForm;
    maineForm.addEventListener('submit', e => {
        e.preventDefault();
        app.dispatchEvent(
                Events.maineFinished.buildEvent({
                    ns: Number(effectiveNsBadge.innerHTML),
                    ew: Number(effectiveEwBadge.innerHTML)
                })
            );
    });
};



const ui = {
    start: app => {
        const component = app.createComponent('ui');
        const container = document.getElementById('container');
        const navigator = document.getElementById('navigator');

        app.addEventListener(
            Events.newGame.event,
            (e) => navigator.resetToPage('game-start.html')
        );
        app.addEventListener(
            Events.reset.event,
            (e) => navigator.resetToPage('welcome.html')

        );

        app.addEventListener(
            Events.maineStarted.event,
            () => navigator.resetToPage('maine.html')
        );


        app.addEventListener(
            Events.annoncesStarted.event,
            (e) => navigator.resetToPage('annonces.html')
        );

        document.addEventListener('init', ({target: {id: pageId}}) => {
            switch (pageId) {
                case 'welcome':
                    loadWelcome(app);
                    break;
                case 'game-start':
                    loadNewGame(app);
                    break;
                case '_annonces':
                    loadAnnonces(app);
                    break;
                case 'score':
                    loadScore(app);
                    break;
                case '_maine':
                    loadMaine(app);
                    break;
                default:
            }

        });
        ons.ready(() => {
            const {stage} = app.state();
            switch (stage){
                case stages.newGameDefinition:
                    navigator.pushPage('game-start.html');
                    break;
                case stages.annonces:
                case stages.annoncesEnd:
                    navigator.resetToPage('annonces.html');
                    break;
                case stages.maine:
                    navigator.resetToPage('maine.html');
                    break;
                default:
                    navigator.pushPage('welcome.html');

            }

        });


    }

};

export default ui;