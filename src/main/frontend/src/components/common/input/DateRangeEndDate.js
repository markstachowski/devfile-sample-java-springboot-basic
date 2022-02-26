import * as React from 'react';
import {DateInput} from '@progress/kendo-react-dateinputs';
import { Label } from "@progress/kendo-react-labels";

const DateRangeEndDate = props => {
    const endDate = "endDate";
    return (
        <>
            <Label editorId={endDate}>To:&nbsp;</Label>
            <DateInput width={100} id={endDate}  {...props} label={''}/>
        </>
    )
};
export default DateRangeEndDate;