import * as React from "react"
import {useEffect, useRef, useState} from "react"
import {
    getSelectedState,
    getSelectedStateFromKeyDown,
    Grid,
    GridToolbar
} from "@progress/kendo-react-grid";
import {GridColumn as Column} from "@progress/kendo-react-grid/dist/npm/GridColumn";
import Button from "@progress/kendo-react-buttons/dist/es/Button";
import Clipboard from "./Clipboard";
import {filterBy, getter, orderBy, process} from "@progress/kendo-data-query";
import {
    ActiveColumnProps,
    ColumnMenu,
    ColumnMenuCheckboxFilter, copyCellRowRender,
    CurrencyCell,
    CurrencyCellWithToolTip,
    TooltipCell
} from "../common/gridUtils";
import {postData, putData} from '../common/api';
import {ExcelExport} from "@progress/kendo-react-excel-export";
import ValidationsDialog from '../common/dialog/ValidationsDialog';
import SuccessDialog from '../common/dialog/SuccessDialog';
import {Validation, ValidationType} from '../common/Validation';
import useWindowDimensions from "../common/WindowDimensions";
import {filter} from "@progress/kendo-data-query/dist/npm/transducers";
import {Checkbox} from "@progress/kendo-react-inputs";
import {Tooltip} from "@progress/kendo-react-tooltip";
import {Loader} from "@progress/kendo-react-indicators";
import {GridCellContextMenu} from "../common/GridCellContextMenu";

const PRESENTMENT_CURRENCY_MISMATCH = new Validation('PRESENTMENT_CURRENCY_MISMATCH',
    "Gift Cards has a Presentment Currency different from the Gift Card Group!",
    ValidationType.ERROR);
const GIFT_CARDS_ALREADY_ASSIGNED = new Validation('GIFT_CARDS_ALREADY_ASSIGNED',
    "Gift cards being assigned are already assigned to a designation!",
    ValidationType.WARNING);
const PRESENTMENT_VALUES_MISMATCH = new Validation('PRESENTMENT_VALUES_MISMATCH',
    "Total gift card presentment value (from the selected gift card records) does not equal the selected gift card designation presentment value!",
    ValidationType.WARNING);

const DATA_ITEM_KEY = "giftCardId";
const SELECTED_FIELD = "selected";
const idGetter = getter(DATA_ITEM_KEY);

