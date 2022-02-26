import {Loader} from "@progress/kendo-react-indicators";
import {ExcelExport} from "@progress/kendo-react-excel-export";
import {
    getSelectedState,
    getSelectedStateFromKeyDown,
    Grid,
    GridColumn as Column,
    GridColumnMenuFilter,
    GridToolbar
} from "@progress/kendo-react-grid";
import {
    ActiveColumnProps, BooleanYesNoCell,
    ColumnMenu,
    ColumnMenuCheckboxFilter, copyCellRowRender,
    CurrencyCell, CurrencyCellWithToolTip, NumberCell, TooltipCell, YesNoFilter,
} from "../components/common/gridUtils";
import React, { useRef, useState} from "react";
import GiftCardSearch from "../components/assignment/GiftCardSearch";

import {load} from '@progress/kendo-react-intl';
import gbNumbers from 'cldr-numbers-full/main/en/numbers.json';
import enDateFields from 'cldr-dates-full/main/en/dateFields.json';
import enCaGregorian from 'cldr-dates-full/main/en/ca-gregorian.json';
import {getter, orderBy, process} from "@progress/kendo-data-query";
import {getData, putData} from "../components/common/api";
import Button from '@progress/kendo-react-buttons/dist/es/Button';
import ConfirmationDialog from '../components/common/dialog/ConfirmationDialog';
import SuccessDialog from '../components/common/dialog/SuccessDialog';
import SuspenseAccountTransferGrids from '../components/assignment/SuspenseAccountTransferGrids';
import InvoiceItemsGrid from '../components/assignment/InvoiceItemsGrid';
import {Tooltip} from "@progress/kendo-react-tooltip";
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


