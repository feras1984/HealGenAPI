import React from "react";
import {Box, FormHelperText, TextField} from "@mui/material";
import {Controller} from "react-hook-form";
import IValidatedInput from "@/Interfaces/ValidatedInput/IValidatedInput";
import InputAdornment from '@mui/material/InputAdornment';

const ValidatedInput: React.FC<IValidatedInput<any>> = ({
    name = '',
    controlName = '',
    control,
    id = '',
    label = '',
    placeholder = '',
    multiline = false,
    rows = 1,
    adornment,
    methods= undefined,
    errors = '',
    adornmentDirection = 'start',
    adornmentAction,
    ...props
   }) => {

    const addAdornment = () => {
        return <InputAdornment position="start">{adornment}</InputAdornment>
    }

    // const action = (e:  React.MouseEvent<HTMLDivElement>) => {
    //     console.log('action')
    //     console.log(adornmentAction);
    //     if (adornmentAction) {
    //         adornmentAction(e);
    //     }
    // }



    return (
        <Controller
            name={controlName}
            control={methods?.control || control}
            render={({
                         field: { value, onChange, onBlur, ref },
                         fieldState: { error },
                     }) => (
                <Box className={"basis-full"}>
                    <TextField
                        variant="filled"
                        color="secondary"
                        fullWidth
                        label={label}
                        id={id}
                        placeholder={placeholder}
                        name={name}
                        multiline={multiline}
                        rows={rows}
                        // InputProps={{
                        //
                        //     // endAdornment: <InputAdornment position={adornmentDirection}>{adornment}</InputAdornment>,
                        //     InputAdornment
                        // }}
                        InputProps={{
                            [adornmentDirection === "start" ? "startAdornment" : "endAdornment"]: (
                                <InputAdornment
                                    position={adornmentDirection}
                                    onClick={adornmentAction}
                                    className={'cursor-pointer'}
                                >
                                    {adornment}
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            form: {
                                autocomplete: 'off',
                            },
                        }}

                        required
                        inputRef={ref}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        error={Boolean(error)}
                        {...props}
                    />

                    <FormHelperText
                        sx={{
                            color: 'error.main',
                            marginLeft: '8px',
                            marginRight: '8px',
                        }}
                    >
                        {(error?.message) ?? errors}
                    </FormHelperText>
                </Box>
            )}
        />
    )
}

export default ValidatedInput;
