import {Notification} from '@progress/kendo-react-notification';
import {Dialog, DialogActionsBar} from '@progress/kendo-react-dialogs';
import {Button} from "@progress/kendo-react-buttons";

const SuccessDialog = (props) => {
    const {
        width = 300,
        height = 150,
        title = 'Confirmation',
        message} = props;

    return (
        <Dialog width={width} height={height} closeIcon={false} title={title}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <Notification type={{style: "success", icon: true}}>
                    <span>{message}</span>
                </Notification>
            </div>

            <DialogActionsBar layout={"end"}>
                <Button className="k-button" onClick={props.successCallBack}>
                    OK
                </Button>
            </DialogActionsBar>
        </Dialog>
    );
}

export default SuccessDialog;