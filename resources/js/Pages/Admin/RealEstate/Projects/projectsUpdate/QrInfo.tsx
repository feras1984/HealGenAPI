import React from 'react';
import Project from "@/models/block/Project";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import ValidatedImage from "@/Components/ValidatedComponents/ValidatedImage";
import {Container} from "typedi";
import ProjectService from "@/Services/BlockService/ProjectService";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import {Box} from "@mui/material";

const QrInfo: React.FC<{project: Project, handleBlockChange: (block: Project) => void}> = ({project, handleBlockChange}) => {
    const blockService = Container.get(ProjectService);
    const blockSchema = z.object({});
    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(blockSchema),
        defaultValues: {
            image: (project.qrFile?.url || "" as (File | string)),
        }
    });

    // =========================================================================================
    // Snackbar configuration section:

    const {snackbar, setSnackbar, handleClose} =
        useSnackbarHook({open: false, message: '', severity: "success"});

    // =========================================================================================

    const onUpload = () => {
        const formData = new FormData();
        formData.append('category', project.category);
        formData.append('qrCode', (methods.getValues('image') as Blob));
        if (project.qrFile) {
            formData.append('imageId', String(project.qrFile.id));
            blockService.uploadImage(formData, project.id).then((response) => {
                // setSelectedBlock(project => ({...selectedBlock, images: response.data.images}));
                handleBlockChange({...project, qrFile: response.data.qrFile})
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'Image has been updated!', severity: "success" })
                );
            }).catch(error => {
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'Error Happened while uploading image!', severity: "error" })
                );
            })
        } else {
            blockService.addImage(formData, project.id)
                .then(response =>{
                    handleBlockChange(response.data as Project);
                })
                .catch(error => {})
        }

    }
    return (
        <Box>
            <ValidatedImage
                controllerName="image"
                methods={methods}
                image={project.qrFile ? blockService.getImageUrl(project.qrFile?.url) : ""}
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
