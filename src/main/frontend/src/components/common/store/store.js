import {REMOVE_GENERIC_ERROR, SHOW_GENERIC_ERROR, showGenericError} from "./actions";

export const INITIAL_STATE = {error: undefined};

const reducer = (state = INITIAL_STATE, action) => {
    //console.log('reducer', action)

    switch (action.type) {
        case SHOW_GENERIC_ERROR:
            return {...state, error: action.error};
        case REMOVE_GENERIC_ERROR:
            return {...state, error: undefined};
        default:
            return state;
    }
}

export default reducer;

