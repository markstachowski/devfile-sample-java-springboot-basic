import React, {useEffect, useState} from "react";
import {Input, NumericTextBox} from "@progress/kendo-react-inputs";
import {Error} from "@progress/kendo-react-labels";
import {Validation, ValidationType} from '../common/Validation';
import ValidationsDialog from '../common/dialog/ValidationsDialog';
import {Button} from '@progress/kendo-react-buttons';
import SuccessDialog from '../common/dialog/SuccessDialog';
import {putData} from '../common/api';

import {load} from "@progress/kendo-react-intl";
import {formatNumber} from '@telerik/kendo-intl';

import gbNumbers from 'cldr-numbers-full/main/en/numbers.json';
import enDateFields from 'cldr-dates-full/main/en/dateFields.json';
import enCaGregorian from 'cldr-dates-full/main/en/ca-gregorian.json';
import {AUD_CURRENCY, CAD_CURRENCY, EUR_CURRENCY, GBP_CURRENCY, USD_CURRENCY} from '../common/constants';
import styled, {css} from "styled-components";


gbNumbers.main.en.numbers['decimalFormats-numberSystem-latn'].standard =
    '#,###.00';

enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.full =
    'yyyy-MM-dd';
enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.short = 'yyyy-MM-dd';

load(gbNumbers, enDateFields, enCaGregorian);


gbNumbers.main.en.numbers['decimalFormats-numberSystem-latn'].standard =
    '#######';

enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.full =
    'yyyy-MM-dd';
enCaGregorian.main.en.dates.calendars.gregorian.dateFormats.short = 'yyyy-MM-dd';



const NET_VALUE_GREATER_THAN_SETTLEMENT_VALUE = new Validation('NET_VALUE_GREATER_THAN_SETTLEMENT_VALUE',
    "Net Value cannot be greater than the settlement value!",
    ValidationType.ERROR);
const UNDERWRITING_RATE_WO_UNDERWRITING_CODE = new Validation('UNDERWRITING_RATE_WO_UNDERWRITING_CODE',
    "Underwriting rate is populated, but there is no underwriting code!",
    ValidationType.ERROR);
const EXCHANGE_RATE_NULL_OR_ZERO = new Validation('EXCHANGE_RATE_NULL_OR_ZERO',
    "Exchange Rate cannot be null or zero!",
    ValidationType.ERROR);
const FEE_RATE_ZERO = new Validation('FEE_RATE_ZERO',
    "Fee Rate cannot be zero!",
    ValidationType.ERROR);
const RATES_RANGE_NOT_BETWEEN_5_AND_15 = new Validation('RATES_RANGE_NOT_BETWEEN_5_AND_15',
    "Rate(s), except for the exchange rate, are either below 5% or above 15%!",
    ValidationType.WARNING);
const DIFFERENT_CURRENCIES_AND_EXCHANGE_RATE_ONE = new Validation('DIFFERENT_CURRENCIES_AND_EXCHANGE_RATE_ONE',
    "Different currencies are detected. Exchange rate should not be 1!",
    ValidationType.WARNING);

const CURRENCY_RANGE_MAP = new Map();
CURRENCY_RANGE_MAP.set(USD_CURRENCY, [1.0, 1.0]);
CURRENCY_RANGE_MAP.set(GBP_CURRENCY, [1.1, 1.7]);
CURRENCY_RANGE_MAP.set(EUR_CURRENCY, [1.0, 1.5]);
CURRENCY_RANGE_MAP.set(AUD_CURRENCY, [0.5, 1.1]);
CURRENCY_RANGE_MAP.set(CAD_CURRENCY, [0.6, 1.0]);

const RATES_RANGE = [5, 15];
const MULTIPLE = 'Multiple';


const StyledNumericTextBox = styled(NumericTextBox)`
        ${props =>
        css`
            text-align: right;
            `
        };
    `;

