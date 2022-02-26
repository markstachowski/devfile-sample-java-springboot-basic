import * as React from 'react';
import {GRID_COL_INDEX_ATTRIBUTE, GridColumnMenuCheckboxFilter, GridColumnMenuFilter} from '@progress/kendo-react-grid';
import { useInternationalization } from "@progress/kendo-react-intl";
import {useTableKeyboardNavigation} from "@progress/kendo-react-data-tools";
import {isNumeric} from "@progress/kendo-data-query/dist/npm/utils";
import {formatNumber} from "@telerik/kendo-intl";

export const ColumnMenu = props => {
    return <div>
        <GridColumnMenuFilter  {...props} expanded={true}/>
    </div>;
};
export const ColumnMenuCheckboxFilter = (props, data) => {
    return <div>
        <GridColumnMenuCheckboxFilter {...props} data={props.data} expanded={true}/>
    </div>;
};

export const YesNoFilter = props => {
    const onChange = event => {
       const value = event.target.value === 'null' ? null : event.target.value === 'true';
        //const value = event.target.value;


        const {
            firstFilterProps
        } = props;
        firstFilterProps.onChange({
            value,
            operator: 'eq',
            syntheticEvent: event.syntheticEvent
        });
    };

    const {
        firstFilterProps
    } = props;
    const value = firstFilterProps.value;
    return <div>
        {/*
        <input id="bool-null" name="boolean" type="radio" value="null" checked={value === null} onChange={onChange}/>
        <label htmlFor="bool-null">&nbsp;not set</label>
        <br/>
*/}
        <input id="bool-true" name="boolean" type="radio" value="true" checked={value === true} onChange={onChange}/>
        <label htmlFor="bool-true">&nbsp;Yes</label>
        <br/>
        <input id="bool-false" name="boolean" type="radio" value="false" checked={value === false} onChange={onChange}/>
        <label htmlFor="bool-false">&nbsp;No</label>
    </div>;
};

export const BooleanYesNoCell = (props) => {
    const field = props.field || "";
    let value = props.dataItem[field];
    const navigationAttributes = useTableKeyboardNavigation(props.id);
    value = (value) ? 'Yes' : 'No'
    return (
        <td colSpan={props.colSpan} role={'gridcell'} aria-colindex={props.ariaColumnIndex}
            aria-selected={props.isSelected}
            {...{
                [GRID_COL_INDEX_ATTRIBUTE]: props.columnIndex,
            }}
            {...navigationAttributes}
            title={value}
        >
            {value}
        </td>
    );
}

export const CurrencyCell = (props) => {
    const intl = useInternationalization();
    const navigationAttributes = useTableKeyboardNavigation(props.id);
    return (

            <td colSpan={props.colSpan} role={'gridcell'} aria-colindex={props.ariaColumnIndex}
                aria-selected={props.isSelected}
                {...{
                    [GRID_COL_INDEX_ATTRIBUTE]: props.columnIndex,
                }}
                {...navigationAttributes}
                style={{textAlign: 'right'}}
            >
            {Number(props.dataItem[props.field]).toLocaleString('en-US', {minimumFractionDigits:2})}
        </td>
    );
}

export const CurrencyCellWithToolTip = (props) => {
    const intl = useInternationalization();
    const navigationAttributes = useTableKeyboardNavigation(props.id);
    let value = props.dataItem[props.field];
    if ( value && value !== null && value !== 'Multiple') {
        value = Number(props.dataItem[props.field]).toLocaleString('en-US', {minimumFractionDigits: 2});
    }
    let title  = value;
    let classNames =+ props.className;
    if ( props.locked) {
        //styles.top = props.getTop(props.dataItem);
        classNames += 'k-grid-row-sticky'
    }
    return (

        <td colSpan={props.colSpan} role={'gridcell'} aria-colindex={props.ariaColumnIndex}   className={classNames}
            aria-selected={props.isSelected}
            {...{
                [GRID_COL_INDEX_ATTRIBUTE]: props.columnIndex,
            }}
            {...navigationAttributes}
            style={{textAlign: 'right', whiteSpace: 'nowrap'}}
            title={title}
        >
            {value}
        </td>
    );
}




