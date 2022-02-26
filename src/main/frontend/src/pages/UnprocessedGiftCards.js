import React, {useEffect, useRef, useState} from "react";
import Search from "../components/unprocessed/Search";
import {getter, orderBy, process} from "@progress/kendo-data-query";

import {load} from '@progress/kendo-react-intl';
import gbNumbers from 'cldr-numbers-full/main/en/numbers.json';
import enDateFields from 'cldr-dates-full/main/en/dateFields.json';
import enCaGregorian from 'cldr-dates-full/main/en/ca-gregorian.json';
import {Tooltip} from '@progress/kendo-react-tooltip';
import {Loader} from "@progress/kendo-react-indicators";
import {ExcelExport} from "@progress/kendo-react-excel-export";
import {
    getSelectedState, getSelectedStateFromKeyDown,
    Grid, GRID_COL_INDEX_ATTRIBUTE, GridColumnMenuFilter, GridToolbar
} from "@progress/kendo-react-grid";
import {GridColumn as Column} from "@progress/kendo-react-grid/dist/npm/GridColumn";
import {
    ActiveColumnProps, BooleanYesNoCell,
    ColumnMenu,
    ColumnMenuCheckboxFilter, copyCellRowRender,
    CurrencyCell, CurrencyCellWithToolTip, TooltipCell,
    YesNoFilter
} from "../components/common/gridUtils";
import InvoiceGrid from "../components/unprocessed/InvoiceGrid";
import FeeGrid from "../components/unprocessed/FeeGrid";
import NetValueCalculator from "../components/unprocessed/NetValueCalculator";
import CorpPartnerHistGrid from "../components/unprocessed/CorpPartnerHistGrid";
import LineItemGrid from "../components/unprocessed/LineItemGrid";
import {useTableKeyboardNavigation} from "@progress/kendo-react-data-tools";
import {Button} from "@progress/kendo-react-buttons";
import {GridCellContextMenu} from "../components/common/GridCellContextMenu";

gbNumbers.main.en.numbers['decimalFormats-numberSystem-latn'].standard =
    '#######';

enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.full =
    'yyyy-MM-dd';
enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.short = 'yyyy-MM-dd';

load(gbNumbers, enDateFields, enCaGregorian);

const DATA_ITEM_KEY = "rowNum";
const SELECTED_FIELD = "selected";
const idGetter = getter(DATA_ITEM_KEY);

export const USE_INVOICE    = "USE_INVOICE";
export const USE_FEE        = "USE_FEE";
export const USE_PURCHASE_HIST = "USE_PURCHASE_HIST";
export const USE_LINE_ITEM = "USE_LINE_ITEM";