const GiftCardAssignment = () => {

    const initialGridState = {
        filter: null,
        sort: [
            {
                field: 'paymentRef',
                dir: 'asc'
            }
        ],
        selection: []
    };

    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);

    const defaultSelectedState = {calculatedData: {orgIdList: []}};
    const [sort, setSort] = React.useState(initialGridState.sort);
    const [skip, setSkip] = React.useState(0);
    const [results, setResults] = useState({data: []});
    const [dataState, setDataState] = useState(initialGridState);
    const [selectedState, setSelectedState] = useState(defaultSelectedState );
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [assignable, setAssignable] = useState(false);
    const [searchParams, setSearchParams] = useState({});
    const [refreshGrid, setRefreshGrid] = useState(undefined);
    const onSelectionChange = (event) => {
        const newSelectedState = getSelectedState({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        setNewSelectedState(newSelectedState);
    };

/*    const onKeyDown = (event) => {
        console.log(event.nativeEvent.key, event.nativeEvent.code);
        if (event.nativeEvent.key === 'Space' || event.nativeEvent.key === 'Enter' ) {
            //const checkboxElement = event.syntheticEvent.target;
            //const checked = checkboxElement.checked;
            //console.log(checked, checkboxElement);
            const newSelectedState = getSelectedStateFromKeyDown({
                event,
                selectedState: selectedState,
                dataItemKey: DATA_ITEM_KEY,
            });
            //setNewSelectedState(newSelectedState);
            console.log(newSelectedState);
        }
    }*/

    const handleCheckAll=(checkAll)=> {
        const newSelectedState = {};
        let allIds = [];
        results.data.forEach((item) => {
            let id = idGetter(item);
            if ( checkAll) {
                newSelectedState[id] = checkAll;
                allIds.push(id);
            } else {
                if (newSelectedState[id] != undefined ) {
                    delete newSelectedState[id];
                }
            }
            newSelectedState.rowNums = allIds;
        });
        let calculatedData = getCalculatedData(allIds);
        newSelectedState['calculatedData'] = calculatedData;
        setSelectedState(newSelectedState);
        setAssignable(allIds.length> 0 )
    }

    const onHeaderSelectionChange = React.useCallback((event) => {
        const checkboxElement = event.syntheticEvent.target;
        const checked = checkboxElement.checked;
        handleCheckAll(checked);
    });


    const setNewSelectedState = (newSelectedState) => {
        let selectedFields = Object.keys(newSelectedState).map(Number);

        //only take selectedid where id=true
        let selectedRowNums = selectedFields.filter( (rowNum ) => {

            if ( ! isNaN(rowNum) && newSelectedState[rowNum] === true) {
                return true;
            }
        })

        //initialize the rowNums list
        if ( selectedState.rowNums === undefined) {
            selectedState['rowNums'] = [];
        }

        let allSelectedIds = [...selectedState.rowNums, ...selectedRowNums];
        //unique list of selected rowNums
        allSelectedIds= allSelectedIds.filter((x, i, a) => a.indexOf(x) === i)

        //remove unselected [unchecked check ]
        let unselectedIds = selectedFields.filter( (rowNum ) => {
            if ( newSelectedState[rowNum] === false) {
                let index = allSelectedIds.indexOf(rowNum);
                if (index !== -1) {
                    allSelectedIds.splice(index, 1);
                }
                return rowNum;
            }
        })

        let vSelectedState = {...selectedState}
        let mergedState = Object.assign({},vSelectedState, newSelectedState);

        mergedState.rowNums = allSelectedIds;
        let calculatedData = getCalculatedData(allSelectedIds);
        mergedState['calculatedData'] = calculatedData;
        setSelectedState(mergedState);
        setAssignable(mergedState.rowNums.length > 0);
    }


    const getCalculatedData=(allSelectedIds) => {
        let selectedGiftCards = results.data.filter((rowData) => (allSelectedIds.includes(rowData.rowNum)))
        let giftCardCount = 0;
        let netPurchaseAmount = 0;
        let netSettlementAmount = 0;
        let netRedemptionAmount = 0;
        let netSettlementNetAmount = 0;
        let orgIdList = [];
        let giftCardIds = [];
        selectedGiftCards.forEach( (giftCard) => {
            netPurchaseAmount = netPurchaseAmount +giftCard.purchaseAmountTotal;
            netRedemptionAmount = netRedemptionAmount+ giftCard.redeemedAmountTotal;
            netSettlementAmount = netSettlementAmount+ giftCard.settlementAmountTotal;
            giftCardCount = giftCardCount+giftCard.giftCardCount;
            netSettlementNetAmount = netSettlementNetAmount + giftCard.settlementNetAmountTotal;
            if ( giftCard.organizationId !==null ) {
                if (! orgIdList.includes(giftCard.organizationId))
                orgIdList.push(giftCard.organizationId);
            }

            if ( giftCard.giftCardIds != undefined ) {
                let giftCardIdList = giftCard.giftCardIds;

                giftCardIdList.forEach(  (giftCardId) => {
                    if ( ! giftCardIds.includes(giftCardId)) {
                        giftCardIds.push(giftCardId);
                    }
                } )
            }

        } )

        let calculatedData = {};
        calculatedData['purchaseAmountTotal'] = netPurchaseAmount;
        calculatedData['redeemedAmountTotal'] = netRedemptionAmount;
        calculatedData['settlementAmountTotal'] = netSettlementAmount;
        calculatedData['giftCardCount'] = giftCardCount;
        calculatedData['settlementNetAmountTotal'] = netSettlementNetAmount;
        calculatedData['orgIdList'] = orgIdList;
        calculatedData['giftCardIds'] = giftCardIds;

        return calculatedData;
    }

    const exportToExcel = useRef(null);
    const giftCardsGrid = useRef();

    const exportToExcelHandler = () => {
        if (exportToExcel.current !== null) {
            exportToExcel.current.save(results.data, giftCardsGrid.current.columns);
        }
    };

    const createDataState = (list, dataState) => {
        return {
            result: process(list.slice(0), dataState),
            dataState: dataState
        };
    };

    const fetchDataHandler = () => {
        //const params = {};
        //getData('/api/gift-card-assignments/gift-cards', params, setData);
        setRefreshGrid(new Date());
        //setLoading(true);
    };

    const setData = (response) => {
        let rowNum = 0;
        let list = response.map(curr => {
            let pDate = '';

            if (curr.purchaseDate === 'Multiple') {
                curr['purchaseDate'] = curr.purchaseDate;
            } else {
                pDate = new Date(curr.purchaseDate);
                curr['purchaseDate'] = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
            }
            let eDate='';
            if (curr.expireDate === 'Multiple') {
                curr['expireDate'] = curr.expireDate;
            } else {
                eDate = new Date(curr.expireDate);
                curr['expireDate'] = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate());
            }
            let iDate = '';
            if (curr.invoiceStatusDate === '' || curr.invoiceStatusDate === undefined || curr.invoiceStatusDate === null) {
                curr['invoiceStatusDate'] = curr.invoiceStatusDate;
            }else if (curr.invoiceStatusDate === 'Multiple') {
                curr['invoiceStatusDate'] = curr.invoiceStatusDate;
            } else {
                iDate = new Date(curr.invoiceStatusDate);
                curr['invoiceStatusDate'] = new Date(iDate.getFullYear(), iDate.getMonth(), iDate.getDate());
            }


            curr['rowNum'] = rowNum++;
            return curr;
        });

        if (list === undefined) {
            list = [];
        }
        setStateData(list);
        setSelectedState(defaultSelectedState)
        setLoading(false);
    };


    const setStateData = (list) => {
        let initialState = createDataState(list, initialGridState);
        let res = process(list, initialGridState);
        setResults(res);
        setDataState(initialState);
        setRows(list);

    }

    const dataStateChange = event => {
        let updatedDataState = createDataState(rows, event.dataState);
        resetSelectedStateBasedOnFilter(updatedDataState.result)

        setResults(updatedDataState.result);
        setDataState(updatedDataState.dataState);
    }

    const resetSelectedStateBasedOnFilter=(updatedResult) =>{
        if ( updatedResult.data === undefined || updatedResult.data === null || updatedResult.data.length === 0 ) {
            selectedState.rowNums = [];
        } else {
            //check if selected row is still in the results list, if not selected row is filtered out
            // and should not be selected anymore.
            let selectedRowNumsFromResult = updatedResult.data.map(row => row.rowNum);
            let updatedSelectedRowNum = [];
            if ( selectedState.rowNums !== undefined && selectedState.rowNums !== null ) {
                selectedState.rowNums.forEach( (currRowNum) => {
                    if ( selectedRowNumsFromResult.includes(currRowNum)) {
                        updatedSelectedRowNum.push(currRowNum);
                    }
                } )
            }
            let newSelectedState = {...selectedState};
            let calculatedData = getCalculatedData(updatedSelectedRowNum);
            newSelectedState['calculatedData'] = calculatedData;
            newSelectedState.rowNums = updatedSelectedRowNum;
            setSelectedState(newSelectedState);
        }
    }


    const Count = (props) => {
        const count = (results.data) ? results.data.length : 0;
        return (
            <td style={props.style, {textAlign: 'right'}}>
                Count: {count}
            </td>
        );
    };

    const SelectedRows = (props) => {
        const count = (selectedState.rowNums) ? selectedState.rowNums.length : 0;
        return (
            <td colSpan={props.colSpan} className='k-grid-footer-sticky' style={props.style}>
                {count} rows selected
            </td>
        );
    };


    const SelectedGiftCardCount = (props) => {
        let count = 0 ;
        if ( selectedState.calculatedData !== undefined) {
            count = selectedState.calculatedData.giftCardCount;
        }

        return (
            <td colSpan={props.colSpan} className='k-grid-footer-sticky' style={props.style, {textAlign: 'right'}} >
                {count}
            </td>
        );
    };

    const SelectedRowTotal = (props) => {
        let total = 0;

        if (results.data !== null && results.data.length > 0 && selectedState.calculatedData !== null &&
            selectedState.calculatedData !== undefined ) {
            const field = props.field || "";
            if ( selectedState.calculatedData !== undefined) {
                total = selectedState.calculatedData[field];
            }

        }
        if ( total === undefined ) {
            total = 0;
        }
        return (
            <td colSpan={props.colSpan}  style={props.style,  {textAlign: 'right'}}>
                {total.toLocaleString('en-US', {minimumFractionDigits:2})}
            </td>
        );
    };

    const assignAsGiveAwayHandler = () => {
        toggleShowYesNoDialog();

        const data = selectedState.calculatedData.giftCardIds;
        putData('/api/gift-card-assignments', {}, data, showSuccessMessageHandler);
    };

    const showSuccessMessageHandler = () => {
        setSelectedState(  defaultSelectedState);
        setShowSuccessMessage(true);
        fetchDataHandler();
    };

    const toggleShowYesNoDialog = () => {
        setShowConfirmation(!showConfirmation);
    };
    //manage checkbox filter
    const CheckBoxFilter = (props) => (
        <ColumnMenuCheckboxFilter
            {...props}
            data={rows}/>
    );

    //remove grid fields from tab navication
     React.useEffect(() => {
         let focusableEls = giftCardsGrid.current.element.querySelectorAll(
             'input[type="checkbox"]:not([disabled])'
         );
         focusableEls.forEach((el) => el.setAttribute('tabindex', -1));
     });

    React.useEffect(() => {
        giftCardsGrid.current.element.addEventListener('keydown', (ev) => {
            console.log(ev.keyCode, ev.key);
            if (ev.keyCode == '32' ||ev.keyCode == '13' ) {
                let row = ev.target.closest('tr');
                //if celltd is null then it is a header row.
                let celltd = ev.target.closest('td');

                //if cellth is not null then it is header row.
                let cellth = ev.target.closest('th');

                //if cellCheckBox is null then it is NOT check All on the header. So no need
                // to do any action
                let cellCheckBox = undefined;
                if ( cellth ) {
                    cellCheckBox = cellth.querySelector('.k-checkbox');
                }

                //this is a header cell.
                if ( ! celltd && cellth && ! cellCheckBox) {
                    return;
                }
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();

                if (row) {
                    let checkbox = row.querySelector('.k-checkbox');
                    if (checkbox) {
                        checkbox.click();
                    }
                }
            }
        });
    }, []);

    const popupCallBackHandler=(obj)=>{
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (
        <div style={{padding: '0 4px'}}>
            <div>
                <h4>Gift Card Assignment</h4>
            </div>
            <GiftCardSearch setDataCallBack={setData}  searchParamSetter={setSearchParams} setLoadingCallBack={setLoading} reload={refreshGrid}/>
            <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>

            {loading && <Loader size="large" type={'infinite-spinner'}/>}
            {rows &&
            <>
                <div>
                    <fieldset>
                        <legend align={'left'}>List of Unassigned Gift Cards</legend>
                        <ExcelExport fileName="unassignedGiftCards" ref={exportToExcel}/>

                        <Tooltip openDelay={1500} position="right">
                            <Grid
                            data={orderBy(results.data, sort).map((item) => ({
                                ...item,
                                [SELECTED_FIELD]: selectedState[idGetter(item)],
                            }))} {...dataState}
                            onDataStateChange={dataStateChange}
                            sortable={true}
                            sort={sort}
                            onSortChange={e => {
                                setSort(e.sort);
                            }}
                            style={{
                                maxHeight: "500px",
                                maxWidth: "98vw"
                            }}
                            resizable={true}
                            dataItemKey={DATA_ITEM_KEY}
                            selectedField={SELECTED_FIELD}
                            selectable={{
                                enabled: true,
/*
                                drag: true,
*/
                                cell: false,
                                mode: 'multiple'
                            }}
                            navigatable={true}
                            onSelectionChange={onSelectionChange}
/*
                            onKeyDown={onKeyDown}
*/
                            rowHeight={10}
                            total={results.data.length}
                            onHeaderSelectionChange={onHeaderSelectionChange}
                            ref={giftCardsGrid}
                            rowRender={(trElement, dataItem) =>
                                copyCellRowRender(trElement, dataItem, { grid: giftCardsGrid , popupCallBack: popupCallBackHandler})
                            }
                        >
                            <GridToolbar>

                                <div style={{display: 'flex', flexDirection: 'row',justifyContent: 'space-between' ,width: '100%'}}>
                                    <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start', width: '90'}}>
                                        <Button
                                            title="Export Excel"

                                            onClick={exportToExcelHandler}
                                            tabIndex={-1}>
                                            Export to Excel
                                        </Button>
                                    </div>
                                    <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'baseline', justifyContent: 'right', width: '10'}}>
                                        <Button onClick={toggleShowYesNoDialog}
                                                disabled={!assignable}
                                                className="gg-action">Assign as Giveaway</Button>                                    </div>
                                </div>

                            </GridToolbar>
                            <Column
                                field={SELECTED_FIELD}
                                width="50px"
                                headerSelectionValue={
                                    results.data.findIndex((item) => !selectedState[idGetter(item)]) === -1
                                }
                            />
                            <Column field={'giftCardCount'} {...ActiveColumnProps('giftCardCount', dataState)}
                                    title='Count'
                                    format="{0:##,###}"
                                    cell={NumberCell}
                                    width={100}
                                    filter={'numeric'}
                                    columnMenu={ColumnMenu}
                                    footerCell={SelectedGiftCardCount}
                                    cell={TooltipCell}
                            />

                            <Column field={'organizationName'} {...ActiveColumnProps('organizationName', dataState)}
                                    title='Corporate Partner'
                                    width={160}
                                    columnMenu={ColumnMenu}
                                    footerCell={SelectedRows}
                                    cell={TooltipCell}
                            />
                            <Column field={'paymentRef'}  {...ActiveColumnProps('paymentRef', dataState)}
                                    title='Payment Ref'
                                    width={160}
                                    columnMenu={ColumnMenu} footerCell={Count}
                                    cell={TooltipCell}
                            />
                            <Column field={'suspenseAccountId'} {...ActiveColumnProps('suspenseAccountId', dataState)}
                                    title='Suspense Account ID' width={130}
                                    columnMenu={ColumnMenu}
                                    cell={TooltipCell}
                            />

                            <Column field={'purchaseDate'} {...ActiveColumnProps('purchaseDate', dataState)}
                                    title='Purchase Date'
                                    width={140}
                                    format="{0:yyyy-MM-dd}"
                                    filter={'date'}
                                    columnMenu={ColumnMenu}
                                    cell={TooltipCell}
                            />


                            <Column
                                field={'presentmentCurrency'}
                                {...ActiveColumnProps('presentmentCurrency', dataState)}
                                title='Presentment Currency' width={140} columnMenu={CheckBoxFilter}
                                cell={TooltipCell}
                            />
                            <Column field={'purchaseAmountTotal'}  {...ActiveColumnProps('purchaseAmountTotal', dataState)}
                                    title={'Purchase Amount Total'}
                                    width={140} filter='numeric'
                                    cell={CurrencyCellWithToolTip}
                                    columnMenu={ColumnMenu}
                                    footerCell={SelectedRowTotal}
                            />
                            <Column
                                    field={'settlementCurrency'}
                                    {...ActiveColumnProps('settlementCurrency', dataState)}
                                    title='Settlement Currency' width={120} columnMenu={CheckBoxFilter}
                                    cell={TooltipCell}
                            />
                            <Column field={'settlementAmountTotal'}  {...ActiveColumnProps('settlementAmountTotal', dataState)}
                                    title={'Settlement Amount Total'}
                                    width={140} filter='numeric'
                                    cell={CurrencyCellWithToolTip}
                                    columnMenu={ColumnMenu}
                                    footerCell={SelectedRowTotal}
                            />

                            <Column field={'redeemedAmountTotal'}  {...ActiveColumnProps('redeemedAmountTotal', dataState)}
                                    title={'Redemption Amount Total'}
                                    cell={CurrencyCellWithToolTip}
                                    filter='numeric'
                                    columnMenu={ColumnMenu}
                                    footerCell={SelectedRowTotal}
                                    width={140}
                            />
                            <Column field={'settlementAddonAmountTotal'}  {...ActiveColumnProps('settlementAddonAmountTotal', dataState)} title={'Net Amt'}
                                    title={'Settlement Add-On Amount Total'}
                                    width={170}
                                    filter='numeric'
                                    cell={CurrencyCellWithToolTip}
                                    footerCell={SelectedRowTotal}
                                    columnMenu={ColumnMenu}/>

                            <Column field={'settlementNetAmountTotal'}  {...ActiveColumnProps('settlementNetAmountTotal', dataState)} title={'Net Amt'}
                                    title={'Settlement Net Amount Total'}
                                    filter='numeric'
                                    cell={CurrencyCellWithToolTip}
                                    footerCell={SelectedRowTotal}
                                    columnMenu={ColumnMenu}
                                    width={140}
                            />

                            <Column field={'invoiceStatus'}  {...ActiveColumnProps('invoiceStatus', dataState)}
                                    title={'Invoice Status'}
                                    width={120}
                                    columnMenu={CheckBoxFilter}
                                    cell={TooltipCell}
                            />
                            <Column field={'invoiceStatusDate'} {...ActiveColumnProps('invoiceStatusDate', dataState)}
                                    title='Invoice Status Date'
                                    width={140}
                                    format="{0:yyyy-MM-dd}"
                                    filter={'date'}
                                    columnMenu={ColumnMenu}
                                    cell={TooltipCell}
                            />
                            <Column field={'invoiceNumber'} {...ActiveColumnProps('invoiceNumber', dataState)}
                                    title='Invoice Number' width={160}
                                    columnMenu={ColumnMenu}
                                    cell={TooltipCell}
                            />
                            <Column field={'expireDate'} {...ActiveColumnProps('expireDate', dataState)}
                                    title='Gift Card Expiration Date'
                                    width={150}
                                    format="{0:yyyy-MM-dd}"
                                    filter={'date'}
                                    columnMenu={ColumnMenu}
                                    cell={TooltipCell}
                            />
                            <Column field={'giftCardId'} {...ActiveColumnProps('giftCardId', dataState)}
                                    title='Gift Card ID' width={130}
                                    columnMenu={ColumnMenu}
                                    cell={TooltipCell}
                            />

                            <Column field={'redeemed'}  {...ActiveColumnProps('redeemed', dataState)}
                                    title={'Is Redeemed'}
                                    width={140}
                                    cell={BooleanYesNoCell} columnMenu={(props) => (
                                        <GridColumnMenuFilter {...props} filterUI={YesNoFilter} expanded={true}/>
                            )}/>
                        </Grid>
                        </Tooltip>
                    </fieldset>
                </div>
            </>
            }
            <div style={{display: 'flex', flexDirection: 'row', gap: '5px', alignItems: 'flex-start', paddingTop: '5px'}}>
                <div style={{width: '50%'}}>
                    <SuspenseAccountTransferGrids selectedCorpPartnerIds={selectedState.calculatedData.orgIdList} searchParams={searchParams}/>
                </div>
                <div style={{width: '50%', alignItems: 'center'}}>
                    <InvoiceItemsGrid selectedCorpPartnerIds={selectedState.calculatedData.orgIdList} />
                </div>

            </div>
            <div>
                {showConfirmation && (
                    <ConfirmationDialog message="Assign as Giveaway?"
                                        noCallBack={toggleShowYesNoDialog}
                                        yesCallBack={assignAsGiveAwayHandler} />
                )}
                {showSuccessMessage && (
                    <SuccessDialog message="Gift cards successfully assigned as giveaway."
                                   successCallBack={() => setShowSuccessMessage(false)} />
                )}
            </div>
        </div>
    );
}
export default GiftCardAssignment;