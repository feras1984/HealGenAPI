import {BaseTextFieldProps} from "@mui/material/TextField";
import {type Control, UseFormReturn} from "react-hook-form";
import {type FieldValues, Resolver} from "react-hook-form";
import IMasterValidated from "@/Interfaces/ValidatedInput/IMasterValidated";
import {MouseEventHandler} from "react";


interface IValidatedInput<T extends FieldValues=FieldValues> extends BaseTextFieldProps, IMasterValidated<T> {
    control?: Control<T, any>,
    controlName: string,
    adornment?: React.ReactNode,
    errors?: string,
    languageCode?: string,
    maxLength?: number,
    adornmentDirection?: 'start' | 'end',
    adornmentAction?: MouseEventHandler<HTMLDivElement>,
    // methods?: UseFormReturn<T, any, undefined>
}

export default IValidatedInput;
