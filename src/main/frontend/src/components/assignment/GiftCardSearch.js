import * as React from "react";
import {useEffect, useState} from "react";
import {DateRangePicker} from "@progress/kendo-react-dateinputs";
import {Button} from "@progress/kendo-react-buttons";
import DateRangeEndDate from "../common/input/DateRangeEndDate";
import DateRangeStartDate from "../common/input/DateRangeStartDate";
import {Switch} from "@progress/kendo-react-inputs";
import {DropDownList} from "@progress/kendo-react-dropdowns";
import {Label} from "@progress/kendo-react-labels";
import {getData} from "../common/api";
import {formatDate} from "../common/gridUtils";


/*
Partner ID, Payment Ref, Presentment Currency, Settlement Currency. This default is what should automatically be populating the list of unassigned gift cards.
Partner ID, Payment Ref, Presentment Currency, Settlement Currency, Is Redeemed
Partner ID, Payment Ref, Presentment Currency, Settlement Currency, Purchase DAte
Partner ID, Payment Ref, Presentment Currency, Settlement Currency, Purchase Amount

 */
const groupByList = [
    {
        text: "Partner ID, Payment Ref, Presentment Currency, Settlement Currency",
        id: "1",
    },
    {
        text: "Partner ID, Payment Ref, Presentment Currency, Settlement Currency, Is Redeemed",
        id: "2",
    },
    {
        text: "Partner ID, Payment Ref, Presentment Currency, Settlement Currency, Purchase Date",
        id: "3",
    },
    {
        text: "Partner ID, Payment Ref, Presentment Currency, Settlement Currency, Purchase Amount",
        id: "4"
    },
    {
        text: "Gift Card ID",
        id: "5"
    }
]

const defaultGroupBy = groupByList[0];


/*
    PAID_FULL("Paid - Full"),
    PAID_PARTIAL("Paid - Partially"),
    DRAFT("Draft"),
    SUBMIT_TO_ACCOUNTING("Submit to Accounting"),
    DELIVERED("Delivered"),
    AWAITING_DOCS_PO("Awaiting Docs (PO)"),
    VOID("Void");
 */
const invoiceStatuses = [
    {
        text: "All",
        id: "",
    },
    {
        text: "Draft",
        id: "DRAFT",
    },
    {
        text: "Paid - Full",
        id: "PAID_FULL",
    },
    {
        text: "Submit to Accounting",
        id: "SUBMIT_TO_ACCOUNTING"
    },
    {
        text: "Void",
        id: "VOID"
    },
    {
        text: "Awaiting Docs (PO)",
        id: "AWAITING_DOCS_PO"
    },
    {
        text: "Paid - Partially",
        id: "PAID_PARTIAL"
    },
    {
        text: "Delivered",
        id: "DELIVERED"
    }
];

const defaultInvoiceStatus = {
    text: "All",
    id: "",
};

const GiftCardSearch = (props) => {
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const defaultDates = {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(),
    };

    const [dateRange, setDateRange] = useState(defaultDates);
    const [viewVoidedGiftCards, setViewVoidedGiftCards] = useState(false);
    const [invoiceStatus, setInvoiceStatus] = useState(defaultInvoiceStatus);
    const [groupBySelection, setGroupBySelection] = useState(defaultGroupBy);

    const [reload, setReload] = useState(new Date());
    const [params, setParams] = useState();

    let search = () => {
        let searchParams = {};
        if (dateRange.start !== null && dateRange.end !== null) {
            searchParams['startDate'] = formatDate(dateRange.start);
            searchParams['endDate'] = formatDate(dateRange.end);
        } else {
            return;
        }

        searchParams['unassignedOnly'] = true;
        searchParams['invoiceStatus'] = invoiceStatus.id;
        searchParams['showVoided'] = viewVoidedGiftCards;
        searchParams['groupBy'] = groupBySelection.id;
        props.setLoadingCallBack(true);

        getData('/api/gift-card-assignments/gift-cards', searchParams, props.setDataCallBack);
        props.searchParamSetter(searchParams);
        setParams(searchParams)
    };

    useEffect(() => {
        search()
    }, [props.reload, reload, invoiceStatus, viewVoidedGiftCards, groupBySelection])

    const resetToDefaults = () => {
        setViewVoidedGiftCards(false);
        setInvoiceStatus(defaultInvoiceStatus)
    };

    let toggleSearchField = () => {
        if (showAdvancedSearch === true) {
            setShowAdvancedSearch(false);
        } else {
            setShowAdvancedSearch(true);
        }
    };

    const updateVoidedGiftCards = (event) => {
        setViewVoidedGiftCards(event.target.value);
    };

    const updateDateRange =( dateRange, reload)=> {
        console.log(dateRange)
        if ( dateRange !== undefined) {
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
        //console.log('onChange' ,event)

        setDateRange(event.value);
        if ( ! event instanceof  KeyboardEvent) {
            updateDateRange(event.value, true)
            console.log('reload,' , event)
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
        if ( from !== currStart || end !== currEnd) {
            setReload(new Date())
        }
    }

    const updateInvoiceStatus = (event) => {
        setInvoiceStatus(event.value);
    };
    const updateGroupBySelection=(event) => {
        setGroupBySelection(event.value);
    }
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => {
        setOpen(true);
    }
    const handleClose = () => {
        setOpen(false);
    }
    return (
        <div>
            <div style={{display: "flex", flexDirection: "row", gap: "16px", alignItems: "center"}}>
                <DateRangePicker
                    startDateInput={DateRangeStartDate}
                    endDateInput={DateRangeEndDate}
                    format={"yyyy-MM-dd"}
                    defaultValue={defaultDates}
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
                    popupSettings={{width: '535px'}}
                    style={{width:open?'535px':'535px'}}
                    onChange={updateGroupBySelection}
                    onOpen={handleOpen}
                    onClose={handleClose}
                />

                Advanced Filter <Switch onChange={toggleSearchField} checked={showAdvancedSearch} defaultValue={false}/>


            </div>
            {showAdvancedSearch && (
                <fieldset>
                    <legend  align={"left"}>Advanced Search</legend>
                    <div style={{display: "flex", flexDirection: "row", gap: "16px", alignItems: "center"}}>
                        <span>
              <Label editorId="viewVoidedGiftCards">Show Voided Gift Cards &nbsp;</Label>
              <Switch
                  id="viewVoidedGiftCards"
                  checked={viewVoidedGiftCards}
                  defaultValue={false}
                  onChange={updateVoidedGiftCards}
              />
            </span>
            <span>
              <Label editorId="invoiceStatus">Invoice Status &nbsp;</Label>

              <DropDownList
                  id="invoiceStatus"
                  data={invoiceStatuses}
                  value={invoiceStatus}
                  dataItemKey="id"
                  textField="text"
                  onChange={updateInvoiceStatus}
                  style={{
                      width: "200px"
                  }}
              />

            </span>

                        <span style={{marginLeft: 'auto'}}>
              <Button tabIndex={-1} onClick={resetToDefaults} style={{margin: "10px"}}>
                Reset to Default
              </Button>
            </span>
                    </div>
                </fieldset>
            )}
        </div>
    );
};

export default GiftCardSearch;
