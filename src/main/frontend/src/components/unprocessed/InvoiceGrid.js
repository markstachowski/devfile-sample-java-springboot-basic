import {getSelectedState, getSelectedStateFromKeyDown, Grid, GridToolbar} from "@progress/kendo-react-grid";
import Button from "@progress/kendo-react-buttons/dist/es/Button";
import {GridColumn as Column} from "@progress/kendo-react-grid/dist/npm/GridColumn";
import {
    ActiveColumnProps,
    ColumnMenu,
    copyCellRowRender,
    CurrencyCell,
    CurrencyCellWithToolTip,
    TooltipCell
} from "../common/gridUtils";
import React, {useEffect, useRef, useState} from "react";
import {postData} from "../common/api";
import {Loader} from "@progress/kendo-react-indicators";
import {getter, orderBy, process} from "@progress/kendo-data-query";
import gbNumbers from 'cldr-numbers-full/main/en/numbers.json';
import enDateFields from 'cldr-dates-full/main/en/dateFields.json';
import enCaGregorian from 'cldr-dates-full/main/en/ca-gregorian.json';
import {load} from '@progress/kendo-react-intl';
import {GridCellContextMenu} from "../common/GridCellContextMenu";
import {Tooltip} from "@progress/kendo-react-tooltip";


gbNumbers.main.en.numbers['decimalFormats-numberSystem-latn'].standard =
    '#######';

enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.full =
    'yyyy-MM-dd';
enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.short = 'yyyy-MM-dd';

load(gbNumbers, enDateFields, enCaGregorian);

const DATA_ITEM_KEY = "rowNum";
const SELECTED_FIELD = "selected";
const idGetter = getter(DATA_ITEM_KEY);


const InvoiceGrid = (props) => {
    const pageSize = 50;
    const [skip, setSkip] = React.useState(0);

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

    const gridRef=useRef();
    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({data: [], total: 0});
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
        setSelectedState(newSelectedState);
    }


    /**
     * When virtual scrolling is enabled for both filter change and
     * scroll this event will be fired.
     * DO not use onPageChange
     * @param event
     */
    const dataStateChange = (event) => {
        //console.log('data change' + event.dataState.skip)
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
            setSelectedState(newSelectedState);
        }
    };


    const setDefaultSelection = (res) => {
        let selectedState = {};
        if (res !== undefined && res.total > 0) {
            selectedState[res.data[0].rowNum] = true;
        }
        setSelectedState(selectedState)
        setSelectedRow(res.data[0])
        props.selectHandler(res.data[0], true);
    }


    const setData = (response) => {
        console.log(response)
        if (response !== undefined && response !== '') {
            let i = 0;
            let list = response.map((row) => {
                row['rowNum'] = i++;
                if (row.paidDate !== undefined && row.paidDate !== null && row.paidDate !== '') {
                    row['paidDate'] = new Date(row.paidDate);
                }
                row['memo'] = 'Description: ' + ( (row.description!==null)?row.description:' ') + "; Internal Description: " + ((row.internalDescription!==null)?row.internalDescription:'');

                return row;
            })
            let initialState = createDataState(list, initialGridState);
            let res = process(list, initialGridState);
            setDataState(initialState);
            setResults(res);
            setDefaultSelection(res);
            setRows(list);
        }
        setLoading(false)
    }

    const loadData = (giftCardIds) => {
        if (giftCardIds !== undefined && giftCardIds !== undefined && giftCardIds.length > 0) {
            setLoading(true)
            console.log('loading onvoice grid with ', giftCardIds);
            postData('/api/unprocessed-gift-cards/invoices', giftCardIds, setData);
        }
    }

    useEffect(() => {
        console.log(props.giftCardIds);
        loadData(props.giftCardIds);
    }, [props.giftCardIds]);

    const useInvoiceHandler = () => {
        props.useHandler(selectedRow, false);
    }

    const popupCallBackHandler=(obj)=>{
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (
        <>
            {loading && <Loader size="large" type={'infinite-spinner'}/>}
            {results &&
            <div>
                <fieldset>
                    <legend align={'left'}>Invoice Information</legend>
                    <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>
                    <Tooltip openDelay={1500} position="right">
                    <Grid
                        style={{
                            height: "300px",
                        }}
                        rowHeight={10}
                        pageSize={pageSize}
                        total={results.total}
                        skip={skip}
                        data={results.data.slice(skip, skip + pageSize).map((item) => ({
                            ...item,
                            [SELECTED_FIELD]: selectedState[idGetter(item)],
                        }))}
                        {...dataState}
                        onDataStateChange={dataStateChange}
                        onKeyDown={onKeyDown}
                        sortable={true}
/*                        sort={sort}
                        onSortChange={e => {
                            setSort(e.sort);
                        }}*/
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
                                    <Button disabled={true} disabled={true}
                                            className="k-button k-button-primary">View in Salesforce</Button>

                                </div>
                                <div style={{alignItems: 'center', justifyContent: 'right', width: '5%'}}>
                                    <Button disabled={selectedRow===undefined?true:false} onClick={useInvoiceHandler}
                                            className="k-button k-button-primary">Use</Button>
                                </div>
                            </div>
                        </GridToolbar>

                        <Column field={'lineItem'} title='Line Item'       {...ActiveColumnProps('lineItem', dataState)} columMenu={ColumnMenu} cell={TooltipCell}/>
                        <Column field={'feeRate'} title='Fee Rate'        {...ActiveColumnProps('feeRate', dataState)} columMenu={ColumnMenu} filter={'numeric'} cell={CurrencyCellWithToolTip}/>
                        <Column field={'addonRate'} title='Add-on Rate'     {...ActiveColumnProps('addonRate', dataState)} columMenu={ColumnMenu} filter={'numeric'} cell={CurrencyCellWithToolTip}/>
                        <Column field={'memo'} title='Invoice Memo'    {...ActiveColumnProps('memo', dataState)} columMenu={ColumnMenu} cell={TooltipCell}/>
                        <Column field={'paidDate'} title='Paid Date'       {...ActiveColumnProps('paidDate', dataState)} columMenu={ColumnMenu} filter={'date'} format="{0:yyyy-MM-dd}" cell={TooltipCell}/>
                        <Column field={'state'} title='Invoice Status'  {...ActiveColumnProps('state', dataState)} columMenu={ColumnMenu} cell={TooltipCell}/>
                    </Grid>
                    </Tooltip>
                </fieldset>
            </div>
            }

        </>
    )
}

export default InvoiceGrid;