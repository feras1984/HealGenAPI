import React from 'react';
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import ValidatedImage from "@/Components/ValidatedComponents/ValidatedImage";
import {Container} from "typedi";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import {Box} from "@mui/material";
import Property from "@/models/block/Property";
import PropertyService from "@/Services/BlockService/PropertyService";

const QrInfo: React.FC<{property: Property, handleBlockChange: (block: Property) => void}> = ({property, handleBlockChange}) => {
    const blockService = Container.get(PropertyService);
    const blockSchema = z.object({});
    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(blockSchema),
        defaultValues: {
            image: (property.qrFile?.url || "" as (File | string)),
        }
    });

    // =========================================================================================
    // Snackbar configuration section:

    const {snackbar, setSnackbar, handleClose} =
        useSnackbarHook({open: false, message: '', severity: "success"});

    // =========================================================================================

    const onUpload = () => {
        const formData = new FormData();
        formData.append('category', property.category);
        formData.append('qrCode', (methods.getValues('image') as Blob));
        if (property.qrFile) {
            formData.append('imageId', String(property.qrFile.id));
            blockService.uploadImage(formData, property.id).then((response) => {
                // setSelectedBlock(property => ({...selectedBlock, images: response.data.images}));
                handleBlockChange({...property, qrFile: response.data.qrFile})
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'Image has been updated!', severity: "success" })
                );
            }).catch(error => {
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'Error Happened while uploading image!', severity: "error" })
                );
            })
        } else {
            blockService.addImage(formData, property.id)
                .then(response =>{
                    handleBlockChange(response.data as Property);
                })
                .catch(error => {})
        }

    }
    return (
        <Box>
            <ValidatedImage
                controllerName="image"
                methods={methods}
                image={property.qrFile ? blockService.getImageUrl(property.qrFile?.url) : ""}
                onUpload={onUpload}
            />
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </Box>
    );
};

export default QrInfo;
