import React, {useEffect, useRef, useState} from 'react';
import {getData} from '../components/common/api';
import {
    ActiveColumnProps,
    BooleanYesNoCell,
    ColumnMenu,
    ColumnMenuCheckboxFilter, HeaderCell, CurrencyCell,
    YesNoFilter, TooltipCell, copyCellRowRender, CurrencyCellWithToolTip
} from "../components/common/gridUtils";
import {
    getSelectedState,
    getSelectedStateFromKeyDown,
    Grid, GRID_COL_INDEX_ATTRIBUTE,
    GridColumn as Column,
    GridColumnMenuFilter, GridColumnMenuSort,
    GridToolbar,
} from '@progress/kendo-react-grid';
import { Loader } from "@progress/kendo-react-indicators";
import {process} from '@progress/kendo-data-query';
import {getter} from "@progress/kendo-react-common";
import {ExcelExport} from '@progress/kendo-react-excel-export';
import DesignationSearch from '../components/designation/DesignationSearch';
import GiftCardGrid from "../components/designation/GiftCardGrid";

import { load } from '@progress/kendo-react-intl';
import gbNumbers from 'cldr-numbers-full/main/en/numbers.json';
import enDateFields from 'cldr-dates-full/main/en/dateFields.json';
import enCaGregorian from 'cldr-dates-full/main/en/ca-gregorian.json';
import DesignationGiftCards from "../components/designation/DesignationGiftCards";
import ValidationMessageList from '../components/validation/ValidationMessageList';
import {useTableKeyboardNavigation} from "@progress/kendo-react-data-tools";
import { Tooltip } from '@progress/kendo-react-tooltip';
import useWindowDimensions from "../components/common/WindowDimensions";
import Button from "@progress/kendo-react-buttons/dist/es/Button";
import * as PropTypes from "prop-types";
import {GridCellContextMenu} from "../components/common/GridCellContextMenu";

gbNumbers.main.en.numbers['decimalFormats-numberSystem-latn'].standard =
    '#######';

enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.full =
    'yyyy-MM-dd';
enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.short = 'yyyy-MM-dd';

load(gbNumbers, enDateFields, enCaGregorian);

const DATA_ITEM_KEY = "designationId";
const SELECTED_FIELD = "selected";
const idGetter = getter(DATA_ITEM_KEY);

