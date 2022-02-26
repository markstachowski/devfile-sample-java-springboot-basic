import * as React from 'react';
import { DateInput } from '@progress/kendo-react-dateinputs';
import {Label} from "@progress/kendo-react-labels";

const DateRangeStartDate = props => {
    const startDate = "startDate";
    return (
        <>
            <Label editorId={startDate}>From:&nbsp;</Label>
            <DateInput width={100} id={startDate}  {...props} label={''}/>
        </>
    )
};

export default DateRangeStartDate;