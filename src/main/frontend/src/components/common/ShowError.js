import {Dialog, DialogActionsBar} from "@progress/kendo-react-dialogs";
import {useDispatch, useSelector} from "react-redux";
import {removeGenericError} from "./store/actions";
import Button from "@progress/kendo-react-buttons/dist/es/Button";

const ShowError = (props) => {

    let dispatch = useDispatch();
    let state = useSelector(state => state);
    let error = undefined;
    //console.log('ShowError', error);
    if (state === undefined || state.error === undefined) {
        return (<> </>);
    }

    error = state.error;

    let errorData = undefined;
    if (typeof error.data === 'string' || error.data instanceof String) {
        errorData = error.data;
    } else {
        errorData = JSON.stringify(error.data)
    }

    const hideError = (event) => {
        dispatch(removeGenericError(error));
    }


    return (
        <>
            error && (<Dialog title={"Error"} onClose={hideError}>
            <p
                style={{
                    margin: "25px",
                    textAlign: "center",
                    color: 'red'
                }}
            >
                <div>
                        <table>
                            <tr><td>{error.status}</td></tr>
                            <tr><td>{error.statusText}</td></tr>
                            <tr><td>{errorData}</td></tr>
                            <tr><td>{error.unknownError}</td></tr>
                        </table>
                </div>
            </p>
            <DialogActionsBar className={'k-bg-error'}>
                <div>
                <Button  width={'80px'}  className="k-button k-alert-error k-bg-error" onClick={hideError} >
                    Close
                </Button>
                </div>
            </DialogActionsBar>
        </Dialog>)
        </>
    );

}

export default ShowError;
