import * as React from "react"
import {useEffect, useState} from "react"
import {DateRangePicker} from "@progress/kendo-react-dateinputs";
import {Button} from "@progress/kendo-react-buttons";
import DateRangeEndDate from "../common/input/DateRangeEndDate";
import DateRangeStartDate from "../common/input/DateRangeStartDate";
import {DropDownList} from "@progress/kendo-react-dropdowns";
import {Label} from "@progress/kendo-react-labels";
import {getData} from "../common/api";
import {Switch} from "@progress/kendo-react-inputs";
import {getCurrencyList, getYesNoList} from "../common/ReferenceData";
import {formatDate} from "../common/gridUtils";

const Search = (props) => {

    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const defaultDates = {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date()
    };

    const [currency, setCurrency] = useState({
        value: {
            text: 'All',
            id: ''
        }
    });

    const [dateRange, setDateRange] = useState(defaultDates);

    const [processed, setProcessed] = useState({
        value: {
            text: 'No',
            id: 'false'
        }});
    const [redeemed, setRedeemed] = useState({
        value: {
            text: 'All',
            id: ''
        }});

    const groupByList = [
        {
            text: "Corporate Partner, Payment Ref, Is Processed, Presentment Currency, Settlement Currency, Invoice Item ID",
            id: "1",
        },
        {
            text: "Corporate Partner, Payment Ref, Is Processed, Presentment Currency, Settlement Currency, Invoice Item ID, Is Redeemed",
            id: "2",
        },
        {
            text: "Corporate Partner, Payment Ref, Is Processed, Presentment Currency, Settlement Currency, Invoice Item ID, Is Assigned",
            id: "3",
        },
        {
            text: "Corporate Partner, Payment Ref, Is Processed, Presentment Currency, Settlement Currency, Invoice Item ID, Purchase Date",
            id: "4"
        }
    ];
    const defaultGroupBy = groupByList[0];

    const [groupBySelection, setGroupBySelection] = useState(defaultGroupBy);

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => {
        setOpen(true);
    }
    const handleClose = () => {
        setOpen(false);
    }
    const updateGroupBySelection=(event) => {
        setGroupBySelection(event.value);
    }
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
            groupBy: groupBySelection.id,
        };
        if (currency.value.text !== 'All') {
            params = {...params, currency: currency.value.text}
        }
        if ( redeemed.value.text !== 'All') {
            params = {...params,showRedeemed: redeemed.value.id}
        }
        if ( processed.value.text !== 'All') {
            params = {...params,showProcessed: processed.value.id}
        }
        setParams(params)
        getData('/api/unprocessed-gift-cards/gift-cards', params, props.setDataCallBack);

    };

    const resetToDefaults = () => {
        setCurrency({
            value: {
                text: 'All',
                id: ''
            }
        });
        setGroupBySelection(groupByList[0])
        setDateRange(defaultDates)
        setProcessed({value: getYesNoList()[2]})
        setRedeemed({value: getYesNoList()[0]})
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
    const updateProcessed = (event) => {
        setProcessed({value: event.target.value});
    }
    const updateRedeemed = (event) => {
        setRedeemed({value: event.target.value});
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
     * On change event on date field waits untill all the components of date are entered.
     * but if you are changing an existing date, this event will be fired for each component change
     * using keyboard, for example if you are changing the day part using key board this event will be
     * fired for each day.
     * @param event
     */
    const onChangeDateRange = (event) => {
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
    }, [reload, currency, groupBySelection, redeemed, processed])


    return (
        <div>
            <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'center'}}>
                <DateRangePicker startDateInput={DateRangeStartDate}
                                 endDateInput={DateRangeEndDate}
                                 format={"yyyy-MM-dd"} defaultValue={defaultDates}
                                 onChange={onChangeDateRange}
                                 onBlur={onBlurDateRange}
                                 style={{width: '300px'}}
                />
                <Label editorId="groupBy">Group By &nbsp;</Label>
                <DropDownList
                    id="groupBy"
                    data={groupByList}
                    value={groupBySelection}
                    dataItemKey="id"
                    textField="text"
                    popupSettings={{width: '635px'}}
                    style={{width:open?'635px':'635px'}}
                    onChange={updateGroupBySelection}
                    onOpen={handleOpen}
                    onClose={handleClose}
                />
                Advanced Filter <Switch onChange={toggleSearchField} checked={showAdvancedSearch}
                                        defaultValue={false}/>&nbsp;
            </div>
            {showAdvancedSearch &&
            <fieldset>
                <legend align={'left'}>Advanced Search</legend>
                <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'baseline'}}>
                    <Label editorId='currencyList'>
                        Show Currency &nbsp;
                    </Label>
                    <DropDownList id='currencyList' data={getCurrencyList()} value={currency.value}
                                  dataItemKey='id'
                                  textField='text'
                                  onChange={updateCurrency}
                                  style={{width: '100px'}}
                    />

                    <Label editorId='processedList'>
                        Processed &nbsp;
                    </Label>
                    <DropDownList id='processedList' data={getYesNoList()} value={processed.value}
                                  dataItemKey='id'
                                  textField='text'
                                  onChange={updateProcessed}
                                  style={{width: '100px'}}
                    />
                    <Label editorId='redeemedList'>
                        Redeemed &nbsp;
                    </Label>
                    <DropDownList id='redeemedList' data={getYesNoList()} value={redeemed.value}
                                  dataItemKey='id'
                                  textField='text'
                                  onChange={updateRedeemed}
                                  style={{width: '100px'}}
                    />

                    <span style={{marginLeft: 'auto'}}>
                            <Button tabIndex={-1} onClick={resetToDefaults} style={{margin: '10px'}}>Reset to Default</Button>
                    </span>
                </div>
            </fieldset>
            }
        </div>
    )
}

export default Search;