export const NumberCell = (props) => {
    const navigationAttributes = useTableKeyboardNavigation(props.id);
    return (
        <td colSpan={props.colSpan} role={'gridcell'} aria-colindex={props.ariaColumnIndex}
            aria-selected={props.isSelected}
            {...{
                [GRID_COL_INDEX_ATTRIBUTE]: props.columnIndex,
            }}
            {...navigationAttributes}
            style={{textAlign: 'right'}}
        >
            {Number(props.dataItem[props.field]).toLocaleString()}
        </td>
    );
}

export const HeaderCell = (props) => {
    return (
        <a className="k-link" onClick={props.onClick}>
            <span className="k-icon k-i-filter"/>
            <span>
        {props.title}
      </span>
            {props.children}
        </a>

    );
};


export const ActiveColumnProps = (field, dataState) => {
    return {
        field: field,
        columnMenu: ColumnMenu,
        headerClassName: isColumnActive(field, dataState) ? ' gg-bold active' : '',
    };
};

const isColumnActive = (field, dataState) => {
    let isActiveField = GridColumnMenuFilter.active(field, dataState.filter) //|| GridColumnMenuSort.active(field, dataState.sort);
    return isActiveField;
};


export const TooltipCell = (props) => {

    let styles = props.style;
    let classNames = props.className;

    if ( props.locked) {
        //styles.top = props.getTop(props.dataItem);
        classNames += 'k-grid-row-sticky'
    }
    let value = props.dataItem[props.field];
    if ( props.format  && value instanceof Date) {
        if ( value !== undefined && value !== null ) {
            value = formatDate(value, props.format);
        }
    }

    const navigationAttributes = useTableKeyboardNavigation(props.id);
    let toolTip = value;

    return(
        <td colSpan={props.colSpan} role={'gridcell'} aria-colindex={props.ariaColumnIndex} className={classNames}
            style={{whiteSpace: 'nowrap', ...styles}}
            aria-selected={props.isSelected}
            {...{
                [GRID_COL_INDEX_ATTRIBUTE]: props.columnIndex,
            }}
            {...navigationAttributes}
            title={toolTip}
        >
            {value}
        </td>
    )
};

export const formatDate=(dt)=>{
    if ( dt === null || dt === undefined) {
        return dt;
    }
    const offset = dt.getTimezoneOffset()
    dt = new Date(dt.getTime() - (offset*60*1000))
    return dt.toISOString().split('T')[0]
}

export const copyCellRowRender = (trElement, dataItem, props) => {
    function getValue(event) {
        let index = event.target.getAttribute('aria-colindex');
        let field = props.grid.current._columns[index - 1].field;
        let format = props.grid.current._columns[index - 1].format;

        let value = dataItem.dataItem[field];
        if ( value instanceof  Date && format ) {
            value = formatDate(value, format);
        } else if (isNumeric(value) && format) {
            value = formatNumber(value, format);
        }
        return value;
    }

    const trProps = {
        ...trElement.props,
        onKeyDown: (event)=> {
            let charCode = String.fromCharCode(event.which).toLowerCase();
            console.log(charCode, event.ctrlKey, event.metaKey);
            if((event.ctrlKey || event.metaKey) && charCode === 's') {
                //console.log("CTRL+S Pressed");
            }else if((event.ctrlKey || event.metaKey) && charCode === 'c') {
                //console.log("CTRL+C Pressed");
                let value = getValue(event);
                navigator.clipboard.writeText(value);
            }else if((event.ctrlKey || event.metaKey) && charCode === 'v') {
            }
        },
        onDoubleClick: () => {
        },
        onContextMenu: (event) => {
            event.preventDefault();
            let value = getValue(event);
            let offset = { left: event.pageX, top: event.pageY };
            if ( props.popupCallBack) {
                let callBack = props.popupCallBack;
                callBack( {offset: offset, show: true, cellValue: value});
            }
        },
    };
    return React.cloneElement(
        trElement,
        { ...trProps },
        trElement.props.children
    );
};
