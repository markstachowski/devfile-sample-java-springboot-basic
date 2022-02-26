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
import useWindowDimensions from "../common/WindowDimensions";
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


const CorpPartnerHistGrid = (props)=> {

    const {width, height} = useWindowDimensions();

    const pageSize = 50;
    const [skip, setSkip] = React.useState(0);

    const initialGridState = {
        take: pageSize,
        skip: 0,
        filter: null,
        sort: [
            {
                field: 'purchaseDate',
                dir: 'desc'
            }
        ],
        selection: []
    };

    const gridRef = useRef();
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

    const setDefaultSelection = (res) => {
        let selectedState = {};
        if (res !== undefined && res.total > 0) {
            selectedState[res.data[0].rowNum] = true;
            setSelectedRow(res.data[0]);
            props.useHandler(res.data[0], true);
        }
        setSelectedState(selectedState)
    }

    const setData=(response) => {
        //console.log(response)
        let rowNum = 0;
        let list = response.map(row => {
            if (row.purchaseDate !== null && row.purchaseDate !== undefined && row.purchaseDate !== 'Multiple') {
                row['purchaseDate'] = new Date(row.purchaseDate);
            }
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
        console.log('results.data size   ' + results.total)
        setDefaultSelection(res);
        setLoading(false);
    }

    const loadData = (orgId) => {
        console.log('loading corp Hist for: ' + orgId)
        let params = {};
        if ( orgId !== undefined && orgId !== null ) {
            setLoading(true)
            params['orgId'] = orgId;
            console.log(params, orgId);
            getData('/api/unprocessed-gift-cards/purchase-history', params, setData);
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
        //console.log(selectedRow.giftCardIds);
        setSelectedState(newSelectedState);
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
        //console.log(updatedDataState.dataState)
        let filterChanged =  (dataState.filter !== updatedDataState.dataState.filter)?true:false;

        setResults(updatedDataState.result);
        setDataState(updatedDataState.dataState);
        if ( event.syntheticEvent.type !== 'scroll' && filterChanged) {
            setDefaultSelection(updatedDataState.result)
        }
    }
    const onKeyDown = (event) => {
        const newSelectedState = getSelectedStateFromKeyDown({
                event,
                selectedState: selectedState,
                dataItemKey: DATA_ITEM_KEY,
            });

        //only set the state if the event is on a row/cell
        let selectedField = Object.keys(newSelectedState)[0];
        if ( selectedField) {
            setSelectedState(newSelectedState);
        }
    };

    useEffect(() => {
        //console.log(props.orgId);
        loadData(props.orgId);
    }, [props.orgId]);


    const useCorpPartnerHandler=()=>{
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
                        <legend align={'left'}>Corporate Partner History</legend>
                        <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>
                        <Tooltip openDelay={1500} position="right">
                            <Grid
                                style={{
                                    height: "300px",
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
/*                                sort={sort}
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
                                        </div>
                                        <div style={{alignItems: 'center', justifyContent: 'right', width: '5%'}}>
                                            <Button disabled={selectedRow===undefined?true:false} onClick={useCorpPartnerHandler}
                                                    className="k-button k-button-primary">Use</Button>
                                        </div>
                                    </div>

                                </GridToolbar>
                                <Column field={'purchaseDate'}  {...ActiveColumnProps('purchaseDate', dataState)}
                                        title='Purchase Date' filter={'date'}
                                        format="{0:yyyy-MM-dd}"
                                        width={width/12} locked={false}
                                        columnMenu={ColumnMenu} footerCell={Count} cell={TooltipCell}/>
                                <Column field={'paymentRef'} {...ActiveColumnProps('paymentRef', dataState)}
                                        title='Payment Reference'
                                        width={width/10} locked={false}
                                        cell={TooltipCell}
                                        columnMenu={ColumnMenu}/>

                                <Column field={'exchangeRate'} {...ActiveColumnProps('exchangeRate', dataState)}
                                        title='Exchange Rate'
                                        width={width/16} locked={false}
                                        cell={CurrencyCellWithToolTip}
                                        columnMenu={ColumnMenu}/>

                                <Column field={'presentmentCurrency'} {...ActiveColumnProps('presentmentCurrency', dataState)}
                                        title='Presentment Currency' width={width/14} locked={false} cell={TooltipCell}
                                        columnMenu={ColumnMenu}/>


                                <Column field={'purchaseAmountTotal'} {...ActiveColumnProps('purchaseAmountTotal', dataState)}
                                        title='Sum of Purchase Amount'
                                        width={width/12} locked={false}
                                        cell={CurrencyCellWithToolTip}
                                        columnMenu={ColumnMenu}/>

                                <Column field={'settlementCurrency'} {...ActiveColumnProps('settlementCurrency', dataState)}
                                        title='Settlement Currency' width={width/14} locked={false} cell={TooltipCell}
                                        columnMenu={ColumnMenu}/>

                                <Column
                                    field={'feeRate'} {...ActiveColumnProps('feeRate', dataState)}
                                    title='Fee Rate' width={width/14} cell={CurrencyCellWithToolTip}
                                    filter={'numeric'}
                                    columnMenu={ColumnMenu}/>
                                <Column
                                    field={'feeAddonRate'} {...ActiveColumnProps('feeAddonRate', dataState)}
                                    title='Fee Addon Rate' width={width/12} cell={CurrencyCellWithToolTip}
                                    filter={'numeric'}
                                    columnMenu={ColumnMenu}/>

                                <Column
                                    field={'addonRate'} {...ActiveColumnProps('addonRate', dataState)}
                                    title='Addon Rate' width={width/14} cell={CurrencyCellWithToolTip}
                                    filter={'numeric'}
                                    columnMenu={ColumnMenu}/>

                                <Column
                                    field={'underwritingRate'} {...ActiveColumnProps('underwritingRate', dataState)}
                                    title='Underwriting Rate' width={width/14} cell={CurrencyCellWithToolTip}
                                    filter={'numeric'}
                                    columnMenu={ColumnMenu}/>

                                <Column
                                    field={'underwritingCode'} {...ActiveColumnProps('underwritingCode', dataState)}
                                    title='Underwriting Code' width={width/14} columnMenu={ColumnMenu} cell={TooltipCell}/>

                                <Column field={'netValueTotal'}  {...ActiveColumnProps('netValueTotal', dataState)}
                                        title={'Sum Net Value'}
                                        width={width/12} filter={'numeric'}
                                        cell={CurrencyCellWithToolTip} columnMenu={ColumnMenu}/>

                                <Column field={'netValueRate'}  {...ActiveColumnProps('netValueRate', dataState)}
                                        title={'Net Value Rate'}
                                        width={width/12} filter={'numeric'}
                                        cell={CurrencyCellWithToolTip} columnMenu={ColumnMenu}/>
                            </Grid>
                        </Tooltip>
                    </fieldset>
            </>
            }
        </div>
    );

}

export  default CorpPartnerHistGrid;