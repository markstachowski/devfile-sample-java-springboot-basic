import {Loader} from "@progress/kendo-react-indicators";
import {Tooltip} from "@progress/kendo-react-tooltip";
import {
    getSelectedState,
    getSelectedStateFromKeyDown,
    Grid,
    GridColumnMenuFilter,
    GridToolbar
} from "@progress/kendo-react-grid";
import {getter, orderBy, process} from "@progress/kendo-data-query";
import {GridColumn as Column} from "@progress/kendo-react-grid/dist/npm/GridColumn";
import {
    ActiveColumnProps,
    BooleanYesNoCell,
    ColumnMenu,
    ColumnMenuCheckboxFilter, copyCellRowRender,
    CurrencyCell, CurrencyCellWithToolTip, TooltipCell,
    YesNoFilter
} from "../common/gridUtils";
import React, {useEffect, useRef, useState} from "react";
import {getData} from "../common/api";
import Button from "@progress/kendo-react-buttons/dist/es/Button";
import {load} from '@progress/kendo-react-intl';
import gbNumbers from 'cldr-numbers-full/main/en/numbers.json';
import enDateFields from 'cldr-dates-full/main/en/dateFields.json';
import enCaGregorian from 'cldr-dates-full/main/en/ca-gregorian.json';
import {GridCellContextMenu} from "../common/GridCellContextMenu";


gbNumbers.main.en.numbers['decimalFormats-numberSystem-latn'].standard =
    '#######';

enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.full =
    'yyyy-MM-dd';
enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.short = 'yyyy-MM-dd';

load(gbNumbers, enDateFields, enCaGregorian);

const DATA_ITEM_KEY = "rowNum";
const SELECTED_FIELD = "selected";
const idGetter = getter(DATA_ITEM_KEY);

const MISC_LINE_ITEM = 'Gift Cards - Miscellaneous - 15%';

