import Events from './events.js';

const buildRepository = ({eventLog, state}) => {
    const lastIndex = () =>
        eventLog.reduce(
            (acc, {id}) => id > acc ? id : acc,
            -1
        );
    return {
        eventLog,
        state: {
            ...state,
            upToDate : () => lastIndex() === state.index,

        },
        lastIndex: lastIndex,
        nextIndex: () => {
            const idx = lastIndex();
            return idx === -1 ? 0 : idx + 1;
        }

    }
};





const defaultStorageProvider = {
    load: () => localStorage.getItem('stateRepository'),
    save: repository => localStorage.setItem('stateRepository', JSON.stringify(repository)) ,
    reset: () => localStorage.removeItem('stateRepository')
};

const stateRepositoryBuilder = (app, storageProvider = defaultStorageProvider) => {
    const getRepository = () => {
        let repository = storageProvider.load();
        if (repository !== null && repository !== '') return buildRepository(
            JSON.parse(repository)
        );

        repository = buildRepository({eventLog: [], state: {}});
        storageProvider.save(repository);
        return repository;
    };

    const saveState = state => {
        if(!state) return; // no state provided --> exit
        const repository = getRepository();
        repository.state = state;
        storageProvider.save(repository);
        return state;
    };

    const storeEvent = e => {
        console.log('Event : ', e);

        const repository = getRepository();

        const event = {
            id: repository.nextIndex(),
            date: new Date().toISOString(),
            name: e.type
        };
        if (e.detail) event.detail = e.detail;
        repository.eventLog.push(event);
        storageProvider.save(repository);

    };


    if (storageProvider.load() === null) {
        console.log('State not found -> new game');
    }
    const component = app.createComponent('stateRepository');
    component.addEventListener(
        Events.dummy.event,
        () => console.log('StateRepo: dummy')
    );

    Events.all().forEach(e => {
        component.addEventListener(e, storeEvent);
    });

    return {
        stateComponent: component,
        getRepository: getRepository,
        save: storageProvider.save,
        reset:storageProvider.reset,
        saveState: saveState,
        withState: tx => {
            const state = getRepository().state;
            return saveState(tx(state));
        }
    };
};


export const stages = {
    newGameDefinition: 'newGameDefinition',
    annonces: 'annonces',
    annoncesEnd: 'annoncesEnd',
    maine: 'maine'
};



export default stateRepositoryBuilder;
