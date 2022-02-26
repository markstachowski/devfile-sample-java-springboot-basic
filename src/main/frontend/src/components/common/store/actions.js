


export const SHOW_GENERIC_ERROR = 'showGenericError';
export const REMOVE_GENERIC_ERROR = 'removeGenericError';


export function showGenericError(error) {

    let customError = {};
    if ( error && error.response) {
        //console.log('error.response', error.response.data);
        customError['status'] = error.response.status;
        customError['statusText'] = error.response.statusText;
        customError['data'] = error.response.data;
    } else {
        //unknown error object
        customError['unknownError'] = error.toString();
    }
    return {type: SHOW_GENERIC_ERROR, error: customError}
}


export function removeGenericError(error) {
    return {type: REMOVE_GENERIC_ERROR, error: undefined}
}
