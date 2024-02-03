import stateRepositoryBuilder from './modules/state.js';
import ui from './modules/ui.js';
import logic from './modules/logic.js';

/*
document.onreadystatechange = () => {
    if (document.readyState === 'complete')
        start();
};
*/



const appRoot = document.createElement('app');
const app = document.createElement('endpoint');
appRoot.appendChild(app);
document.body.appendChild(appRoot);


app.createComponent = name => {
    const component = document.createElement(name);
    const firstChild = appRoot.firstChild;
    const originalDiaptch = component.dispatchEvent.bind(component);
    component.dispatchEvent = event => {
        event.bubbles ?
            firstChild.dispatchEvent(event) :
            originalDiaptch(event);
    };
    appRoot.removeChild(firstChild);
    component.appendChild(firstChild);
    appRoot.appendChild(component);
    return component;
};

const start = () => {

    console.log('Starting');
    const stateRepository = stateRepositoryBuilder(app);
    app.state = () => {
        const state = stateRepository.getRepository().state;
        return {
            ...state,
            setStage: newStage => {
                const state1 = stateRepository.getRepository().state;
                state1.stage = newStage;
                stateRepository.saveState(state1);
            },
        };
    };
    logic.start(app, stateRepository);
    ui.start(app);

};

start();