const UnprocessedGiftCards = () => {

    const pageSize = 50;
    const [skip, setSkip] = React.useState(0);

    /**
     * State variables
     * @param response
     */
    const initialGridState = {
        take: pageSize,
        skip: 0,
        filter: null,
        sort: [
            {
                field: null,
                dir: null
            }
        ],
        selection: []
    };

    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({data: []});
    const [dataState, setDataState] = useState(initialGridState);
    const [sort, setSort] = React.useState(initialGridState.sort);

    //selection state variables
    const [selectedState, setSelectedState] = useState({});
    const [selectedGiftCardids, setSelectedGiftCardids] = useState([]);
    const [selectedOrgId, setSelectedOrgId]  = useState();

    const [selectedGiftCard, setSelectedGiftCard] = useState();
    const [selectedInvoice, setSelectedGInvoice] = useState();
    const [selectedPurchaseHist, setSelectedPurchaseHist] = useState();
    const [selectedLineItem, setSelectedLineItem] = useState();
    const [netValueData, setNetValueData] = useState({});

    const setSelectedGInvoiceHandler = (invoice) => {
        console.log('setting invoice', invoice)
        setSelectedGInvoice(invoice);
    }

    const setSelectedLineItemHandler = (lineItem) => {
        console.log('setting lineitem' , lineItem)
        setSelectedLineItem(lineItem)
    }

    const exportToExcel = useRef(null);
    const unprocessedGiftCardsGrid = useRef();

    const resetSelectedState = () => {
        setSelectedGiftCardids(undefined);
        setSelectedGiftCard(undefined);
        selectedInvoice(undefined);
        setSelectedPurchaseHist(undefined);
        setSelectedLineItem(undefined);
        setNetValueData({});
    }

    const updateSelectedGiftCardIds=(ids )=>{
            console.log('updating selectedGiftCardids ' , selectedGiftCardids, ids);
            setSelectedGiftCardids(ids);
    }
    const pageChange = (event) => {
        console.log('skip :' + event.page.skip)
        setSkip(event.page.skip);
    };

    const createDataState = (list, dataState) => {
        return {
            result: process(list.slice(0), dataState),
            dataState: dataState
        };
    };

    const setData = (response) => {
        let rowNum = 0;
        let list = response.map(row => {
            if (row.purchaseDate !== null && row.purchaseDate !== undefined && row.purchaseDate !== 'Multiple') {
                row['purchaseDate'] = new Date(row.purchaseDate);
            }
            row['designationStatus'] = (row.designated)? 'Designated': 'Undesignated';
            row['rowNum'] = rowNum++;
            return row;
        });

        if (list === undefined) {
            list = [];
        }

        let initialState = createDataState(list, initialGridState);
        let res = process(list, initialGridState);
        setDataState(initialState);
        setRows(list);
        setResults(res);
        //console.log('results.data size   ' + results.total)
        setDefaultSelection(res)
        setLoading(false);
    }


    /**
     * set AddOnRate , feeRate,
     * @param invoice
     */
    const useInvoiceHandler=(invoice, isDefaultSelection)=>{
        setSelectedGInvoice(invoice);
        let vNetValueData = getGiftCardDataFromGiftCard();
        vNetValueData = popuatedNetValCalcFromSelectedInvoice(vNetValueData, invoice);
        vNetValueData['useData'] = USE_INVOICE;
        setNetValueData(vNetValueData);
    }

    const popuatedNetValCalcFromSelectedInvoice=(vNetValueData, invoice)=>{
        vNetValueData['addOnRate'] = invoice.addonRate;
        vNetValueData['feeRate'] = invoice.feeRate;
        return vNetValueData;
    }

    const usePurchaseHistHandler=(purchaseHist, isDefaultSelection)=>{
        //if this is a default selection and meyvalue cacl data is already set by INVOICE ignore this.
        if ( isDefaultSelection === true) {
            if ( netValueData && netValueData != null && netValueData.useData === USE_INVOICE) {
                return;
            }
        }

        setSelectedPurchaseHist(purchaseHist);
        let vNetValueData = getGiftCardDataFromGiftCard();
        vNetValueData = popuatedNetValCalcFromSelectedPurchaseHistory(vNetValueData, purchaseHist);
        vNetValueData['useData'] = USE_PURCHASE_HIST;
        setNetValueData(vNetValueData);
    }
    const popuatedNetValCalcFromSelectedPurchaseHistory=(vNetValueData, purchaseHist)=>{
        vNetValueData['addOnRate'] = purchaseHist.addonRate;
        vNetValueData['feeRate'] = purchaseHist.feeRate;
        vNetValueData['underwritingCode'] = purchaseHist.underwritingCode;
        vNetValueData['underwritingRate'] = purchaseHist.underwritingRate;
        return vNetValueData;
    }


    const useLineItemHandler=(lineItem, isDefaultSelection)=>{

        //if this is a default selection and meyvalue cacl data is already set by INVOICE or PUCHASE HISTignore this.
        if ( isDefaultSelection === true) {
            if ( vNetValueData && vNetValueData != null && (vNetValueData.useData === USE_INVOICE||vNetValueData.useData === USE_PURCHASE_HIST )) {
                return;
            }
        }

        setSelectedLineItem(lineItem);
        let vNetValueData = getGiftCardDataFromGiftCard();
         vNetValueData = popuatedNetValCalcFromSelectedLineItem(vNetValueData, lineItem);
        vNetValueData['useData'] = USE_LINE_ITEM;
        setNetValueData(vNetValueData);
    }
    const popuatedNetValCalcFromSelectedLineItem=(vNetValueData, lineItem)=>{
        vNetValueData['feeRate'] = lineItem.feeRate;
        vNetValueData['underwritingCode'] = lineItem.underwritingCode;
        vNetValueData['underwritingRate'] = lineItem.underwritingRate;
        return vNetValueData;
    }

    /**
     presentmentCurrency
     presentmentValue
     settlementCurrency
     exchangeRate
     settlementValue
     feeAdOnRate
     */
    const getGiftCardDataFromGiftCard=()=>{
        let vNetValueData = {};
        console.log('selectedGiftCard', selectedGiftCard);
        if (selectedGiftCard ) {
            vNetValueData['presentmentCurrency'] = selectedGiftCard.presentmentCurrency;
            vNetValueData['presentmentValue'] = selectedGiftCard.purchaseAmountTotal;
            vNetValueData['settlementCurrency'] = selectedGiftCard.settlementCurrency;
            vNetValueData['settlementAmountTotal'] = selectedGiftCard.settlementAmountTotal;
            if (selectedGiftCard.settlementAmountTotal !== undefined && selectedGiftCard.settlementAmountTotal !== null) {
                vNetValueData['exchangeRate'] = selectedGiftCard.settlementAmountTotal / selectedGiftCard.purchaseAmountTotal;
            }
            vNetValueData['purchaseAmountInd'] = selectedGiftCard.purchaseAmount;
            vNetValueData['settlementAmountInd'] = selectedGiftCard.settlementAmount;
        }
        return vNetValueData;
    }


    const Count = (props) => {
        const count = (results.data) ? results.total : 0;
        return (
            <td colSpan={props.colSpan} className='k-grid-footer-sticky' style={props.style}>
                Count: {count}
            </td>
        );
    };

    const exportToExcelHandler = () => {
        if (exportToExcel.current !== null) {
            exportToExcel.current.save(rows, unprocessedGiftCardsGrid.current.columns);
        }
    };


    const setDefaultSelection=(res)=>{
        let selectedState = {};
        if ( res !== undefined && res.total > 0 ) {
            selectedState[res.data[0].rowNum] = true;
            updateSelectedGiftCardIds(res.data[0].giftCardIds);
            //console.log(' selectedGiftCardis ' +res.data[0].giftCardIds);
            setSelectedGiftCard(res.data[0]);
            setSelectedOrgId(res.data[0].organizationId);
            //console.log(' selectedOrgId ' +res.data[0].organizationId);
        }
        setSelectedState(selectedState)
    }

    const onSelectionChange = (event) => {
        const newSelectedState = getSelectedState({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        let selectedField = Object.keys(newSelectedState)[0];

        var selectedRow = results.data.find(obj => {
            return obj.rowNum === Number(selectedField);
        })

        if ( selectedGiftCard === undefined || selectedRow.rowNum !== selectedGiftCard.rowNum) {
            updateSelectedGiftCardIds(selectedRow.giftCardIds);
            setSelectedOrgId(selectedRow.organizationId);
            //console.log(selectedRow.giftCardIds);
            setSelectedState(newSelectedState);
            setSelectedGiftCard(selectedRow);
            setSelectedOrgId(undefined);
            setNetValueData({});
        }

    }


    /**
     * When virtual scrolling is enabled for both filter change and
     * scroll event this event will be fired.
     * DO not using onPageChange
     * @param event
     */
    const dataStateChange = (event) => {
        //console.log('data change' + event.dataState.skip)
        let updatedDataState = createDataState(rows, event.dataState);

        let filterChanged =  (dataState.filter !== updatedDataState.dataState.filter)?true:false;

        setResults(updatedDataState.result);
        setDataState(updatedDataState.dataState);

        //no need to reselect on scroll but reset selection to default on filter change.
        if ( event.nativeEvent.type !== 'scroll' && filterChanged) {
            setDefaultSelection(updatedDataState.result)
        }
    }
    const onKeyDown = (event) => {
        console.log('onKeyDown:' , event)
        const newSelectedState = getSelectedStateFromKeyDown({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        setSelectedState(newSelectedState);
    };

    const CheckBoxFilter = (props) => (
        <ColumnMenuCheckboxFilter
            {...props}
            data={rows}/>
    );

    const popupCallBackHandler=(obj)=>{
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (
        <div style={{padding: '0 4px'}}>
            <div>
                <h4>Unprocessed Gift Cards</h4>
            </div>
            <Search setDataCallBack={setData} setLoaderCallBack={setLoading}/>
            {loading && <Loader size="large" type={'infinite-spinner'}/>}
            <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>

            {results &&
            <>
                <div>
                    <fieldset>
                        <legend align={'left'}>List of Unprocessed Gift Cards</legend>
                        <ExcelExport fileName="designations" ref={exportToExcel}/>
                        <Tooltip openDelay={1500} position="right">
                            <Grid
                                style={{
                                    height: "440px",
                                    width: "98vw"
                                }}
                                rowHeight={10}
                                pageSize={pageSize}
                                total={results.total}
                                skip={skip}
                                data={results.data.map((item) => ({
                                    ...item,
                                    [SELECTED_FIELD]: selectedState[idGetter(item)],
                                }))}
                                {...dataState}
                                onDataStateChange={dataStateChange}
                                onKeyDown={onKeyDown}
                                sortable={true}
                                scrollable={'virtual'}
                                resizable={true}
                                dataItemKey={DATA_ITEM_KEY}
                                selectedField={SELECTED_FIELD}
                                selectable={{
                                    enabled: true,
                                    drag: false,
                                    cell: false,
                                    mode: 'single'
                                }}
                                navigatable={true}
                                onSelectionChange={onSelectionChange}
                                ref={unprocessedGiftCardsGrid}
                                rowRender={(trElement, dataItem) =>
                                    copyCellRowRender(trElement, dataItem, { grid: unprocessedGiftCardsGrid, popupCallBack: popupCallBackHandler})
                                }
                            >
                                <GridToolbar>
                                    <Button
                                        title="Export Excel"
                                        className="k-button k-primary"
                                        tabIndex={-1}
                                        onClick={exportToExcelHandler}>
                                        Export to Excel
                                    </Button>
                                </GridToolbar>
                                <Column field={'giftCardCount'}  {...ActiveColumnProps('giftCardCount', dataState)}
                                        title='Count' filter={'numeric'}
                                        width={100} locked={true}
                                        columnMenu={ColumnMenu} footerCell={Count} cell={TooltipCell}/>
                                <Column field={'organizationName'} {...ActiveColumnProps('organizationName', dataState)}
                                        title='Corporate Partner'
                                        width={180} locked={true}
                                        columnMenu={ColumnMenu} cell={TooltipCell}/>
                                <Column field={'lineItem'} {...ActiveColumnProps('lineItem', dataState)}
                                        title='Line Item' width={185} locked={true}
                                        columnMenu={ColumnMenu} cell={TooltipCell}/>

                                <Column field={'paymentRef'} {...ActiveColumnProps('paymentRef', dataState)}
                                        title='Payment Reference'
                                        width={170} locked={true}
                                        columnMenu={ColumnMenu} cell={TooltipCell}/>

                                <Column
                                    field={'unassignedNetValue'} {...ActiveColumnProps('unassignedNetValue', dataState)}
                                    title='Gift Card Unassigned Net Value' width={150}
                                    filter={'numeric'}
                                    columnMenu={ColumnMenu} cell={CurrencyCellWithToolTip}/>


                                <Column field={'addonRate'}  {...ActiveColumnProps('addonRate', dataState)}
                                        title={'Addon Rate'}
                                        width={130} filter={'numeric'}
                                        cell={CurrencyCellWithToolTip} columnMenu={ColumnMenu}/>

                                <Column
                                    field={'presentmentCurrency'} {...ActiveColumnProps('presentmentCurrency', dataState)}
                                    title='Presentment Currency' width={140} columnMenu={CheckBoxFilter} cell={TooltipCell}/>

                                <Column
                                    field={'purchaseAmountTotal'} {...ActiveColumnProps('purchaseAmountTotal', dataState)}
                                    title='Presentment Purchase Amount' width={160}
                                    cell={CurrencyCellWithToolTip} filter={'numeric'}
                                    columnMenu={ColumnMenu}/>

                                <Column
                                    field={'redeemedAmountTotal'} {...ActiveColumnProps('redeemedAmountTotal', dataState)}
                                    title='Presentment Redeemed Amount' width={170} cell={CurrencyCellWithToolTip}
                                    filter={'numeric'}
                                    columnMenu={ColumnMenu}/>


                                <Column field={'settlementCurrency'} {...ActiveColumnProps('settlementCurrency', dataState)}
                                        title='Settlement Currency' width={140}
                                        columnMenu={CheckBoxFilter} cell={TooltipCell}/>

                                <Column
                                    field={'settlementAmountTotal'} {...ActiveColumnProps('settlementAmountTotal', dataState)}
                                    title='Settlement Purchase Amount'
                                    width={160}
                                    cell={CurrencyCellWithToolTip} filter={'numeric'}
                                    columnMenu={ColumnMenu}/>


                                <Column field={'purchaseDate'} {...ActiveColumnProps('purchaseDate', dataState)}
                                        title='Purchase Date for gift card'
                                        format="{0:yyyy-MM-dd}"
                                        filter={'date'}
                                        width={120} cell={TooltipCell}
                                        columnMenu={ColumnMenu}/>

                                <Column field={'invoiceStatus'} {...ActiveColumnProps('invoiceStatus', dataState)}
                                        title='Invoice Status' width={120} cell={TooltipCell}
                                        columnMenu={CheckBoxFilter}/>

                                <Column field={'designationStatus'} {...ActiveColumnProps('designationStatus', dataState)}
                                        title='Designation Status' width={130}
                                        columnMenu={CheckBoxFilter} cell={TooltipCell}
                                />
                            <Column field={'buyerReceiptItemId'} {...ActiveColumnProps('buyerReceiptItemId', dataState)}
                                    title='Buyer Receipt Item ID' width={120}
                                    columnMenu={ColumnMenu} cell={TooltipCell}/>
                            </Grid>
                        </Tooltip>
                    </fieldset>
                </div>

                <div style={{display: 'flex', flexDirection: 'row', gap: '5px', alignItems: 'flex-start'}}>
                    <div style={{width: '60%', paddingTop: '5px'}}>
                        <InvoiceGrid giftCardIds={selectedGiftCardids}   useHandler={useInvoiceHandler} selectHandler={setSelectedGInvoiceHandler}/>
                        <div style={{paddingTop: '5px'}}>
                            <FeeGrid/>
                        </div>
                    </div>
                    <div style={{width: '40%', alignItems: 'center', paddingTop: '5px'}}>
                        <NetValueCalculator giftCardIds={selectedGiftCardids} netValueData={netValueData}/>
                    </div>

                </div>
                <div style={{paddingTop: '5px'}}>
                    <CorpPartnerHistGrid orgId={selectedOrgId} useHandler={usePurchaseHistHandler} selectHandler={setSelectedPurchaseHist}/>
                </div>
                <div style={{paddingTop: '5px'}}>
                    <LineItemGrid orgId={selectedOrgId} useHandler={useLineItemHandler} selectHandler={setSelectedLineItemHandler}/>
                </div>
            </>
            }
        </div>
    );
}
export default UnprocessedGiftCards;