const DesignationAssignment = () => {




    const {width, height} = useWindowDimensions();
    const initialGridState = {
        filter: null,
        sort: [
            {
                field: 'designationId',
                dir: 'asc'
            }
        ],
    };

    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);

    const [designations, setDesignations] = useState([]);
    const [validationMessages, setValidationMessages] = useState([]);
    const [results, setResults] = useState({data: []});
    const [dataState, setDataState] = useState(initialGridState);
    const [selectedState, setSelectedState] = useState({});
    const [giftCards, setGiftCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [designationRequestId, setDesignationRequestId] = useState();
    const [reloadSearch, setReloadSearch] = useState(new Date());
    const assignmentCompleteHandler = () => {
        setValidationMessages([]);
        //refresh the data from backend.
        //getData('/api/gift-card-designations', {}, setData);
        setReloadSearch(new Date());
        setSelectedState({});
    };

    const assignmentHandler = () => {
        setStartAssign(new Date());
    };


    const [startAssign, setStartAssign] = useState(undefined);

    const onSelectionChange = (event) => {
        const newSelectedState = getSelectedState({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        processSelectedState(newSelectedState);
    };

    const onKeyDown = (event) => {
        const newSelectedState = getSelectedStateFromKeyDown({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        processSelectedState(newSelectedState);
    };

    const processSelectedState = (newSelectedState) => {
        let allKeys = Object.keys(newSelectedState);
        let designationIdKeyIndex = allKeys.indexOf('designationId');
        if ( designationIdKeyIndex > -1) {
            allKeys.splice(designationIdKeyIndex, 1);
        }
        let selectedField = undefined;
        if ( allKeys.length > 0 ) {
            selectedField = allKeys[0];
        }
        newSelectedState.designationId = selectedField;

        //if the selection changes in the designation grid reset the
        //giftcard grid.
        if ( selectedField !== selectedState.designationId) {
            setDesignationRequestId(new Date())

        }
        //erase validation messages.
        setValidationMessages([])
        setSelectedState(newSelectedState);
    }


    const exportToExcel = useRef(null);
    const designationsGrid = useRef();

    const exportToExcelHandler = () => {
        if (exportToExcel.current !== null) {
            const data = results.data.map(d => {
                return {
                    ...d,
                    'isNetValueCalculated': d.isNetValueCalculated ? 'Yes' : 'No',
                    'giftCards': d.giftCards ? 'Yes' : 'No'
                }
            });

            exportToExcel.current.save(data, designationsGrid.current.columns);
        }
    };

    const createDataState = (list, dataState) => {
        return {
            result: process(list.slice(0), dataState),
            dataState: dataState
        };
    };

    const fetchDesignationsHandler = () => {
        const params = {};
        getData('/api/gift-card-designations', params, setData);
        setLoading(true);
    };

    const setData = (responseDesignations) => {
        let list = responseDesignations.map(currDign => {
            currDign['createDate'] = new Date(currDign.createDate);
            currDign['isNetValueCalculated'] = currDign.netValue ? true : false;
            currDign['selected'] = false;
            return currDign;
        });

        if (list === undefined) {
            list = [];
        }


        let initialState = createDataState(list, dataState);
        let res = process(list, initialGridState);
        setResults(res);
        setDataState(initialState.dataState);
        setDesignations(list);
        setSelectedState({})
        setDesignationRequestId(new Date().getTime());
        setLoading(false);
    };

    const dataStateChange = event => {
        let updatedDataState = createDataState(designations, event.dataState);

        if ( selectedState.designationId !== undefined) {

            //Did I click on the same selected row, then nothing to do.
            let selectedDesigArray = updatedDataState.result.data.filter( (designation) => {
               if ( designation.designationId === Number(selectedState.designationId) ) {
                   return designation;
               }
            });

            if ( selectedDesigArray === undefined || selectedDesigArray.length === 0 ) {
                setSelectedState({});
                setDesignationRequestId(new Date())
            }
        }
        setResults(updatedDataState.result);
        setDataState(updatedDataState.dataState);
    }

    /**
     * to make checkbox options in the me u filters.
     * @param props
     * @returns {JSX.Element}
     * @constructor
     */
    const CheckBoxFilter = (props) => (
        <ColumnMenuCheckboxFilter
            {...props}
            data={designations}/>
    );

    const addValidationMessagesHandler = (messages) => {
        setValidationMessages(messages);
    }

    const Count = (props) => {
        const count = (results.data)?results.data.length:0;

        return (
            <td colSpan={props.colSpan} className='k-grid-footer-sticky' style={props.style}>
                Count: {count}
            </td>
        );
    };

    const popupCallBackHandler=(obj)=>{
        //console.log( obj.offset, obj.cellValue);
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (
        <div style={{padding: '0 4px'}}>
            <div>
                <h4>Designation Assignment</h4>
            </div>
            <DesignationSearch setDataCallBack={setData} setLoaderCallBack={setLoading} reload={reloadSearch}/>
            {loading && <Loader size="large" type={'infinite-spinner'} />}
            {designations &&
            <>
                <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>
                <div>
                    <fieldset>
                        <legend align={'left'}>Designations for Gift Cards</legend>
                        <ExcelExport fileName="designations" ref={exportToExcel}/>
                        <Tooltip openDelay={1000} position="right" >
                        <Grid
                            data={results.data.map((item) => ({
                                ...item,
                                [SELECTED_FIELD]: selectedState[idGetter(item)],
                            }))} {...dataState}
                            onDataStateChange={dataStateChange}
                            sortable={true}
                            rowHeight={10}
                            style={{
                                maxWidth: "98vw",
                                maxHeight: "300px"
                            }}
                            resizable={true}
                            dataItemKey={DATA_ITEM_KEY}
/*
                            scrollable={'virtual'}
*/
                            selectedField={SELECTED_FIELD}
                            selectable={{
                                enabled: true,
                                drag: false,
                                cell: false,
                                mode: 'single'
                            }}
                            navigatable={true}
                            onSelectionChange={onSelectionChange}
                            onKeyDown={onKeyDown}
                            ref={designationsGrid}
                            rowRender={(trElement, dataItem) =>
                                copyCellRowRender(trElement, dataItem, { grid: designationsGrid, popupCallBack: popupCallBackHandler})
                            }
                        >
                            <GridToolbar>
                                <Button
                                    title="Export Excel"
/*
                                    className="k-button k-primary"
*/
                                    onClick={exportToExcelHandler}
                                    tabIndex={-1}>
                                    Export to Excel
                                </Button>
                            </GridToolbar>
                            <Column field={'designationId'}  {...ActiveColumnProps('designationId', dataState)} title='Designation ID'
                                    width={width*.08} filter={'numeric'}
                                    columnMenu={ColumnMenu} footerCell={Count} cell={TooltipCell}/>
                            <Column field={'createDate'} {...ActiveColumnProps('createDate', dataState)} title='Date'
                                    format="{0:yyyy-MM-dd}"
                                    width={width*.054}
                                    filter={'date'} columnMenu={ColumnMenu} cell={TooltipCell}/>
                            <Column field={'donorName'} {...ActiveColumnProps('donorName', dataState)} title='Donor Name' width={width*.08}
                                    columnMenu={ColumnMenu} cell={TooltipCell}/>
                            <Column field={'lineItem'} {...ActiveColumnProps('lineItem', dataState)} title='Line Item' width={width*.13}
                                    columnMenu={ColumnMenu} cell={TooltipCell}/>
                            <Column cell={TooltipCell} {...ActiveColumnProps('donorComments', dataState)}
                                    title='Donor Comments'  /*headerCell={HeaderCell}*/
                                    width={width*.14} columnMenu={ColumnMenu}/>

                            <Column field={'relatedInvoiceNumber'} {...ActiveColumnProps('relatedInvoiceNumber', dataState)}
                                    title='Related Inv ID' width={width*.08} columnMenu={ColumnMenu} cell={TooltipCell}/>
                            <Column field={'giftCards'}  {...ActiveColumnProps('giftCards', dataState)} title={'Gift Cards?'}
                                    width={width*.06}
                                    cell={BooleanYesNoCell} columnMenu={(props) => (
                                <GridColumnMenuFilter {...props} filterUI={YesNoFilter} expanded={true}/>
                            )}/>
                            <Column field={'presentmentValueCurrency'} {...ActiveColumnProps('presentmentValueCurrency', dataState)}
                                    title='Presentment Currency' width={width*.072} columnMenu={CheckBoxFilter} cell={TooltipCell}/>
                            <Column field={'presentmentValue'} {...ActiveColumnProps('presentmentValue', dataState)} title='Presentment Amount' width={width*.072}
                                    cell={CurrencyCellWithToolTip} filter={'numeric'}
                                    columnMenu={ColumnMenu}/>
                            <Column field={'settlementValueCurrency'} {...ActiveColumnProps('settlementValueCurrency', dataState)}
                                    title='Settlement Currency' width={width*.072} columnMenu={CheckBoxFilter} cell={TooltipCell}/>
                            <Column field={'settlementValue'} {...ActiveColumnProps('settlementValue', dataState)} title='Settlement Amount' width={width*.072}
                                    cell={CurrencyCellWithToolTip} filter={'numeric'}
                                    columnMenu={ColumnMenu}/>

                            <Column field={'netValue'} {...ActiveColumnProps('netValue', dataState)} title='Net Value' width={width*.065}
                                       cell={CurrencyCellWithToolTip} filter={'numeric'}
                                       columnMenu={ColumnMenu}/>

{/*                            <Column field={'feeRate'} {...ActiveColumnProps('feeRate', dataState)} title='Fee Rate' width={width*.06}
                                    cell={CurrencyCell} filter={'numeric'}
                                    columnMenu={ColumnMenu}/>
                            <Column field={'addonRate'} {...ActiveColumnProps('addonRate', dataState)} title='Add on Rate' width={width*.06}
                                    cell={CurrencyCell} filter={'numeric'}
                                    columnMenu={ColumnMenu}/>
                            <Column field={'netRate'} {...ActiveColumnProps('netRate', dataState)} title='Net Rate' width={width*.06}
                                    cell={CurrencyCell} filter={'numeric'}
                                    columnMenu={ColumnMenu}/>*/}

                        </Grid>
                        </Tooltip>
                    </fieldset>
                </div>
                <div style={{display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-start', paddingTop: '5px'}}>
                    <div style={{width: '70%'}}>
                        <GiftCardGrid addValidationMessagesHandler={addValidationMessagesHandler}
                                      designations={designations}
                                      designationId={selectedState.designationId}
                                      assignmentCompleteHandler={assignmentCompleteHandler}
                                      startAssignment={startAssign}
                                      setGiftCardsCallBackHandler={setGiftCards}
                                      designationRequestId={designationRequestId}

                        />
                    </div>
                    <div style={{width: '30%', alignItems: 'center'}}>
                        <DesignationGiftCards designations={designations}
                                              designationId={selectedState.designationId} assignHandler={assignmentHandler}
                                              giftCards={giftCards} />
                    </div>
                </div>
                <div>
                    {validationMessages.length > 0 &&
                        <div>
                            <fieldset>
                                <legend>Validation Messages</legend>

                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <ValidationMessageList items={validationMessages} />
                                </div>
                            </fieldset>
                        </div>
                    }
                </div>
            </>
            }
        </div>
    );
}
export default DesignationAssignment;