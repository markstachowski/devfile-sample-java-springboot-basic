import ValidationMessageList from '../../validation/ValidationMessageList';
import {Dialog, DialogActionsBar} from '@progress/kendo-react-dialogs';
import Button from "@progress/kendo-react-buttons/dist/es/Button";

const ValidationsDialog = (props) => {
    const {width, height, title = 'Validation Messages'} = props;

    return (
        <Dialog width={width} height={height} closeIcon={false} title={title}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <ValidationMessageList items={props.items} />
            </div>

            <DialogActionsBar layout={"end"}>
                {props.noErrors &&
                <Button className="k-button k-primary" onClick={props.continueCallBack}>
                    Continue
                </Button>
                }
                <Button className="k-button" onClick={props.stopCallBack}>
                    Stop
                </Button>
            </DialogActionsBar>
        </Dialog>
    );
}

export default ValidationsDialog;