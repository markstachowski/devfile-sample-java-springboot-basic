import {Window, WindowActionsBar} from "@progress/kendo-react-dialogs";
import {TextArea} from "@progress/kendo-react-inputs";
import {FieldWrapper} from "@progress/kendo-react-form";

import * as React from "react";
import {useEffect, useState} from "react";
import {postData} from "../common/api";
import {Loader} from "@progress/kendo-react-indicators";

const CLIP_BOARD_TYPE = 'giftCardId';
const INVOICE_ID_TYPE = 'invoiceId';
const PAYMENT_REF_TYPE = 'paymentRef';
const INVOICE_ID_REGEX = new RegExp('^(GG-INV-[0-9]{4}-[0-9]{5})$');
const SHORT_INVOICE_ID_REGEX = new RegExp('^([0-9]{4}-[0-9]{5})$');


const Clipboard = (props) => {
    let [content, setContent] = useState({title:'', hinta: ''})
    let [title, setTile] = useState(props.clipBoardType);
    let [contentStr, setContentStr] = useState('');
    let [validContentIds, setValidContentIds] = useState(true);
    let [contentIdList, setContentIdList] = useState([]);
    let [errorMessage, setErrorMessage] = useState(undefined);
    let [loading, setLoading] = useState(false);

    const handleContentIds = (e) => {
        setContentStr(e.value);
        let val = e.value;
        let cleaned = val.replaceAll(',', '\n').trim();

        let ids = splitByNewLineComma(cleaned);


        let isValid = true;
        if ( INVOICE_ID_TYPE === props.clipBoardType || PAYMENT_REF_TYPE === props.clipBoardType ) {
            if ( ids.length > 1 ) {
                setValidContentIds(false);
                setErrorMessage('Only single entry is allowed');
                isValid = false;

            }
        }
        if ( isValid && INVOICE_ID_TYPE === props.clipBoardType) {
            if ( SHORT_INVOICE_ID_REGEX.test(ids[0])) {
                ids[0] = 'GG-INV-'+ids[0];
                contentStr='GG-INV-'+ids[0];
            }
        }
        if ( isValid ) {
            ids.map(id => {
                if (!isValidId(id)) {
                    setValidContentIds(false);
                    setErrorMessage('Invalid data ');
                    isValid = false;
                    console.log('bad number ' + id);

                }

            });
        }

        if (isValid) {
            setValidContentIds(true);
            setErrorMessage(undefined);
        }



        setContentIdList(ids);
    }

    const splitByNewLineComma = (str) => {
        let ids = str.split(/[\,,\n]+/);
        ids = ids.map(id => {
            id = id.trim()
            id = id.replaceAll('\n', '');
            return id;
        });
        return ids;

    }

    const isValidId = (id) => {
        if ( props.clipBoardType === CLIP_BOARD_TYPE) {
            return isNumber(id);
        } else if (props.clipBoardType === PAYMENT_REF_TYPE) {
            return isValidPaymentRef(id);
        } else if ( props.clipBoardType === INVOICE_ID_TYPE) {
            return isValidInvoiceId(id);
        }
        return true;
    }

    const isNumber = (num) => {
        let isNum = /^[0-9]{1,20}$/.test(num);
        return isNum;
    }
    const isValidPaymentRef = (id) => {
        return (id.length > 0 && id.length <=20);
    }
    const isValidInvoiceId = (id) => {
        return INVOICE_ID_REGEX.test(id) || SHORT_INVOICE_ID_REGEX.test(id);
    }

    const searchGiftCards =() => {
        loadGiftCards(contentIdList);
        setContentStr(contentIdList.join('\n'));
    }

    const  setGiftCardData =(response) =>{
        setLoading(false)
        if ( response != null && response.length > 0 ) {
            if ( contentIdList.length > response.length) {
                setErrorMessage('Not all Gift cards found in the search');
                setValidContentIds(false);
                console.log('not all gift cards found');
            } else {
                setErrorMessage(undefined);
                setValidContentIds(true);
                props.toggleShowClipBoard();

            }
            props.addGiftCardHandler(response);
        } else {
            if ( contentIdList.length > 0 ) {
                setErrorMessage('No data found');
                setValidContentIds(false);
            }
        }
    }

    const loadGiftCards = () => {
        let params = {};
        //const paramValues = contentIdList.join(',');

        if (props.clipBoardType === CLIP_BOARD_TYPE) {
            params = {
                giftCardIds: contentIdList
            };
        } else if (props.clipBoardType === PAYMENT_REF_TYPE) {
            params = {
                paymentRef: contentIdList.join(',')
            };
        } else if (props.clipBoardType === INVOICE_ID_TYPE) {
            params = {
                invoiceNumber: contentIdList.join(',')
            };
        }
        setLoading(true)
        postData('/api/gift-card-designations/assignable-gift-cards', params, setGiftCardData);
    };

    useEffect(() => {
        let vContent = {};
        if (props.clipBoardType === CLIP_BOARD_TYPE) {
            vContent['title'] = 'GiftCard IDs';
            vContent['hinta'] = 'Please enter or paste a list of GiftCard IDs limited to 20 characters each, they may be separated by commas or entered on separate lines.'
        } else if (props.clipBoardType === PAYMENT_REF_TYPE) {
            vContent['title'] = 'Payment Ref';
            vContent['hinta'] = 'Please enter or paste a single Payment Ref limited to 20 characters.'
        } else if (props.clipBoardType === INVOICE_ID_TYPE) {
            vContent['title'] = 'Invoice ID';
            vContent['hinta'] = 'Please enter or paste a single Invoice ID in the following format GG-INV-####-##### or enter just the number in the format ####-#####'
        }
        setContent(vContent);
    }, []);

    return (
        <div>

            {(
                <Window
                    title={content.title}
                    onClose={props.toggleShowClipBoard}
                    initialHeight={300}
                    initialWidth={300}
                    modal={true}
                >
                    <div>
                        {loading && <Loader size="large" type={'infinite-spinner'} />}

                        <FieldWrapper>
                        <div className={"k-form-field-wrap"}>
                            <TextArea
                                value={contentStr}
                                valid={validContentIds}
                                autoSize={true}
                                id='contentIds'
                                rows={8}
                                placeholder={content.hinta}
                                onChange={handleContentIds}
                            />

                                {!  validContentIds && errorMessage}

                        </div>
                        </FieldWrapper>

                        <div>
                            <WindowActionsBar
                                //layout={layout}
                            >
                                <button type="button" className="k-button bottom k-justify-content-end"
                                        onClick={props.toggleShowClipBoard}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="k-button k-primary k-justify-content-end"
                                    disabled={! validContentIds}
                                    onClick={searchGiftCards}
                                >
                                    Add
                                </button>
                            </WindowActionsBar>
                        </div>
                    </div>
                </Window>
            )}
        </div>

    );

};
export default Clipboard;