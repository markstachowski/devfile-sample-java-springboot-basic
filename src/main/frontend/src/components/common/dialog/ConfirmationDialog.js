import {Dialog, DialogActionsBar} from '@progress/kendo-react-dialogs';
import Button from "@progress/kendo-react-buttons/dist/es/Button";

const ConfirmationDialog = (props) => {
    const {
        width = 300,
        height = 150,
        title = 'Please confirm',
        message = 'Are you sure?'} = props;

    return (
        <Dialog width={width} height={height} closeIcon={false} title={title}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <span><b>{message}</b></span>
            </div>

            <DialogActionsBar layout={"end"}>
                <Button className="k-button" onClick={props.noCallBack}>
                    No
                </Button>
                <button className="k-button" onClick={props.yesCallBack}>
                    Yes
                </button>
            </DialogActionsBar>
        </Dialog>
    );
}

export default ConfirmationDialog;