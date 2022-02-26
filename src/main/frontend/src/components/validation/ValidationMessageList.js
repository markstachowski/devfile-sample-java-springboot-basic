import {Notification} from "@progress/kendo-react-notification";

const ValidationMessageList = (props) => {
    return (
        <>
            {props.items.map(validation => (
                <Notification key={validation.id} className={validation.className} type={{style: validation.type.name, icon: true}}>
                    <span>{validation.message}</span>
                </Notification>
            ))}
        </>
    );
};

export default ValidationMessageList;