const LineItemGrid = (props)=> {

    const pageSize = 50;
    const [skip, setSkip] = React.useState(0);

    const initialGridState = {
        take: pageSize,
        skip: 0,
        filter: null,
        sort: [
            {
                field: 'enabled',
                dir: 'desc'
            }
        ],
        selection: []
    };

    const gridRef=useRef();
    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);


    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults]  = useState({data: [], total: 0 });
    const [dataState, setDataState] = useState(initialGridState);
    const [sort, setSort] = React.useState(initialGridState.sort);
    const [selectedState, setSelectedState] = useState({});
    const [selectedRow, setSelectedRow] = useState(undefined);
    const createDataState = (list, dataState) => {
        return {
            result: process(list.slice(0), dataState),
            dataState: dataState
        };
    };


    const updateSelectedState=(newSelectedState) =>{
        console.log('newSelectedState', newSelectedState);
        setSelectedState(newSelectedState);
    }

    const setDefaultSelection = (res) => {
        let selectedState = {};
        if (res !== undefined && res.total > 0) {
            selectedState[res.data[0].rowNum] = true;
            setSelectedRow(res.data[0])
            props.selectHandler(res.data[0], true);
        }
        updateSelectedState(selectedState)
    }

    const setData=(response) => {
        //console.log(response)
        let rowNum = 0;
        // rearrange line item by pushinhg the misc line item to
        // the first position
        let arrangedList = [];
        let miscLineItem = undefined;
        let list = response.map(row => {
            if (row.purchaseDate !== null && row.purchaseDate !== undefined && row.purchaseDate !== 'Multiple') {
                row['purchaseDate'] = new Date(row.purchaseDate);
            }

            //reserve the 0th element for MISC Line Item
            //console.log(row.lineItem, MISC_LINE_ITEM, (MISC_LINE_ITEM === row.lineItem))
            if ( row.lineItem === MISC_LINE_ITEM) {
                //console.log('***FOUND 286 line item ')
                arrangedList[0] = row;
                //row['rowNum'] = 0;
                miscLineItem = row;
            } else {
                rowNum++;
                arrangedList[rowNum] = row;
            }
            return row;
        });

        if (arrangedList === undefined) {
            arrangedList = [];
        }
        //remove the first element if that is null (list does not have MISC Line Item.
        if ( arrangedList.length > 0 ) {
            if ( arrangedList[0] === null || arrangedList[0] === undefined) {
                arrangedList = arrangedList.slice(1);
            }
            rowNum = 0;
            arrangedList = arrangedList.map(row => {
                row['rowNum'] = rowNum++;
                return row;
            });
        }




        let initialState = createDataState(arrangedList, initialGridState);
        let res = process(arrangedList, initialGridState);
        setDataState(initialState);
        setRows(arrangedList);
        setResults(res);
        setDefaultSelection(res);
        console.log('results.data size   ' + results.total)
        console.log('results.data' + results.data)

        setLoading(false);
    }

    const loadData = (orgId) => {
        console.log('loading corp Hist for: ' + orgId)
        let params = {};
        if ( orgId !== undefined && orgId !== null ) {
            setLoading(true)
            params['orgId'] = orgId;
            console.log(params, orgId);
            getData('/api/unprocessed-gift-cards/line-items', params, setData);
        } else {
            setDataState(initialGridState);
            setRows([]);
            setResults({data:[], total: 0});
            setDefaultSelection({});
        }
    }

    const onSelectionChange = (event) => {
        const newSelectedState = getSelectedState({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        let selectedField = Object.keys(newSelectedState)[0];

        let selectedRow = results.data.find(obj => {
            return obj.rowNum === Number(selectedField);
        })
        setSelectedRow(selectedRow);
        updateSelectedState(newSelectedState);
    }


    /**
     * When virtual scrolling is enabled for both filter change and
     * scroll event this event will be fired.
     * DO not using onPageChange
     * @param event
     */
    const dataStateChange = (event) => {
        console.log('data change' + event.dataState.skip)
        let updatedDataState = createDataState(rows, event.dataState);

        let filterChanged =  (dataState.filter !== updatedDataState.dataState.filter)?true:false;


        console.log(updatedDataState.dataState)
        setResults(updatedDataState.result);
        setDataState(updatedDataState.dataState);
        if ( event.syntheticEvent.type !== 'scroll' && filterChanged) {
            setDefaultSelection(updatedDataState.result);
        }
    }
    const onKeyDown = (event) => {
        const newSelectedState = getSelectedStateFromKeyDown({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        let selectedField = Object.keys(newSelectedState)[0];
        if ( selectedField) {
            updateSelectedState(newSelectedState);
        }
    };



    useEffect(() => {
        console.log(props.orgId);
        loadData(props.orgId);
    }, [props.orgId]);


    const useLineItemHandler=()=>{
        console.log(selectedRow)
        //props.selectHandler(selectedRow);
        props.useHandler(selectedRow, false);
    };

    const Count = (props) => {
        const count = (results.data) ? results.total : 0;
        return (
            <td colSpan={props.colSpan} className='k-grid-footer-sticky' style={props.style}>
                Count: {count}
            </td>
        );
    };

    const CheckBoxFilter = (props) => (
        <ColumnMenuCheckboxFilter
            {...props}
            data={results.data}/>
    );

    const popupCallBackHandler=(obj)=>{
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (
        <div>
            {loading && <Loader size="large" type={'infinite-spinner'}/>}
            {results &&
            <>
                <fieldset>
                    <legend align={'left'}>Line Item</legend>
                    <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>
                    <Tooltip openDelay={1500} position="right">
                        <Grid
                            style={{
                                height: "340px",
                            }}
                            rowHeight={10}
                            pageSize={pageSize}
                            total={results.total}
                            skip={skip}
                            data={orderBy(results.data, sort).slice(skip, skip + pageSize).map((item) => ({
                                ...item,
                                [SELECTED_FIELD]: selectedState[idGetter(item)],
                            }))}
                            {...dataState}
                            onDataStateChange={dataStateChange}
                            onKeyDown={onKeyDown}
                            sortable={true}
                            sort={sort}
                            onSortChange={e => {
                                setSort(e.sort);
                            }}
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
                            ref={gridRef}
                            rowRender={(trElement, dataItem) =>
                                copyCellRowRender(trElement, dataItem, { grid: gridRef, popupCallBack: popupCallBackHandler})
                            }
                        >
                            <GridToolbar>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    width: '100%'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: '16px',
                                        alignItems: 'flex-start',
                                        width: '5%'
                                    }}>

                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: '16px',
                                        alignItems: 'center',
                                        justifyContent: 'right',
                                        width: '90%'
                                    }}>
                                    </div>
                                    <div style={{alignItems: 'center', justifyContent: 'right', width: '5%'}}>
                                        <Button disabled={selectedRow===undefined?true:false} onClick={useLineItemHandler}
                                                className="k-button k-button-primary">Use</Button>
                                    </div>
                                </div>

                            </GridToolbar>
{/*
                            <Column field={'rowNum'} />
*/}
                            <Column field={'lineItem'} {...ActiveColumnProps('lineItem', dataState)}
                                    title='Line Item Name'
                                    footerCell={Count}
                                    cell={TooltipCell}
                                    columnMenu={ColumnMenu}/>
                            <Column field={'createDate'}  {...ActiveColumnProps('createDate', dataState)}
                                    title='Creation Date of Line Item' filter={'date'}
                                    format="{0:yyyy-MM-dd}"
                                    cell={TooltipCell}
                                    columnMenu={ColumnMenu} />

                            <Column field={'feeRate'} {...ActiveColumnProps('feeRate', dataState)}
                                    title='Fee Rate'
                                    cell={CurrencyCellWithToolTip}
                                    columnMenu={ColumnMenu}/>
                            <Column field={'underwritingRate'} {...ActiveColumnProps('underwritingRate', dataState)}
                                    title='Underwriting Rate'
                                    cell={CurrencyCellWithToolTip}
                                    columnMenu={ColumnMenu}/>

                            <Column field={'underwritingCode'} {...ActiveColumnProps('underwritingCode', dataState)}
                                    title='Underwriting Code' cell={TooltipCell}
                                    columnMenu={ColumnMenu}/>
                            <Column field={'lastUse'} {...ActiveColumnProps('lastUse', dataState)}
                                    title='Last Use'
                                    columnMenu={ColumnMenu}/>
                            <Column field={'enabled'} {...ActiveColumnProps('enabled', dataState)}
                                    title='Enabled?' cell={BooleanYesNoCell}
                                    columnMenu={ColumnMenu}
                                    columnMenu={(props) => (
                                        <GridColumnMenuFilter {...props} filterUI={YesNoFilter} expanded={true}/>
                                    )}
                            />


                        </Grid>
                    </Tooltip>
                </fieldset>
            </>
            }
        </div>
    );

}

export  default LineItemGrid;