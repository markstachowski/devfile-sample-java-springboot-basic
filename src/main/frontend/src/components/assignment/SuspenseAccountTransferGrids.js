import {Grid, GridColumn, GridToolbar} from '@progress/kendo-react-grid';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {getData, postData} from '../common/api';
import {ExcelExport} from '@progress/kendo-react-excel-export';
import {copyCellRowRender, CurrencyCell, CurrencyCellWithToolTip, TooltipCell} from '../common/gridUtils';
import {getter, orderBy} from "@progress/kendo-data-query";
import {getSelectedState, getSelectedStateFromKeyDown} from "@progress/kendo-react-data-tools/dist/es/selection/utils";
import {Loader} from "@progress/kendo-react-indicators";
import {Tooltip} from "@progress/kendo-react-tooltip";
import Button from "@progress/kendo-react-buttons/dist/es/Button";
import {GridCellContextMenu} from "../common/GridCellContextMenu";

const SuspenseAccountTransferGrids = (props) => {
    const DATA_ITEM_KEY = "id";
    const SELECTED_FIELD = "selected";
    const idGetter = getter(DATA_ITEM_KEY);

    const initialGridState = {
        filter: null,
        sort: [
            {
                field: 'id',
                dir: 'asc'
            }
        ]
    };


    const [dataState, setDataState] = useState(initialGridState);
    const [sort, setSort] = useState(initialGridState.sort);

    const initialSusActTransGridState = {
        filter: null,
        sort: [
            {
                field: 'date',
                dir: 'asc'
            }
        ]
    };

    const [showCellContextMenu, setShowCellContextMenu] = useState(false);
    const [cellValue, setCellValue] = useState(undefined);
    const [cellContextMenuOffset, setCellContextMenuOffset] = useState(undefined);

    const [loading, setLoading] = useState(false);
    const [susActTransSort, setSusActTransSort] = useState(initialSusActTransGridState.sort);

    const [suspenseAccounts, setSuspenseAccounts] = useState([]);
    const [suspenseAccountTransfers, setSuspenseAccountTransfers] = useState([]);

    const [selectedState, setSelectedState] = React.useState({});

    const onSelectionChange = useCallback(
        (event) => {
            const newSelectedState = getSelectedState({
                event,
                selectedState: selectedState,
                dataItemKey: DATA_ITEM_KEY,
            });
            setSelectedState(newSelectedState);
        },
        [selectedState]
    );

    const onKeyDown = (event) => {
        const newSelectedState = getSelectedStateFromKeyDown({
            event,
            selectedState: selectedState,
            dataItemKey: DATA_ITEM_KEY,
        });
        setSelectedState(newSelectedState);
    };


    const exportToExcel = useRef(null);
    const suspenseAccountsGrid = useRef();
    const suspenseAccountsTransferGrid = useRef();

    const {selectedCorpPartnerIds} = props;

    const exportToExcelHandler = () => {
        if (exportToExcel.current !== null) {
            exportToExcel.current.save(suspenseAccounts, suspenseAccountsGrid.current.columns);
        }
    };

    const setSuspenseAccountsData=(response)=> {
        if (response !== undefined && response !== null ) {
            response.map((dataItem) => {
                dataItem['selected'] = false;
            })
            setSuspenseAccounts(response);
            setSelectedState({});
            setSuspenseAccountTransfers([]);
        }
        setLoading(false);
    }

    const setSuspenseAccountTransfersData=(response)=> {
        if (response !== undefined && response !== null ) {
            response.map((dataItem) => {
                dataItem['date'] = new Date(dataItem.date);
            })
            setSuspenseAccountTransfers(response);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (selectedCorpPartnerIds && selectedCorpPartnerIds.length > 0) {
            setLoading(true);
            postData('/api/gift-card-assignments/suspense-accounts', selectedCorpPartnerIds, setSuspenseAccountsData);
        } else {
            setSuspenseAccounts([]);
            setSelectedState({})
        }
    }, [selectedCorpPartnerIds]);

    useEffect( () => {
        let id = Object.keys(selectedState);
        if (id !== undefined && id != null && id.length === 1 ) {
            let selectedSuspenseAccount = suspenseAccounts.filter( (suspenseAcct) => {
                    if ( suspenseAcct.id === Number(id[0]) ) {
                        return suspenseAcct;
                    }
            } )

            let legacyNegativeProjectProjid = selectedSuspenseAccount[0].legacyNegativeProjectProjid;
            if ( legacyNegativeProjectProjid != null && legacyNegativeProjectProjid != undefined) {
                const params = {
                    projectId: legacyNegativeProjectProjid,
                    startDate: props.searchParams.startDate,
                    endDate: props.searchParams.endDate
                };

                setLoading(true);
                getData('/api/gift-card-assignments/suspense-account-transfers',params, setSuspenseAccountTransfersData);
            }else {
                setSuspenseAccountTransfers([])
            }
            //console.log(selectedSuspenseAccount);

        }else {
            setSuspenseAccountTransfers([]);
        }
        //console.log(id)
    }, [selectedState])

    const popupCallBackHandler=(obj)=>{
        setCellContextMenuOffset(obj.offset);
        setShowCellContextMenu(obj.show);
        setCellValue(obj.cellValue);
    }


    return (
        <fieldset>
            {loading && <Loader size="large" type={'infinite-spinner'} />}
            <GridCellContextMenu show={showCellContextMenu} value={cellValue} offset={cellContextMenuOffset} setShowCallBack={setShowCellContextMenu}/>

            <legend align={'left'}>Suspense Account Transfer</legend>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'baseline'}}>
                <div>
                    <ExcelExport fileName="suspenseAccounts" ref={exportToExcel}/>
                    <Tooltip openDelay={1500} position="right">
                    <Grid
                        data={orderBy(suspenseAccounts, sort).map((item) => ({
                            ...item,
                            [SELECTED_FIELD]: selectedState[idGetter(item)],
                        }))} {...dataState}
                        onSelectionChange={onSelectionChange}
                        rowHeight={10}
                        sortable={true}
                        sort={sort}
                        onSortChange={(e) => {
                            setSort(e.sort);
                        }}
                          resizable={true}
                          navigatable={true}
                          style={{
                              maxHeight: "300px",
                          }}
                          dataItemKey={DATA_ITEM_KEY}
                          selectedField={SELECTED_FIELD}
                          selectable={{
                              enabled: true,
                              drag: false,
                              cell: false,
                              mode: 'single'
                          }}
                        onKeyDown={onKeyDown}
                        ref={suspenseAccountsGrid}
                        rowRender={(trElement, dataItem) =>
                                copyCellRowRender(trElement, dataItem, { grid: suspenseAccountsGrid , popupCallBack: popupCallBackHandler})
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
                        <GridColumn field="id" title="Suspense Account Id" cell={TooltipCell}/>
                        <GridColumn field="name" title="Suspense Account Title"  cell={TooltipCell}/>
                        <GridColumn field="type" title="Suspense Account Type" cell={TooltipCell}/>
                        <GridColumn field="balance" title="Suspense Account Balance" cell={CurrencyCellWithToolTip}/>
                    </Grid>
                    </Tooltip>
                </div>
                <div>
                    <Tooltip>
                        <Grid data={orderBy(suspenseAccountTransfers, susActTransSort)}
                              sortable={true}
                              sort={susActTransSort}
                              onSortChange={(e) => {
                                  setSusActTransSort(e.sort);
                              }}
                              style={{
                                  maxHeight: "200px",
                              }}
                              navigatable={true}
                              ref={suspenseAccountsTransferGrid}
                              rowRender={(trElement, dataItem) =>
                                  copyCellRowRender(trElement, dataItem, { grid: suspenseAccountsTransferGrid })
                              }
                        >
                            <GridColumn field="date" title="Transfer Date"  format="{0:yyyy-MM-dd}" cell={TooltipCell}/>
                            <GridColumn field="amount" title="Transfer Amount"  cell={CurrencyCellWithToolTip}/>
                            <GridColumn field="memo" title="Transfer Memo" cell={TooltipCell}/>
                        </Grid>
                    </Tooltip>
                </div>
            </div>
        </fieldset>
    );
};

export default SuspenseAccountTransferGrids;