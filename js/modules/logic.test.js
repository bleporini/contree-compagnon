/**
 * @jest-environment jsdom
 */

import logic from './logic.js';
import stateRepositoryBuilder from './state.js';
import Events from "./events.js";
import repo from './undo_test.json';
import {dropAnnoncesToUndo} from './logic.js';

const domEvent2RepoEvent = ({type: name, detail = undefined}) => ({name, detail});

test('drop 1 annonce', () => {
    const eventLog = [
        Events.annoncesStarted.buildEvent(),
        Events.annonce.buildEvent({player: 'Brice', amount: 80, suit: 'heart'}),
        Events.stateUpdated.buildEvent(),
        Events.annonce.buildEvent({player: 'Alessandra', amount: 90, suit: 'diamond'}),
        Events.stateUpdated.buildEvent(),
        Events.annonce.buildEvent({player: 'Calypso', amount: 100, suit: 'spade'}),
        Events.stateUpdated.buildEvent(),
        Events.undoAnnonce.buildEvent()
    ].map(domEvent2RepoEvent);
    const result = dropAnnoncesToUndo(eventLog);
    const defaultAnnonce = {amount: -1, player: '', suit: ''}
    const [
        {name: stateUpdatedEvt},
        {name: stateUpdatedEvt2},
        {name: typeAnnonce, detail: {amount, player, suit} = defaultAnnonce},
        ...tail] = result.reverse();
    expect(stateUpdatedEvt).toBe(
        Events.stateUpdated.event
    );
    expect(typeAnnonce).toBe(
        Events.annonce.event
    );
    expect(amount).toBe(
        90
    );
    expect(suit).toBe(
        'diamond'
    );
    expect(player).toBe(
        'Alessandra'
    );

});

test('drop 2 annonces', () => {
    const eventLog = [
        Events.annoncesStarted.buildEvent(),
        Events.annonce.buildEvent({player: 'Brice', amount: 80, suit: 'heart'}),
        Events.stateUpdated.buildEvent(),
        Events.annonce.buildEvent({player: 'Alessandra', amount: 90, suit: 'diamond'}),
        Events.stateUpdated.buildEvent(),
        Events.annonce.buildEvent({player: 'Calypso', amount: 100, suit: 'spade'}),
        Events.stateUpdated.buildEvent(),
        Events.undoAnnonce.buildEvent(),
        Events.undoAnnonce.buildEvent()
    ].map(domEvent2RepoEvent);
    const result = dropAnnoncesToUndo(eventLog);
    const defaultAnnonce = { amount:-1, player: '', suit: ''}
    const [
        {name:stateUpdatedEvt},
        {name:stateUpdatedEvt2},
        {name:stateUpdatedEvt3},
        {name:typeAnnonce, detail:{amount, player, suit} = defaultAnnonce},
        ...tail] = result.reverse();
    expect(stateUpdatedEvt).toBe(
        Events.stateUpdated.event
    );
    expect(stateUpdatedEvt2).toBe(
        Events.stateUpdated.event
    );
    expect(stateUpdatedEvt3).toBe(
        Events.stateUpdated.event
    );
    expect(typeAnnonce).toBe(
        Events.annonce.event
    );
    expect(amount).toBe(
        80
    );
    expect(suit).toBe(
        'heart'
    );
    expect(player).toBe(
        'Brice'
    );

});

const app = document.createElement('endpoint');
let repositoryData;
app.createComponent = name => document.createElement(name);
const storageProvider = {
    load: () => JSON.stringify(repositoryData),
    save: (r) => repositoryData = r
};
const repository = stateRepositoryBuilder(app, storageProvider);

app.state = () => repositoryData.state;

logic.start(app, repository);

beforeEach(() => {
    repositoryData = JSON.parse(JSON.stringify(repo));
//    console.log('State before: ', repositoryData.state);
});

test('1st undo',
    () => {
        storageProvider.load = () => {
            const {eventLog, state} = repositoryData;
            return JSON.stringify({
                state,
                eventLog: [...eventLog, {name: Events.undoAnnonce.event}]
            });
        };
        logic.logicComponent.dispatchEvent(Events.undoAnnonce.buildEvent());
        
        expect(
            repositoryData.state.currentPlayer
        ).toBe('Alessandra');

        expect(
            repositoryData.state.annonce
        ).toEqual({
            amount: 90,
            suit: 'club',
            player: 'Calypso'
            })
    }
);

test('2nd undo',
    () => {
        storageProvider.load = () => {
            const {eventLog, state} = repositoryData;
            return JSON.stringify({
                state,
                eventLog: [...eventLog, {name: Events.undoAnnonce.event}, {name: Events.undoAnnonce.event}]
            });
        };
        // Need to react only on the second event for the test
        logic.logicComponent.dispatchEvent(Events.undoAnnonce.buildEvent());
        expect(
            repositoryData.state.currentPlayer
        ).toBe('Calypso');

        expect(
            repositoryData.state.annonce
        ).toEqual({
            amount: 80,
            suit: 'club',
            player: 'Brice'
            })
    }
);
