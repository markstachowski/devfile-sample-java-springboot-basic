import axios from 'axios';
import {showGenericError} from "./store/actions";

let dispatchRef = null;

const setDispatchRef = (ref) => {
    dispatchRef = ref;
}
const postData = async (url, data, setCallBack, errorCallBack) => {
    const endpoint = process.env.PUBLIC_URL + url;
    let startDate = new Date();
    let receivedDate;
    const headers = {
        'Content-Type': 'application/json'
    };
    await axios.post(endpoint, data, {headers}).then((response) => {
        receivedDate = new Date();
        setCallBack(response.data);
    }).catch(error => {
        handleError(error);
    }).finally(() => {
        let endDate = new Date();
        console.log(url + ': time: ' + endDate - startDate, (receivedDate - startDate));
    })
}

const putData = async (url, params, data, setCallBack, errorCallBack) => {
    const endpoint = process.env.PUBLIC_URL + url;
    let startDate = new Date();

    await axios.put(endpoint, data, {params}).then((response) => {
        setCallBack();
    }).catch(error => {
        handleError(error);
    }).finally(() => {
        let endDate = new Date();
        console.log(url + ': time: ' + endDate - startDate);
    })
}

const getData = async (url, params, setDataCallBack, errorCallBack) => {
    //validate response
    // if response is good, call callback
    const endpoint = process.env.PUBLIC_URL + url;
    let startDate = new Date();
    let receivedDate;

    await axios.get(endpoint, {params}).then((response) => {
        receivedDate = new Date()
        let responseDate = response.data.toJSON;
        setDataCallBack(response.data);
        return responseDate;
    }).catch(error => {
        handleError(error);
    }).finally(() => {
        let endDate = new Date();
        console.log(url + ': time: ' + (endDate - startDate), (receivedDate - startDate));
    })
}

const UNAUTHORIZED = 401;

const handleError = (error) => {
    const responseData = error.response && error.response.data ? error.response.data : null;
    if (responseData && responseData.errorCode === UNAUTHORIZED) {
        window.location = responseData.loginUrl + window.location.pathname;
    } else {
        console.log(error);
        dispatchRef(showGenericError(error));
    }
}

export {postData, putData, getData, setDispatchRef}