const ValidationCell = props => {

    const [valid, setValid] = useState(true);
    const [errorMessage, setErrorMessage] = useState(undefined);



    useEffect((props) => {
        setValid(true);
        setErrorMessage(undefined);
    },[props.loadId ]);


    const handleOnChange = e => {
        //console.log('handleOnChange' , e)
        let validation  = props.validationMessage(props.dataItem, e.syntheticEvent, e.value);

        setValid(validation.valid);
        setErrorMessage(validation.message);


        props.onChange(
            props.dataItem,
            e.syntheticEvent,
            e.value
        );
    };


    let isNumeric = numericFields.indexOf(props.dataItem.title) >= 0;
    let value = props.dataItem.group;

    if ( isNumeric) {
        if (value!== undefined && value !== null) {
            value = Number(value);
        }else {
            value = null;
        }
        //console.log(props.dataItem.title,value);
        return (
            <>
            <StyledNumericTextBox
                required
                value={value}
                onChange={handleOnChange}
                valid={valid}
                spinners={false}
                validationMessage={errorMessage}
                format={props.dataItem.format}
            />
                { <Error>{errorMessage}</Error>}
            </>
        )
    } else {
        if ( ! value ) value = "";
        return     (
            <>
            <Input
                required
                value={value}
                onChange={handleOnChange}
                valid={valid}
/*
                spinners={false}
*/
            />
            </>
        )

    }
};

const PRESENTMENT_CURRENCY_TITLE = 'Presentment Currency';
const PRESENTMENT_VALUE_TITLE = 'Presentment Value';
const SETTLEMENT_CURRENCY_TITLE = 'Settlement Currency';
const EXCHANGE_RATE_TITLE = 'Exchange Rate';
const SETTLEMENT_VALUE_TITLE = 'Settlement Value';
const ADDON_RATE_TITLE = 'Add-on Rate';
const FEE_RATE_TITLE = 'Fee Rate';
const FEE_ADDON_RATE_TITLE = 'Fee Add-on Rate';
const UNDERWRITING_CODE_TITLE = 'Underwriting Code';
const UNDERWRITING_RATE_TITLE= 'Underwriting Rate';
const NET_RATE_TITLE = 'Net Rate';
const NET_VALUE_TITLE = 'Net Value';

const editableFields = [
    EXCHANGE_RATE_TITLE,
    ADDON_RATE_TITLE,
    FEE_RATE_TITLE,
    UNDERWRITING_CODE_TITLE,
    UNDERWRITING_RATE_TITLE
]
const numericFields = [
    PRESENTMENT_VALUE_TITLE,
    EXCHANGE_RATE_TITLE,
    SETTLEMENT_VALUE_TITLE,
    ADDON_RATE_TITLE,
    FEE_RATE_TITLE,
    FEE_ADDON_RATE_TITLE,
    UNDERWRITING_RATE_TITLE,
    NET_RATE_TITLE,
    NET_VALUE_TITLE
]


