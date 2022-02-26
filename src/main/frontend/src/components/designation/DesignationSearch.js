import * as React from "react"
import {useEffect, useState} from "react"
import {DateRangePicker} from "@progress/kendo-react-dateinputs";
import {Button} from "@progress/kendo-react-buttons";
import DateRangeEndDate from "../common/input/DateRangeEndDate";
import DateRangeStartDate from "../common/input/DateRangeStartDate";
import {Switch} from "@progress/kendo-react-inputs";
import {DropDownList} from "@progress/kendo-react-dropdowns";
import {Label} from "@progress/kendo-react-labels";
import {getData} from "../common/api";
import {getVolumeBuckets} from '../common/ReferenceData';
import {formatDate} from "../common/gridUtils";

const DesignationSearch = (props) => {

    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const defaultDates = {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date()
    };


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
    const includeNegativeDesig = ["Yes", "No", "Only negative value"];
    const [volumeBuckets, setVolumeBuckets] = useState();
    let defaultBucket = {
        "name": "All",
        "enabled": false,
        "doNotDisturb": true,
        "id": -1,
        "volumeBucketId": -1,
        "enabledInt": 0
    }
    const loadVolumeMounts = (response) => {
        let allBuckets = [defaultBucket, ...response]
        setVolumeBuckets(allBuckets);
    }


    useEffect(() => {
        getVolumeBuckets(loadVolumeMounts);
    }, []);


    const [dateRange, setDateRange] = useState(defaultDates);
    const [unassignedSwitchChecked, setUnassignedSwitchChecked] = useState(true);
    const [currency, setCurrency] = useState({value: currencies[1]});
    const [includeNegatives, setIncludeNegatives] = useState('No');
    const [filterToVolumes, setFilterToVolumes] = useState({
        value: defaultBucket
    });

    const [reload, setReload] = useState(new Date());
    const [params, setParams] = useState();


    let search = () => {
        if (dateRange.start === undefined || dateRange.end === undefined ||
            dateRange.start === null || dateRange.end === null) {
            return;
        }

        props.setLoaderCallBack(true)

        let params = {
            startDate: formatDate(dateRange.start),
            endDate: formatDate(dateRange.end),
            unassignedOnly: unassignedSwitchChecked
        };
        if (filterToVolumes.value.id > -1) {
            params = {...params, volumeBucket: filterToVolumes.value.id}
        }
        if (currency.value.text !== 'All') {
            params = {...params, currency: currency.value.text}
        }
        params = {...params, unassignedOnly: unassignedSwitchChecked}

        if (includeNegatives) {
            params = {...params, includeNegativeValue: includeNegatives}
        }

        setParams(params)
        getData('/api/gift-card-designations', params, props.setDataCallBack);

    };

    const resetToDefaults = () => {
        setCurrency({
            value: {
                text: 'USD',
                id: '1'
            }
        });
        setUnassignedSwitchChecked(true);
        setIncludeNegatives('No');
        setFilterToVolumes({value: defaultBucket});
    }

    let toggleSearchField = () => {
        if (showAdvancedSearch === true) {
            setShowAdvancedSearch(false);
        } else {
            setShowAdvancedSearch(true);
        }
    };

    const updateCurrency = (event) => {
        setCurrency({value: event.target.value});
    }

    const updateUnassigned = (event) => {
        setUnassignedSwitchChecked(event.target.value);
    }

    const updateIncludeNegatives = (event) => {
        setIncludeNegatives(event.target.value);
    }

    const updateFilterToVolumes = (event) => {
        if (event.target.value) {
            setFilterToVolumes({value: event.target.value});
        }
    }

    const updateDateRange = (dateRange, reload) => {
        console.log(dateRange)
        if (dateRange !== undefined) {
            setDateRange(dateRange);
            if (reload) {
                setReload(new Date());
            }
        }
    }

    /**
     * On change event on date field waits until all the components of date are entered.
     * but if you are changing an existing date, this event will be fired for each component change
     * using keyboard, for example if you are changing the day part using key board this event will be
     * fired for each day.
     * @param event
     */
    const onChangeDateRange = (event) => {
        //console.log('onChange' ,event)

        setDateRange(event.value);
        if (!event instanceof KeyboardEvent) {
            updateDateRange(event.value, true)
            console.log('reload,', event)
        } else {
            updateDateRange(event.value, false)
        }
    }

    /**
     * for keyboard date changes we wait until the focus moves out of date field.
     * @param event
     */
    const onBlurDateRange = (event) => {
        //console.log('onBlur' , event);
        //console.log('onBlur' , event.value);

        let from = params.startDate;
        let end = params.endDate;

        let currStart = formatDate(dateRange.start);
        let currEnd = formatDate(dateRange.end);

        //only trigger reload if one of the dates change on Blur.
        if (from !== currStart || end !== currEnd) {
            setReload(new Date())
        }
    }

    useEffect(() => {
        search()
    }, [props.reload, reload, filterToVolumes, includeNegatives, unassignedSwitchChecked, currency])


    return (
        <div>
            <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'center'}}>
                <DateRangePicker startDateInput={DateRangeStartDate}
                                 endDateInput={DateRangeEndDate}
                                 format={"yyyy-MM-dd"} defaultValue={defaultDates}
                                 onChange={onChangeDateRange}
                                 onBlur={onBlurDateRange}
                                 style={{
                                     width: "300px"
                                 }}
                />

                Advanced Filter <Switch onChange={toggleSearchField} checked={showAdvancedSearch}
                                        defaultValue={false}/>&nbsp;
            </div>
            {showAdvancedSearch &&
            <fieldset>
                <legend align={'left'}>Advanced Filter</legend>
                <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'center'}}>
                            <span>
                                <Label editorId='showUnassignedOnly'>
                                    Show only unassigned designations &nbsp;
                                </Label>
                                <Switch id='showUnassignedOnly' checked={unassignedSwitchChecked}
                                    defaultValue={false}
                                    onChange={updateUnassigned}/>
                            </span>
                            <span>
                                <Label editorId='currencyList'>
                                    Show Currency &nbsp;
                                </Label>
                                <DropDownList id='currencyList' data={currencies} value={currency.value}
                                          dataItemKey='id'
                                          textField='text'
                                          style={{
                                              width: "100px"
                                          }}
                                          onChange={updateCurrency}/>
                            </span>
                        <span>
                            <Label editorId='includeNegatives'>
                                Include Designations with a Negative Value &nbsp;
                            </Label>
                            <DropDownList id='includeNegatives' data={includeNegativeDesig} value={includeNegatives}
                                          style={{
                                              width: "100px",
                                          }}
                                          onChange={updateIncludeNegatives}/>
                        </span>
                        <span>
                            <Label editorId='filterToVolumes'>
                                Filter to Volume Bucket &nbsp;
                            </Label>
                            <DropDownList id='filterToVolumes' data={volumeBuckets} value={filterToVolumes.value}
                                          dataItemKey='id' textField='name'
                                          style={{
                                              width: "100px",
                                          }}
                                          onChange={updateFilterToVolumes}/>
                        </span>
                        <span style={{marginLeft: 'auto'}}>
                            <Button tabIndex={-1} onClick={resetToDefaults}
                                    style={{margin: '10px'}}>Reset to Default</Button>
                        </span>
                </div>
            </fieldset>
            }
        </div>
    )
}

export default DesignationSearch;