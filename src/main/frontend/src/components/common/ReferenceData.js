import {getData} from "./api";
const currencies = [
    {
        text: "All", id: ''
    },
    {
        text: "USD", id: 1
    },
    {
        text: "GBP", id: 2
    },
    {
        text: "EUR", id: 3
    },
    {
        text: "CAD", id: 4
    },
    {
        text: "AUD", id: 5
    }
];

const yesNoList = [
    {
        text: "All", id: ''
    },
    {
        text: "Yes", id: 'true'
    },
    {
        text: "No", id: 'false'
    }
];

export const getCurrencyList = () => {
    return currencies;
}

export const getYesNoList = () => {
    return yesNoList;
}

export const getVolumeBuckets =(setVolumeBucketCallBackHandler) => {
        getData('/api/gift-card-designations/volume-buckets', null, setVolumeBucketCallBackHandler).then((response) => {
                console.log("getVolumeMounts complete :" + JSON.stringify(response));
                //setVolumeBucketCallBackHandler(response);
        }).catch( (error) => {
                console.log(error);
        }).finally( ()=> {
                    console.log('getVolumeMounts complete');
            }
        );
}