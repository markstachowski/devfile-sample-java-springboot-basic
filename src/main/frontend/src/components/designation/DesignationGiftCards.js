import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {Grid, GRID_COL_INDEX_ATTRIBUTE, GridColumn, GridToolbar} from "@progress/kendo-react-grid";
import {useTableKeyboardNavigation} from "@progress/kendo-react-data-tools";
import {load} from "@progress/kendo-react-intl";

import gbNumbers from 'cldr-numbers-full/main/en/numbers.json';
import enDateFields from 'cldr-dates-full/main/en/dateFields.json';
import enCaGregorian from 'cldr-dates-full/main/en/ca-gregorian.json';
import Toolbar from "@progress/kendo-react-buttons/dist/es/toolbar/Toolbar";
import Button from "@progress/kendo-react-buttons/dist/es/Button";
import {Tooltip} from "@progress/kendo-react-tooltip";
import {copyCellRowRender} from "../common/gridUtils";
import {GridCellContextMenu} from "../common/GridCellContextMenu";


gbNumbers.main.en.numbers['decimalFormats-numberSystem-latn'].standard =
    '#,###.00';

enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.full =
    'yyyy-MM-dd';
enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.short = 'yyyy-MM-dd';

load(gbNumbers, enDateFields, enCaGregorian);


