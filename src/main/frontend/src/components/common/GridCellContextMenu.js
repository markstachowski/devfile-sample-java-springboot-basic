import {Popup} from "@progress/kendo-react-popup";
import {Menu, MenuItem} from "@progress/kendo-react-layout";
import {useEffect, useState} from "react";


export const GridCellContextMenu = (props) => {
    let menuWrapperRef;
    let blurTimeoutRef;

    const [open, setOpen] = useState(false);
    const [show, setShow] = useState(false);
    const [offset, setOffset] = useState(undefined);
    const handleOnSelect = (e) => {
        switch (e.item.text) {
            case "Copy":
                console.log('copy ', props.value);
                navigator.clipboard.writeText(props.value);
                setOpen(false)
                //setShow(false);
                //props.setShow(false);
                props.setShowCallBack(false)
                break;
            default:
        }
        setOpen(false);
    };

    const onFocusHandler = (e) => {
        clearTimeout(blurTimeoutRef);
        blurTimeoutRef = undefined;
    };

    const onBlurTimeout = () => {
        //setOpen(false);
        props.setShowCallBack(false);
        blurTimeoutRef = undefined;
    };

    const onBlurHandler = (e) => {
        clearTimeout(blurTimeoutRef);
        setOpen(false);
        blurTimeoutRef = setTimeout(onBlurTimeout);
    };

    const onPopupOpen = () => {
        //menuWrapperRef.querySelector("[tabindex]").focus();
        menuWrapperRef.focus();
    };

    const onkeydown=(event)=>{
        console.log('keydown event' , event.nativeEvent);
        /**
         * key: "Escape"
         keyCode: 27
         */
        if ( event.key === 'Escape' || event.keyCode === '27') {
            onBlurTimeout(event);
        }
    }

    useEffect(()=>{
        setShow(props.show);
        if( props.offset) {
            setOffset({left: props.offset.left + 2, top: props.offset.top + 2});
        }
    }, [props]);

    return(
        <div>
            <Popup
                offset={offset}
                show={show }
                onOpen={onPopupOpen}
                popupClass={"popup-content"}
            >
            <div
                //onFocus={onFocusHandler}
                onPointerEnter={onFocusHandler}
                //onBlur={onBlurHandler}
                onfocusout={onBlurHandler}
                onKeyDown={onkeydown}
                onMouseLeave={onBlurHandler}
                onPointerLeave={onBlurHandler}
                tabIndex={1}
                ref={(el) => (menuWrapperRef = el)}
            >
                <Menu
                    vertical={true}
                    style={{ display: "inline-block" }}
                    onSelect={handleOnSelect}
                >
                    <MenuItem text="Copy" />
                </Menu>
            </div>
            </Popup>
        </div>
    );
}