import {ExcelExport} from "@progress/kendo-react-excel-export";
import {Grid, GridToolbar} from "@progress/kendo-react-grid";
import Button from "@progress/kendo-react-buttons/dist/es/Button";
import {GridColumn as Column} from "@progress/kendo-react-grid/dist/npm/GridColumn";
import {ActiveColumnProps, ColumnMenu, copyCellRowRender, CurrencyCell} from "../common/gridUtils";
import {useEffect, useRef, useState} from "react";
import {getData} from "../common/api";
import {GridCellContextMenu} from "../common/GridCellContextMenu";
import {Tooltip} from "@progress/kendo-react-tooltip";





const FeeGrid = (props) => {

    const [results, setResults]  = useState({data: [], total: 0 });
    const [dataState,setDataState] = useState({});

    const gridRef=useRef();
    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);


    const loadData = (props) => {
    }

    useEffect((props) => {
        loadData();
    }, [props]);


    const dataStateChange=(event) =>{

    }


    const useInvoiceHandler=()=> {

    }

    const popupCallBackHandler=(obj)=>{
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }

    return (
        <>
            {results &&
            <div>
                <fieldset>
                    <legend align={'left'}>Upstream Fee Information</legend>
                    <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>
                    <Tooltip openDelay={1500} position="right">
                    <Grid
                        data={results.data}
                        onDataStateChange={dataStateChange}
                        sortable={true}
                        rowHeight={10}
                        style={{
                            maxHeight: "445px",
                        }}
                        resizable={true}
                        navigatable={true}
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
                                    <Button disabled={true} disabled={true} onClick={useInvoiceHandler}
                                            className="k-button k-button-primary">Use</Button>
                                </div>
                            </div>
                        </GridToolbar>
                        <Column field={'giftCardId'} title='Fee Rate' locked={true}
                                 {...ActiveColumnProps('giftCardId', dataState)}
                                columnMenu={ColumnMenu} />
                        <Column field={'organizationName'} title='Add-on Rate' locked={true}
                                 {...ActiveColumnProps('organizationName', dataState)}
                                columnMenu={ColumnMenu}/>
                        <Column field={'paymentRef'} title='Corporate Partner' locked={true}
                                {...ActiveColumnProps('paymentRef', dataState)} columnMenu={ColumnMenu}/>
                        <Column field={'paymentRef'} title='Line Item' locked={true}
                                 {...ActiveColumnProps('paymentRef', dataState)} columnMenu={ColumnMenu}/>

                        <Column field={'purchaseDate'} title='Giftcard Creator' filter={'date'}
                                format="{0:yyyy-MM-dd}" {...ActiveColumnProps('purchaseDate', dataState)}
                                columnMenu={ColumnMenu}/>
                        <Column field={'invoiceStatus'} title='Business Partner Manager'
                                {...ActiveColumnProps('invoiceStatus', dataState)} columnMenu={ColumnMenu}/>
                    </Grid>
                    </Tooltip>
                </fieldset>
            </div>
            }

        </>
    )
}

export default FeeGrid;