const DesignationGiftCards = (props) => {

    const summaryGrid = useRef();

    const [assignable, setAssignable] = useState(false);
    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);


    const MULTIPLE = 'Multiple';
    const NOT_APPLICABLE = 'N/A';
    const [tableData, setTableData] = useState([]);

    const PRESENTMENT_CURRENCY_TITLE = 'Presentment Currency';
    const SETTLEMENT_CURRENCY_TITLE = 'Settlement Currency';
    const PRESENTMENT_VALUE_TITLE =  'Presentment Value';
    const SETTLEMENT_VALUE_TITLE = 'Settlement Value';
    const NET_VALUE_TITLE = 'Net Value';
    const FEE_RATE_TITLE = 'Fee Rate';
    const ADDON_RATE_TITLE = 'Add-on Rate';
    const FEE_ADD_ON_RATE_TITLE = 'Fee Add-on Rate';
    const UNDER_WRITING_RATE_TITLE = 'Underwriting Rate';
    const NET_RATE_TITLE = 'Net Rate';
    const ASSIGNED_LINE_ITEM_TITLE = 'Assigned Line Item';
    const UNDER_WRITING_CODE_TITLE = 'Underwriting Code';

    const numberFields = [PRESENTMENT_VALUE_TITLE,SETTLEMENT_VALUE_TITLE,NET_VALUE_TITLE, FEE_RATE_TITLE,ADDON_RATE_TITLE,FEE_ADD_ON_RATE_TITLE,UNDER_WRITING_RATE_TITLE, NET_RATE_TITLE];
    const currencyFields = [PRESENTMENT_VALUE_TITLE, SETTLEMENT_VALUE_TITLE,NET_VALUE_TITLE, ];

    const sum = (giftCards, field, currency) => {
        if (currency === MULTIPLE) {
            return NOT_APPLICABLE;
        } else {
            return giftCards.map(gc => Number(gc[field] || 0))
                .reduce((prev, next) => prev + next, 0);
        }
    };

    const getFieldValue = (giftCards, field, isNumber = true) => {
        let fieldValue = giftCards[0][field];
        fieldValue = !isNumber && fieldValue == null ? '' : fieldValue;

        const multiplesFound = giftCards.some(gc => {
            const valueToCompare = !isNumber && gc[field] == null ? '' : gc[field];

            return fieldValue !== valueToCompare;
        });

        return multiplesFound ? MULTIPLE : fieldValue;
    }

    const getGiftCardSummary = (giftCards) => {
        let summary = {};

        if (giftCards && giftCards.length > 0) {
            const gPresentmentValueCurrency = getFieldValue(giftCards, 'purchaseAmountCurrency', false);
            const gPresentmentValue = sum(giftCards, 'purchaseAmount', gPresentmentValueCurrency);
            const gSettlementValueCurrency = getFieldValue(giftCards, 'settlementCurrency', false);
            const gSettlementValue = sum(giftCards, 'settlementAmount', gSettlementValueCurrency);
            const gLineItem = getFieldValue(giftCards, 'lineItem', false);
            const gFeeRate = getFieldValue(giftCards, 'feeRate');
            const gAddonRate = getFieldValue(giftCards, 'addonRate');
            const gFeeAddonRate = getFieldValue(giftCards, 'feeAddonRate');
            const gUnderwritingCode = getFieldValue(giftCards, 'underwritingCode', false);
            const gUnderwritingRate = getFieldValue(giftCards, 'underwritingRate');
            const gNetRate = getFieldValue(giftCards, 'netRate');
            const gNetValue = sum(giftCards, 'netValue');

            summary = {
                gPresentmentValueCurrency,
                gPresentmentValue,
                gSettlementValueCurrency,
                gSettlementValue,
                gLineItem,
                gFeeRate,
                gAddonRate,
                gFeeAddonRate,
                gUnderwritingCode,
                gUnderwritingRate,
                gNetValue,
                gNetRate
            };
        }

        return summary;
    }

    const loadTableData = (designations, designationId, giftCards) => {
        let selectedDesignation = {};
        if (designationId) {
            selectedDesignation = designations.find(d => d.designationId === +designationId);
        }
        if ( selectedDesignation === undefined) {
            selectedDesignation = {};
        }
        const {
            gPresentmentValueCurrency,
            gPresentmentValue,
            gSettlementValueCurrency,
            gSettlementValue,
            gLineItem,
            gFeeRate,
            gAddonRate,
            gFeeAddonRate,
            gUnderwritingCode,
            gUnderwritingRate,
            gNetValue,
            gNetRate
        } = designationId ? getGiftCardSummary(giftCards) : {};


        if ( selectedDesignation.addonRate && selectedDesignation.addonRate != null ) {
            selectedDesignation.addonRate = Number(selectedDesignation.addonRate).toFixed(2);
        }

        //console.log(selectedDesignation);
        //console.log(giftCards);
        let vTableData = [];
        vTableData.push(addRowToTableData(PRESENTMENT_CURRENCY_TITLE, selectedDesignation.presentmentValueCurrency, gPresentmentValueCurrency));
        vTableData.push(addRowToTableData(PRESENTMENT_VALUE_TITLE, selectedDesignation.presentmentValue, gPresentmentValue));
        vTableData.push(addRowToTableData(SETTLEMENT_CURRENCY_TITLE, selectedDesignation.settlementValueCurrency, gSettlementValueCurrency));
        vTableData.push(addRowToTableData(SETTLEMENT_VALUE_TITLE, selectedDesignation.settlementValue, gSettlementValue));
        vTableData.push(addRowToTableData(ASSIGNED_LINE_ITEM_TITLE, selectedDesignation.lineItem, gLineItem));
        vTableData.push(addRowToTableData(FEE_RATE_TITLE, selectedDesignation.feeRate, gFeeRate));
        vTableData.push(addRowToTableData(ADDON_RATE_TITLE, (selectedDesignation.addonRate)?selectedDesignation.addonRate:undefined, gAddonRate));
        vTableData.push(addRowToTableData(FEE_ADD_ON_RATE_TITLE, selectedDesignation.feeAddonRate, gFeeAddonRate));
        vTableData.push(addRowToTableData(UNDER_WRITING_CODE_TITLE, selectedDesignation.underwritingCode, gUnderwritingCode));
        vTableData.push(addRowToTableData(UNDER_WRITING_RATE_TITLE, selectedDesignation.underwritingRate, gUnderwritingRate));
        vTableData.push(addRowToTableData(NET_VALUE_TITLE, selectedDesignation.netValue, gNetValue));
        vTableData.push(addRowToTableData(NET_RATE_TITLE, selectedDesignation.netRate, gNetRate));
        setTableData(vTableData);
    }

    const addRowToTableData = (title, designation, giftCards) => {
        let obj = {};
        obj.title = title;
        obj.designation = designation;
        obj.giftCards = giftCards;
        return obj;
    }

    useEffect(() => {
        loadTableData(props.designations, props.designationId, props.giftCards);
    }, [props.designations, props.designationId, props.giftCards]);

    useEffect(() => {
        setAssignable(props.designationId !== undefined && props.giftCards.length > 0);
    }, [props.designationId, props.giftCards]);

    const numberFormat = (value) =>{
        return Number(value).toFixed(2);
    }
     const CustomCell = (props) => {
         const field = props.field ;
         let value = props.dataItem[field];
         const navigationAttributes = useTableKeyboardNavigation(props.id);

         let align = 'left';
         if ( (numberFields.includes(props.dataItem['title']) || currencyFields.includes(props.dataItem['title'])) &&
             value !== undefined && value !== null && value!=="" && value !== MULTIPLE && value !== NOT_APPLICABLE ) {
             value = Number(props.dataItem[props.field]).toFixed(2);
             value = Number(value).toLocaleString('en-US', {minimumFractionDigits:2});

             align= 'right';
         }
        //console.log(props.dataItem['title'], align, value, numberFields.includes(props.dataItem['title']));
         return (
             <td
                 style={{textAlign: align,whiteSpace: 'nowrap', color: (value === MULTIPLE || value === NOT_APPLICABLE) ? 'red' : ''}}
                 colSpan={props.colSpan}
                 role={'gridcell'}
                 aria-colindex={props.ariaColumnIndex}
                 aria-selected={props.isSelected}
                 {...{
                     [GRID_COL_INDEX_ATTRIBUTE]: props.columnIndex,
                 }}
                 {...navigationAttributes}
                 title={value}

             >
                 {value}
             </td>
         )
    }

    const popupCallBackHandler=(obj)=>{
        //console.log( obj.offset, obj.cellValue);
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (

        <fieldset>
            <legend align={'left'}>Designation vs Gift Cards</legend>
            <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>

            <div style={{display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'baseline'}}>
                <Tooltip openDelay={1500} position="right" >
                <Grid
                    data={tableData}
                    ref={summaryGrid}
                    navigatable={true}
                    rowHeight={10}
                    rowRender={(trElement, dataItem) =>
                        copyCellRowRender(trElement, dataItem, { grid: summaryGrid , popupCallBack: popupCallBackHandler})
                    }
                >
                    <GridToolbar>
                            <Button disabled={! assignable} onClick={props.assignHandler} className="k-button gg-action">Assign</Button>
                    </GridToolbar>

                    <GridColumn field="title" title="  "/>
                    <GridColumn field="designation" title="Designation"  cell={CustomCell} />
                    <GridColumn field="giftCards" title="Gift Cards" cell={CustomCell}/>
                </Grid>
                </Tooltip>
            </div>
        </fieldset>
    );
}
export default DesignationGiftCards;