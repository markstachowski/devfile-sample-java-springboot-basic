import {Grid, GridColumn, GridToolbar} from '@progress/kendo-react-grid';
import React, {useEffect, useRef, useState} from 'react';
import {getData, postData} from '../common/api';
import {ExcelExport} from '@progress/kendo-react-excel-export';
import {copyCellRowRender, CurrencyCell, CurrencyCellWithToolTip, TooltipCell} from '../common/gridUtils';
import {orderBy} from "@progress/kendo-data-query";
import {Loader} from "@progress/kendo-react-indicators";
import {Tooltip} from "@progress/kendo-react-tooltip";
import {Button} from "@progress/kendo-react-buttons";
import {GridCellContextMenu} from "../common/GridCellContextMenu";

const InvoiceItemsGrid = (props) => {

    const initialGridState = {
        filter: null,
        sort: [
            {
                field: 'id',
                dir: 'asc'
            }
        ]
    };

    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);


    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState(initialGridState.sort);

    const [invoiceItems, setInvoiceItems] = useState([]);

    const exportToExcel = useRef(null);
    const invoiceItemsGrid = useRef();

    const {selectedCorpPartnerIds} = props;

    const exportToExcelHandler = () => {
        if (exportToExcel.current !== null) {
            exportToExcel.current.save(invoiceItems, invoiceItemsGrid.current.columns);
        }
    };

    useEffect(() => {
        if (selectedCorpPartnerIds && selectedCorpPartnerIds.length > 0) {
            setLoading(true);
            postData('/api/gift-card-assignments/invoice-items',selectedCorpPartnerIds, setData);
        } else {
            setInvoiceItems([]);
        }
    }, [selectedCorpPartnerIds]);

    const setData = (response) => {
        const list = response.map(invoiceItem => {
            invoiceItem.paidDate = new Date(invoiceItem.paidDate);
            invoiceItem['descInterDesc'] =
                    'Description: ' + ( (invoiceItem.description!==null)?invoiceItem.description:' ') +
                    '; Internal Description: ' + ((invoiceItem.internalDescription!==null)?invoiceItem.internalDescription:'');
            //console.log(invoiceItem.descInterDesc)
            return invoiceItem;
        });

        setInvoiceItems(list);
        setLoading(false);
    };

    const popupCallBackHandler=(obj)=>{
        //console.log( obj.offset, obj.cellValue);
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (
        <fieldset>
            {loading && <Loader size="large" type={'infinite-spinner'} />}
            <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>

            <legend align={'left'}>Invoice Items</legend>
            <ExcelExport fileName="invoiceItems" ref={exportToExcel}/>
            <Tooltip openDelay={1500} position="right" >
            <Grid data={orderBy(invoiceItems, sort)}
                      sortable={true}
                      sort={sort}
                      rowHeight={10}
                      onSortChange={(e) => {
                          setSort(e.sort);
                      }}
                      resizable={true}
                      navigatable={true}
                      style={{
                          maxHeight: "500px",
                      }}
                      ref={invoiceItemsGrid}
                        rowRender={(trElement, dataItem) =>
                            copyCellRowRender(trElement, dataItem, { grid: invoiceItemsGrid , popupCallBack: popupCallBackHandler})
                  }
            >
                    <GridToolbar>
                        <Button
                            title="Export Excel"
                            className="k-button k-primary"
                            onClick={exportToExcelHandler}
                            tabIndex={-1}>
                            Export to Excel
                        </Button>
                    </GridToolbar>
                    <GridColumn field="state" title="Invoice State" cell={TooltipCell}/>
                    <GridColumn field="itemType" title="Invoice Item Type" cell={TooltipCell} />
                    <GridColumn field="descInterDesc" title="Invoice Memo"  cell={TooltipCell}/>
                    <GridColumn field="amount" title="Invoice Amount" cell={CurrencyCellWithToolTip} />
                    <GridColumn field="paidDate" title="Paid Date" format="{0:yyyy-MM-dd}" cell={TooltipCell}/>
                </Grid>
            </Tooltip>
        </fieldset>
    );
};

export default InvoiceItemsGrid;