const GiftCardGrid = (props) => {

    const pageSize = 50;
    const [skip, setSkip] = React.useState(0);

    const initialGridState = {
        take: pageSize,
        skip: 0,
        filter: null,
        sort: [
            {
                field: 'giftCardId',
                dir: 'asc'
            }
        ],
        selection: []
    };

    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);

    const [showClipBoard, setShowClipBoard] = useState(false);
    const [giftCards, setGiftCards] = useState([]);
    const [selectedState, setSelectedState] = React.useState({});
    const [results, setResults] = useState({data: []});
    const [filteredResults, setFilteredResults] = useState([]);
    const [dataState, setDataState] = useState(initialGridState);
    const [sort, setSort] = React.useState(initialGridState.sort);
    const [showValidations, setShowValidations] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [warnings, setWarnings] = useState([]);
    const [errors, setErrors] = useState([]);
    const [clipBoardType, setClipBoardType] = useState();
    const giftCardsGrid = useRef();
    const [selectAll,setSelectAll]= useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshSearch, setRefreshSearch] = useState(undefined);
    const { height, width } = useWindowDimensions();

    const exportToExcel = useRef(null);

    const exportToExcelHandler = () => {
        if (exportToExcel.current !== null) {
            exportToExcel.current.save(filteredResults, giftCardsGrid.current.columns);
        }
    };

    const toggleSelectAll=(event)=> {
        let newSelectAll = ! selectAll;

        if ( newSelectAll) {
            selectAllRows();
        } else {
            unSelectAllRows();
        }

        setSelectAll(newSelectAll);
    }

    const selectAllRows=()=>{
        let selectAllState = {};
        if (!giftCards ){
            return;
        }
        giftCards.forEach( (giftCard) =>{
            selectAllState[giftCard.giftCardId] =true;
        })
        setSelectedState(selectAllState);
    }

    const unSelectAllRows=()=>{
        setSelectedState({});
    }


    const onSelectionChange = (event) => {
        console.log(event)
        const newSelectedState = getSelectedState({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        setSelectedState(newSelectedState);

        let selectedRowCount = Object.values(newSelectedState).filter( value=> value === true).length;

        if (  giftCards  && selectedRowCount === giftCards.length ) {
            setSelectAll(true);
        }  else {
            setSelectAll(false);
        }

    };

    const onKeyDown = (event) => {
        console.log(event);
        console.log(event.syntheticEvent.key);
        const newSelectedState = getSelectedStateFromKeyDown({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });

        setSelectedState(newSelectedState);

        if ( event.nativeEvent.key === 'Backspace' || event.nativeEvent.key === 'Delete' ) {
            console.log(Object.keys(newSelectedState));

            //get giftcard ids with true
            let selectedGiftCardIds = Object.keys(newSelectedState).filter( giftCardId=> newSelectedState[giftCardId] === true);
            deleteGiftCards(selectedGiftCardIds);
            //deleting all selected rows. So selectAll checkbox should be off
            setSelectAll(false);
        }
    };

    const deleteGiftCards = (giftCardIds)=> {
        let remainingGiftCards = giftCards.filter( (giftCard) => {

            let tempSelectedState = {...selectedState};
            let delId = giftCardIds.filter ( (id) => {
                if ( giftCard.giftCardId == id ) {
                    delete tempSelectedState[id];
                    return id;
                }
            })
            if ( delId == null || delId.length <= 0 ) {
                return giftCard;
            } else {
                setSelectedState(tempSelectedState);
            }
        })

        let vDataState = {...dataState};
        vDataState['skip'] = 0;
        vDataState['take'] = undefined;


        let vFilteredGiftCards = process(remainingGiftCards, vDataState);
        setGiftCards(remainingGiftCards);

        let vResults = process(remainingGiftCards, dataState);
        setResultsData(vResults, vFilteredGiftCards.data);
        setGiftCards(remainingGiftCards);



        //setResultsData(vFilteredGiftCards,remainingGiftCards);
        //setFilteredResults(vFilteredGiftCards.data);

        /*        giftCardIds.forEach( (id)=> {
                    console.log('deleting card ' + id);

                })*/
        console.log(remainingGiftCards);
        //resetGridData(remainingGiftCards);
    }

    const dataStateChange = event => {
        console.log(event.dataState.skip,event.dataState.take );

        let filteredData = undefined;
        if ( event.nativeEvent.type !== 'scroll') {
            let vDataState = {...event.dataState};
            vDataState['skip'] = 0;
            vDataState['take'] = undefined;

            filteredData = process(giftCards, vDataState).data;
            console.log(filteredData.length, filteredData)
        }

        let updatedDataState = createDataState(giftCards, event.dataState);
        if ( filteredData === undefined ) {
            filteredData = filteredResults;
        }
        setResultsData(updatedDataState.result, filteredData);
        setDataState(updatedDataState.dataState);
    }

    const createDataState = (list, dataState) => {
        return {
            result: process(list.slice(0), dataState),
            dataState: dataState
        };
    };


    const giftCardsCount = (props) => {
        const count = results.total;
        return (
            <td colSpan={props.colSpan} className='k-grid-footer-sticky' style={props.style}>
                Count: {count}
            </td>
        );
    };

    const totalsLabel = (props) => {
        return (
            <td colSpan={props.colSpan}   style={props.style}>
                Totals:
            </td>
        );
    };

    const columnTotal = (props) => {
        const field = props.field || "";
        let result = filteredResults.map(a => a[field]);
        const total = result.reduce(getSum, 0);
        return (
            <td colSpan={props.colSpan}  style={props.style, {textAlign: 'right'}}>
                {Number(total).toLocaleString('en-US', {minimumFractionDigits:2})}
            </td>
        );
    }

    function getSum(total, num) {
        return total + num;
    }

    const toggleShowClipBoard = () => {
        setShowClipBoard(!showClipBoard);
        if ( showClipBoard) {
            setClipBoardType(undefined);
        } else {
            setClipBoardType('giftCardId');
        }
        setShowClipBoard(!showClipBoard);
    }

    const toggleShowPaymentRefClipBoard = () => {
        if ( showClipBoard) {
            setClipBoardType(undefined);
        } else {
            setClipBoardType('paymentRef');
        }
        setShowClipBoard(!showClipBoard);

    }

    const toggleShowInvoiceClipBoard = () => {
        setShowClipBoard(!showClipBoard);
        if ( showClipBoard) {
            setClipBoardType(undefined);
        } else {
            setClipBoardType('invoiceId');
        }
        setShowClipBoard(!showClipBoard);
    }


    const loadAutoGiftCards = () => {
        setLoading(true)
        postData('/api/gift-card-designations/assignable-gift-cards', {designationId: props.designationId}, addGiftCards);
    };

    useEffect(() => {
        if (props.designationId && props.designationId !== null ) {
            loadAutoGiftCards();
        }
    }, [props.designationId]);


    useEffect(() => {
        // giftCards.length> 0  && loadGiftCardByGiftCards();
        let initialState = createDataState([], initialGridState);
        setDataState(initialState);
        setGiftCards([]);
        //let res = process([], initialGridState);
        setResultsData({data: []}, []);
    }, [props.designationRequestId]);


    /**
     *
     * @param giftCardsResponse
     */
    const  addGiftCards = (giftCardsResponse) =>{
        let newList = [...giftCards];
        giftCardsResponse.map(  (response) => {
            let dups =  newList.find( giftcard => {
                if ( giftcard.giftCardId === response.giftCardId){
                    return giftcard;
                }
            })
            if ( dups  == undefined || dups.length <= 0 ) {
                response.purchaseDate = new Date(response.purchaseDate);

                if ( response.redeemedAmount && response.redeemedAmount !== null ) {
                    response.redeemedAmount = Number(parseFloat(response.redeemedAmount));
                }
                if ( response.netValue && response.netValue != null ) {
                    response.netValue = Number(parseFloat(response.netValue));
                }
                if ( response.paidDate  && response.paidDate !== null ) {
                    response.paidDate = new Date(response.paidDate);
                }

                newList.push(response);
            }
        });
        resetGridData(newList);
        setLoading(false);
    }

    const resetGridData=(newList)=> {
        let initialState = createDataState(newList, initialGridState);
        setGiftCards(newList);
        let res = process(newList.slice(0), initialGridState);
        setResultsData(res, newList);
        setDataState(initialState);
        if (newList.length === 0) {
            props.addValidationMessagesHandler([]);
        }
        setSelectedState({})
        setSelectAll(false);
    }

    useEffect( () => {
        if (props.startAssignment ) {
            assignHandler();
        }
    }, [props.startAssignment])

    useEffect( () => {
        props.setGiftCardsCallBackHandler(filteredResults);
    }, [filteredResults]);

    /**
     * Wrapper to setResults for debug.
     * @param res
     */
    const setResultsData = (res, filteredData) => {
        setResults(res);
        setFilteredResults(filteredData);
    }

    const assignHandler = () => {
        const violations = runValidations(filteredResults);

        if (violations.length > 0) {
            props.addValidationMessagesHandler(violations);
            toggleShowValidations();
        } else {
            assignGiftCardsHandler();
        }
    };

    const runValidations = (giftCardList) => {
        const warningsFound = [];
        const errorsFound = [];
        const designation = props.designations.find(d => d.designationId === +props.designationId);

        const totalGCPresentmentValue = giftCardList
            .map(gc => gc.purchaseAmount)
            .reduce((prev, next) => prev + next, 0);
        const currencyMismatch = giftCardList
            .some(gc => gc.purchaseAmountCurrency !== designation.presentmentValueCurrency);
        const gcAlreadyAssigned = giftCardList
            .some(gc => gc.designationId !== null);

        if (currencyMismatch) {
            errorsFound.push(PRESENTMENT_CURRENCY_MISMATCH);
        }
        if (giftCardList.length > 0 && designation.presentmentValue !== totalGCPresentmentValue) {
            warningsFound.push(PRESENTMENT_VALUES_MISMATCH);
        }
        if (gcAlreadyAssigned) {
            warningsFound.push(GIFT_CARDS_ALREADY_ASSIGNED);
        }

        setErrors(errorsFound);
        setWarnings(warningsFound);

        return errorsFound.concat(warningsFound);
    };

    const toggleShowValidations = () => {
        setShowValidations(!showValidations);
    };

    const assignGiftCardsHandler = () => {
        setShowValidations(false);

        const params = {
            designationId: props.designationId
        }
        const data = filteredResults.map(gc => gc.giftCardId);
        putData('/api/gift-card-designations', params, data, showSuccessMessageHandler);
    };

    const showSuccessMessageHandler = () => {
        setErrors([]);
        setWarnings([]);
        resetGridData([]);
        props.assignmentCompleteHandler();
        setShowSuccessMessage(true);
    };

    const CheckBoxFilter = (props) => (
        <ColumnMenuCheckboxFilter
            {...props}
            data={filteredResults}/>
    );

    let giftCardsGridWidth = width * .67;


    const popupCallBackHandler=(obj)=>{
        //console.log( obj.offset, obj.cellValue);
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (
        <>
            <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>
            {loading && <Loader size="large" type={'infinite-spinner'} />}

            {results &&
            <div>
                <fieldset>
                    <legend align={'left'}>Gift Card Search</legend>
                    <ExcelExport fileName="giftCards" ref={exportToExcel}/>
                    <Tooltip openDelay={1500} position="right" >
                    <Grid
                        style={{
                            height: '440px',
                            width: '68vw',
                        }}
                        pageSize={pageSize}
                        rowHeight={10}
                        total={results.total}
                        skip={skip}
                        data={orderBy(results.data, sort)
                            .slice(skip, skip + pageSize)
                            .map((item) => ({
                                ...item,
                                [SELECTED_FIELD]: selectedState[idGetter(item)],
                            }))}
                        {...dataState}
                        onDataStateChange={dataStateChange}
                        sortable={true}
                        sort={sort}
                        onSortChange={(e) => {
                            setSort(e.sort);
                        }}
                        scrollable={'virtual'}
                        resizable={true}
                        dataItemKey={DATA_ITEM_KEY}
                        selectedField={SELECTED_FIELD}
                        selectable={{
                            enabled: true,
/*
                            drag: true,
*/
                            cell: false,
                            mode: 'multiple',
                        }}
                        navigatable={true}
                        onSelectionChange={onSelectionChange}
                        onKeyDown={onKeyDown}
                        ref={giftCardsGrid}
                        rowRender={(trElement, dataItem) =>
                            copyCellRowRender(trElement, dataItem, { grid: giftCardsGrid, popupCallBack: popupCallBackHandler})
                        }

                    >

                        <GridToolbar>

                            <div style={{display: 'flex', flexDirection: 'row',justifyContent: 'space-between' ,width: '100%'}}>
                                <div style={{display: 'flex', flexDirection: 'row', gap: '1px', alignItems: 'flex-start',justifyContent: 'left' , width: '5%'}}>
                                    <Button
                                        title="Export Excel"
                                        className="k-button k-primary"
                                        onClick={exportToExcelHandler}
                                        tabIndex={-1}
                                    >
                                        Export to Excel
                                    </Button>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'center', justifyContent: 'right' ,width: '15%'}}>
                                    Select All<Checkbox checked={selectAll} onClick={toggleSelectAll}  onChange={toggleSelectAll}/>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'center',justifyContent: 'center'  , width: '80%'}}>
                                    Gift Card Source
                                    <Button className="k-button k-primary" disabled={! props.designationId} onClick={loadAutoGiftCards}>Auto</Button>
                                    <Button className="k-button k-primary" disabled={! props.designationId} onClick={toggleShowInvoiceClipBoard}>Invoice ID</Button>
                                    <Button className="k-button k-primary" disabled={! props.designationId} onClick={toggleShowPaymentRefClipBoard}>Payment Ref</Button>
                                    <Button className="k-button k-primary" disabled={! props.designationId} onClick={toggleShowClipBoard}>Gift Card IDs</Button>
                                </div>
                            </div>
                        </GridToolbar>
                        <Column field={'giftCardId'} title='Gift Card ID' locked={true} width={giftCardsGridWidth*.12}  {...ActiveColumnProps('giftCardId', dataState)} filter={'numeric'} columnMenu={ColumnMenu} footerCell={giftCardsCount} cell={TooltipCell}/>
                        <Column field={'organizationName'} title='Organization Name' locked={true} width={giftCardsGridWidth*.16} {...ActiveColumnProps('organizationName',dataState)} columnMenu={ColumnMenu} cell={TooltipCell}/>
                        <Column field={'paymentRef'} title='Payment Ref' locked={true} width={giftCardsGridWidth*.127119} {...ActiveColumnProps('paymentRef',dataState)} columnMenu={ColumnMenu} cell={TooltipCell}/>
                        <Column field={'purchaseDate'} title='Purchase Date' width={giftCardsGridWidth*.1} filter={'date'} format="{0:yyyy-MM-dd}" {...ActiveColumnProps('purchaseDate',dataState)} columnMenu={ColumnMenu} cell={TooltipCell} />
                        <Column  field={'settlementCurrency'} title='Presentment Currency'  width={giftCardsGridWidth*.12} {...ActiveColumnProps('settlementCurrency',dataState)} footerCell={totalsLabel} columnMenu={CheckBoxFilter} cell={TooltipCell}/>
                        <Column field={'purchaseAmount'} title='Purchase Amt' width={giftCardsGridWidth*.095} format="{0:##,#.##}" filter={"numeric"} {...ActiveColumnProps('purchaseAmount', dataState)} filter={'numeric'} footerCell={columnTotal} columnMenu={ColumnMenu} cell={CurrencyCellWithToolTip}/>
                        <Column field={'redeemedAmount'} title='Redeem Amt' width={giftCardsGridWidth*.09} format="{0:##,#.##}" filter={"numeric"} {...ActiveColumnProps('redeemedAmount', dataState)} filter={'numeric'} footerCell={columnTotal} columnMenu={ColumnMenu} cell={CurrencyCellWithToolTip}/>
                        <Column field={'netValue'} title={'Net Value'} width={giftCardsGridWidth*.1} format="{0:##,#.##}" filter={"numeric"} {...ActiveColumnProps('netValue', dataState)} columnMenu={ColumnMenu} cell={CurrencyCellWithToolTip}/>
                        <Column  field={'invoiceStatus'} title='Invoice Status' width={giftCardsGridWidth*.09} {...ActiveColumnProps('invoiceStatus', dataState)} columnMenu={CheckBoxFilter} cell={TooltipCell}/>
                        <Column field={'invoiceNumber'} title='Invoice Number' width={giftCardsGridWidth*.127119} {...ActiveColumnProps('invoiceNumber',dataState)} columnMenu={ColumnMenu} cell={TooltipCell}/>
                        <Column field={'paidDate'} title='Paid Date' width={giftCardsGridWidth*.1} filter={'date'} format="{0:yyyy-MM-dd}" {...ActiveColumnProps('paidDate',dataState)} columnMenu={ColumnMenu} cell={TooltipCell}/>
                        <Column field={'lineItem'} title='Line Item ' width={giftCardsGridWidth*.16} {...ActiveColumnProps('lineItem', dataState)} columnMenu={ColumnMenu} cell={TooltipCell}/>
                    </Grid>
                    </Tooltip>
                </fieldset>


            </div>

            }
            <div>
                {showClipBoard &&
                <Clipboard addGiftCardHandler={addGiftCards}
                           clipBoardType={clipBoardType}
                           toggleShowClipBoard={toggleShowClipBoard} />
                }
            </div>

            <div>
                {showValidations && (
                    <ValidationsDialog width="800" height="400"
                                       items={errors.concat(warnings)}
                                       noErrors={errors.length === 0}
                                       stopCallBack={toggleShowValidations}
                                       continueCallBack={assignGiftCardsHandler} />
                )}

                {showSuccessMessage && (
                    <SuccessDialog message="Gift Certificates applied to Designation."
                                   successCallBack={() => setShowSuccessMessage(false)} />
                )}
            </div>

        </>
    )
}

export default GiftCardGrid;