const NetValueCalculator = (props) => {

    const [state, setState] = useState({data: [], editId: null})
    const [showValidations, setShowValidations] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [assignable, setAssignable] = useState(false);

    const [loadId,setLoadId] = useState();


    const getValueByTitle=(title)=> {
        return getValueByTitleAndState(state, title);
    }


    const getValueByTitleAndState=(vState, title)=>{
        if ( vState && vState.data) {
            let row = vState.data.filter( currRow=>{
                if (  currRow)
                return currRow.title === title;
            } )
            if ( row) {
                return row[0].group;
            }
        }
    }

    const getRowByTitleAndState=(vState, title)=>{
        if ( vState && vState.data) {
            let row = vState.data.filter( currRow=>{
                if (  currRow)
                    return currRow.title === title;
            } )
            if ( row) {
                return row[0];
            }
        }
    }


    /**
     * Validation Rules by Field.
     * 1. Exchange Rate: No Negative Values and upto 3 decimals
     * 2. Addon Rate :  No Negative Values and upto 2 decimals
     * 3. FeeRate :  No Negative Values and upto 2 decimals
     * 4. Underwriting Code :
     * 5. Underwriting Rate. No Negative Values and upto 2 decimals
     * @param dataItem
     * @param event
     * @param value
     * @returns {string|boolean}
     */
    const validationMessage=(dataItem, event, value)=>{
        let message = undefined;
        let valid = true;
        if ( UNDERWRITING_CODE_TITLE !== dataItem.title ) {
            if ( value === undefined || value === null) {
                message = dataItem.title + ' is required ';
            } else if ( value < 0 ) {
                message = dataItem.title + ' can not be negative';
            }

        }
        return {valid: valid, message: message};

    }

    const handleDataChange=(dataItem, event, value)=>{
        //console.log('handleDataChange',dataItem, event, value);
    }

    const resetState = () => {
        setState({});
    }

    const loadData = () => {
        setLoadId(new Date());
        setAssignable(false);

        //resetState();
        let netValueData = props.netValueData;
        console.log(netValueData);
        //console.log(netValueData);

        /**
         * exchangeRate: 1.3820000000000001
         * feeRate:0.15
         * underwritingRate:undefined
         * presentmentCurrency:"GBP"
         * presentmentValue:5
         * settlementCurrency:"USD"
         * settlementValue:6.91
         * underwritingCode:""
         */
        /*
        addOnRate: "0"
        exchangeRate: 1.351199951171875
        feeRate: "0.1500"
        presentmentCurrency: "GBP"
        presentmentValue: 50
        purchaseAmountInd: "50.0"
        settlementAmountInd: "67.56"
        settlementAmountTotal: 67.55999755859375
        settlementCurrency: "USD"
        underwritingCode: ""
        underwritingRate: "0.0000"
         */
        let vPresentmentValue = netValueData.presentmentValue;
        let vPresentmentCurrency = netValueData.presentmentCurrency;
        let vSettlementCurrency = netValueData.settlementCurrency;
        let vAddOnRate = netValueData.addOnRate;

        //TODO WARNING
        if (vAddOnRate !== undefined && vAddOnRate !== null && vAddOnRate !== MULTIPLE) {
            vAddOnRate = Number(vAddOnRate);
        }


        let vExchangeRate = undefined;
        let vSettlementValue = netValueData.settlementAmountTotal;
        if ( vSettlementValue && vSettlementValue !== MULTIPLE) {
            vSettlementValue = Number(vSettlementValue.toFixed(2));
        }
        let vFeeAddOnRate = undefined;
        let vFeeRate = netValueData.feeRate;
        if ( vFeeRate && vFeeRate !== MULTIPLE) {
            vFeeRate = Number(vFeeRate)
        }
        let vUnderwritingCode = netValueData.underwritingCode;
        let vUnderwritingRate =  netValueData.underwritingRate;
        if ( vUnderwritingRate && vUnderwritingRate !== MULTIPLE) {
            vUnderwritingRate = Number(vUnderwritingRate)
            vUnderwritingRate = Number(vUnderwritingRate.toFixed(2));
        }
        let vNetValue = undefined;
        let vNetRate = undefined;

        //TODO warning
        if ( vFeeRate !== undefined && vFeeRate !== null && vFeeRate !== MULTIPLE) {
            vFeeRate = Number(vFeeRate);
            vFeeRate = Number((vFeeRate).toFixed(2));
        }

        if (vPresentmentValue && vSettlementValue) {
            vExchangeRate = vSettlementValue === vPresentmentValue
                ? 1
                : vSettlementValue/vPresentmentValue;

            vExchangeRate = vExchangeRate.toFixed(3);

            vFeeAddOnRate = deriveFeeAddonRate(vAddOnRate, vFeeRate, vUnderwritingRate);
            vNetRate = deriveNetRate(vAddOnRate,vFeeRate, vFeeAddOnRate, vUnderwritingRate);
            vNetValue = deriveNetValue(vSettlementValue, vNetValue);
        }



        let purchaseAmountInd  = netValueData.purchaseAmountInd ;
        if ( purchaseAmountInd && purchaseAmountInd !== MULTIPLE) {
            purchaseAmountInd = Number(purchaseAmountInd);
        }
        let netValueInd ;

        let settlementAmountInd = netValueData.settlementAmountInd;
        if ( netValueData.settlementAmountInd && ! isNaN(settlementAmountInd))  {
            settlementAmountInd = Number(settlementAmountInd).toFixed(2);
            if ( vNetRate) {
                netValueInd = deriveNetValue(settlementAmountInd, vNetRate);
            }
        }

        let values = [];
        values.push({title: PRESENTMENT_CURRENCY_TITLE, group: vPresentmentCurrency});
        values.push({title: PRESENTMENT_VALUE_TITLE, group: vPresentmentValue, ind: purchaseAmountInd, format: '##,###.##' });
        values.push({title: SETTLEMENT_CURRENCY_TITLE, group: vSettlementCurrency});
        values.push({title: EXCHANGE_RATE_TITLE, group: vExchangeRate, format: 'n3'});
        values.push({title: SETTLEMENT_VALUE_TITLE, group: vSettlementValue, ind: settlementAmountInd ,format: '##,###.##'});
        values.push({title: ADDON_RATE_TITLE, group: vAddOnRate,format: 'p2'});
        values.push({title: FEE_RATE_TITLE, group: vFeeRate, format: 'p2'});
        values.push({title: FEE_ADDON_RATE_TITLE, group: vFeeAddOnRate, format: 'p2'});
        values.push({title: UNDERWRITING_CODE_TITLE, group: vUnderwritingCode});
        values.push({title: UNDERWRITING_RATE_TITLE, group: vUnderwritingRate, format: 'p2'});
        values.push({title: NET_RATE_TITLE, group: vNetRate, format: 'p2'});
        values.push({title: NET_VALUE_TITLE, group: vNetValue, ind: netValueInd, format: '##,###,##'});

        let vState = {};
        vState['data'] = values;
        vState['editID'] = null;
        setState(vState);
        //console.log(vState);
    }

    const tableRender= (data)=> {
        let i = 0;
        let rows = [];
        data.forEach( (row) => {
            rows.push(rowRender(row, i++));
        })
        return rows;
    }

    const rowRender =(dataRow, index)=> {
        ///console.log('renderRow' , dataRow)
        if ( dataRow === undefined) {
            return ;
        }
        let col1Data = dataRow.title;
        let col2Data = dataRow.group;
        let altClass = 'k-master-row '
        altClass =+(index%2)?'':'k-alt'
        //console.log('altClass: ', altClass, index, index%2)
        let isNumeric = numericFields.indexOf(dataRow.title) >= 0 ;
        let editable = editableFields.indexOf(dataRow.title)>=0 ;
        let align = (isNumeric && ! editable?'right':'left')

        //console.log('align', dataRow.title, align);
        return (
            <tr key={'row'+index}   className={altClass} role="row" aria-rowindex={index}
                data-grid-row-index="0" style={{height: '15px'}}>
                <td colSpan="1" className="" role="gridcell" >{col1Data}
                </td>
                <td colSpan="1" className="" role="gridcell" style={{textAlign: align }} >
                    {renderGroupColumn(dataRow, index)}
                </td>
                <td colSpan="1" className="" role="gridcell" style={{textAlign: align }}>{renderIndColumn(dataRow, index)}</td>
            </tr>
        );
    };


    const renderGroupColumn=(dataRow, index)=>{
        //let onChangeMethod = 'onChange'+ dataRow.title
        //onChangeMethod= onChangeMethod.replaceAll(' ','');
        //console.log(onChangeMethod);
        let editable = (editableFields.indexOf(dataRow.title) >= 0 );
        let input =  <ValidationCell  dataItem={state.data[index]} validationMessage={validationMessage} onChange={onChange} loadId={loadId}/>;
        if ( editable) {
            return input;
        } else {
            if (state.data[index].group !== undefined && numericFields.indexOf(dataRow.title) >= 0 ) {
                //console.log(formatNumber(Number(state.data[index].group), state.data[index].format))
                return formatNumber(Number(state.data[index].group), state.data[index].format);
            } else {
                return state.data[index].group;
            }
        }

    }

    const renderIndColumn=(dataRow, index)=>{
        let val = state.data[index].ind;

        if (val !== undefined && numericFields.indexOf(dataRow.title) >= 0 && ! isNaN(val) ) {
            //console.log(formatNumber(Number(val), state.data[index].format))
            return formatNumber(Number(val), state.data[index].format);
        } else {
            return state.data[index].val;
        }
    }

    const onChange=(dataItem, event, value) => {
        //console.log(dataItem, event, value);

        let changed = false;
        let newData  = state.data.map( (row) =>{
                //key = row.title;
                if ( row.title === dataItem.title) {
                    changed = true;
                    return {...row, group: value};
                } else {
                    return {...row};
                }
            }
        )

        if ( changed ) {
            let lState = {...state, data: newData};
            //if this is one of the editable field, need to recalculate the
            //derived fields.
            if ( editableFields.indexOf(dataItem.title) >= 0 ) {
                lState = reCalcDerivedFields(lState);
            }
            setState(lState);
        }
    }


    const reCalcDerivedFields=(lState)=> {

        //fields used in calculations
        let addonRate = getValueByTitleAndState(lState, ADDON_RATE_TITLE);
        let feeRate = getValueByTitleAndState(lState, FEE_RATE_TITLE);
        let underwritingRate = getValueByTitleAndState(lState, UNDERWRITING_RATE_TITLE);
        if ( underwritingRate ) {
            underwritingRate = Number(underwritingRate);
        }
        let settlementValue;
        let settlementValueInd;

        let settlementRow = getRowByTitleAndState(lState, SETTLEMENT_VALUE_TITLE);
        if ( settlementRow) {
            settlementValue = settlementRow.group;
            settlementValueInd = settlementRow.ind;
        }
        let sett
        //calculated fields
        //depends on addonRate, feeRate, underwritingRate
        let feeAddonRate  = deriveFeeAddonRate(addonRate, feeRate, underwritingRate);

        //depends on addonRate, feeRate, feeAddonRate, underwritingRate
        let netRate  = deriveNetRate(addonRate, feeRate, feeAddonRate, underwritingRate);

        //depends on settlementValue and netRate
        let netValue  = deriveNetValue(settlementValue, netRate);

        let netValueInd;
        if (! isNaN(settlementValueInd)){
            netValueInd =  deriveNetValue(settlementValueInd, netRate);
        } else {
            netValueInd = 'NA';
        }

        lState.data.forEach((row, index)=>{
            if ( row ) {
                switch (row.title) {
                    case NET_VALUE_TITLE:
                        row['group'] = netValue;
                        row['ind'] = netValueInd;
                        break;
                    case NET_RATE_TITLE:
                        row['group'] = netRate;
                        break;
                    case FEE_ADDON_RATE_TITLE:
                        row['group'] = feeAddonRate;
                        break;
                }
            }
        });


        if (netValue) {
            setAssignable(true);
        } else {
            setAssignable(false);
        }
        //console.log('Changed State ' , lState.data);
        return lState;
    }

    const deriveFeeAddonRate = (addonRate, feeRate, underwritingRate) => {
        if (addonRate === undefined || addonRate === null ||
            feeRate === undefined || feeRate === null ||
            underwritingRate === undefined || underwritingRate === undefined) {
            return undefined;
        }

        let feeAddOnRate = Math.max(addonRate + underwritingRate - feeRate, 0);
        feeAddOnRate = Number(feeAddOnRate.toFixed(2));
        //console.log('feeAddOnRate :' + feeAddOnRate + '= ' + addonRate + '+' + underwritingRate + '-' + feeRate)
        return feeAddOnRate;
    }
    const deriveNetRate = (addonRate, feeRate, feeAddonRate, underwritingRate) => {

        if (addonRate === undefined || addonRate === null ||
            feeRate === undefined || feeRate === null ||
            feeAddonRate === undefined || feeAddonRate === null ||
            underwritingRate === undefined || underwritingRate === null) {
            return undefined;
        }


        let netRate = 1 + addonRate - feeRate - feeAddonRate + underwritingRate;
        netRate = Number(netRate.toFixed(2));

        //console.log('netRate :'+ netRate +'= 1 +' + addonRate + ' - ' + feeRate + '-' + feeAddonRate + '+ ' + underwritingRate)

        return netRate;
    }
    const deriveNetValue = (settlementValue, netRate) => {
        if (settlementValue === undefined || settlementValue === null ||
            netRate === undefined || netRate === null) {
            return undefined;
        }
        let netValue = settlementValue * netRate;
        netValue = Number(netValue.toFixed(2));

        //console.log('netValue=' + netValue + ' =' + settlementValue + '* netRate'+ netRate)
        return netValue;
    }


    const assignHandler = () => {
        const violations = runValidations();

        if (violations.length > 0) {
            toggleShowValidations();
        } else {
            assignNetValueHandler();
        }
    };

    const runValidations = () => {
        const warningsFound = [];
        const errorsFound = [];
        let exchangeRate = getValueByTitle(EXCHANGE_RATE_TITLE);
        let netValue = getValueByTitle(NET_VALUE_TITLE);
        let underwritingRate = getValueByTitle(UNDERWRITING_RATE_TITLE);
        let underwritingCode = getValueByTitle(UNDERWRITING_CODE_TITLE);
        let settlementValue = getValueByTitle(SETTLEMENT_VALUE_TITLE);
        let feeRate = getValueByTitle(FEE_RATE_TITLE);
        let settlementCurrency = getValueByTitle(SETTLEMENT_CURRENCY_TITLE);
        let presentmentCurrency = getValueByTitle(PRESENTMENT_CURRENCY_TITLE);
        let netRate = getValueByTitle(NET_RATE_TITLE);
        let addonRate = getValueByTitle(ADDON_RATE_TITLE);
        let feeAddonRate = getValueByTitle(FEE_ADDON_RATE_TITLE);

        if (exchangeRate == null || exchangeRate === 0) {
            errorsFound.push(EXCHANGE_RATE_NULL_OR_ZERO);
        }
        if (netValue > settlementValue) {
            errorsFound.push(NET_VALUE_GREATER_THAN_SETTLEMENT_VALUE);
        }
        if (underwritingRate !== null && !underwritingCode) {
            errorsFound.push(UNDERWRITING_RATE_WO_UNDERWRITING_CODE);
        }
        if (feeRate === 0) {
            errorsFound.push(FEE_RATE_ZERO)
        }
        if (exchangeRate === 1 && settlementCurrency !== presentmentCurrency) {
            warningsFound.push(DIFFERENT_CURRENCIES_AND_EXCHANGE_RATE_ONE);
        }
        if (underwritingRate < RATES_RANGE[0] || underwritingRate > RATES_RANGE[1]
            || feeRate < RATES_RANGE[0] || feeRate > RATES_RANGE[1]
            || feeAddonRate < RATES_RANGE[0] || feeAddonRate > RATES_RANGE[1]
            || addonRate < RATES_RANGE[0] || addonRate > RATES_RANGE[1]) {

            warningsFound.push(RATES_RANGE_NOT_BETWEEN_5_AND_15);
        }
        if (isExchangeRateOutOfRange(exchangeRate, presentmentCurrency, settlementCurrency)) {
            const exchangeRateOutRangeWarning = new Validation('EXCHANGE_RATE_OUT_OF_RANGE',
                `Exchange rate ${exchangeRate} is out of range for the presentment currency: ${presentmentCurrency}`,
                ValidationType.WARNING);
            warningsFound.push(exchangeRateOutRangeWarning);
        }

        setErrors(errorsFound);
        setWarnings(warningsFound);

        return errorsFound.concat(warningsFound);
    };

    const isExchangeRateOutOfRange = (exchangeRate, presentmentCurrency, settlementCurrency) => {
        const range = CURRENCY_RANGE_MAP.get(presentmentCurrency);

        return settlementCurrency === USD_CURRENCY
            && range !== null && range !== undefined
            && (exchangeRate < range[0] || exchangeRate > range[1]);
    };

    const toggleShowValidations = () => {
        setShowValidations(!showValidations);
    };

    const assignNetValueHandler = () => {
        setShowValidations(false);

        let netValue = getValueByTitle(NET_VALUE_TITLE);
        const data = {
            giftCardIds: props.giftCardIds,
            netValue
        };
        putData('/api/unprocessed-gift-cards', {}, data, showSuccessMessageHandler);
    };

    const showSuccessMessageHandler = () => {
        setErrors([]);
        setWarnings([]);

        loadData();
        setShowSuccessMessage(true);
    };

    useEffect(() => {
        loadData();
    },[props.netValueData ]);


    return (
        <>
            <div>
                <fieldset>
                    <legend align="left">Net Value Calculator</legend>
                    <div className="k-widget k-grid" role="grid"
                         data-keyboardnavscope="true">
                        <div className="k-grid-header" role="presentation">
                            <div className="k-grid-header-wrap" role="presentation" style={{borderWidth: '0px'}}>
                                <table role="presentation">
                                    <thead role="presentation" data-keyboardnavheader="true">
                                    <tr role="row" style={{touchAction: 'none', height: '7px'}}>
                                        <th aria-sort="none" colSpan="1"
                                            rowSpan="1" className="k-header" role="columnheader"><span
                                            className="k-cell-inner"><span className="k-link"><span
                                            className="k-column-title">
                                                <Button disabled={!assignable} onClick={assignHandler}
                                                        className="k-button gg-action">Assign</Button>
                                            </span></span></span></th>
                                        <th aria-sort="none" aria-colindex="2" aria-selected="false" colSpan="1"
                                            rowSpan="1" className="k-header" role="columnheader"
                                        ><span
                                            className="k-cell-inner"><span className="k-link"><span
                                            className="k-column-title">Group</span></span></span></th>

                                        <th aria-sort="none" aria-colindex="2" aria-selected="false" colSpan="1"
                                            rowSpan="1" className="k-header" role="columnheader"
                                        ><span
                                            className="k-cell-inner"><span className="k-link"><span
                                            className="k-column-title">Individual</span></span></span></th>

                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                        <div className="k-grid-container" role="presentation">
                            <div className="k-grid-content k-virtual-content" role="presentation">
                                <div role="presentation" style={{position: 'relative'}}>
                                    <table className="k-grid-table" role="presentation">
                                        <colgroup role="presentation">

                                        </colgroup>
                                        <tbody role="presentation" data-keyboardnavbody="true">
                                        {tableRender(state.data)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </fieldset>
            </div>
            <div>
            </div>
            <div>
                {showValidations && (
                    <ValidationsDialog width="800" height="400"
                                       items={errors.concat(warnings)}
                                       noErrors={errors.length === 0}
                                       stopCallBack={toggleShowValidations}
                                       continueCallBack={assignNetValueHandler} />
                )}

                {showSuccessMessage && (
                    <SuccessDialog message="Net value has been assigned to selected gift cards."
                                   successCallBack={() => setShowSuccessMessage(false)} />
                )}
            </div>
        </>
    )
}
export default NetValueCalculator;