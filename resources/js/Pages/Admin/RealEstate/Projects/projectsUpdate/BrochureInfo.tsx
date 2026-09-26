import React from 'react';
import Project from "@/models/block/Project";
import { Button } from "@/Pages/Site/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Pages/Site/components/ui/card";
import { Upload, FileText, X, Download } from "lucide-react";
import { useToast } from "@/Pages/Site/hooks/use-toast";
import {Container} from "typedi";
import ProjectService from "@/Services/BlockService/ProjectService";
import axios from "axios";
import useSnackbarHook from "@/Hooks/SnackbarHook";

const BrochureInfo: React.FC<{project: Project, handleBlockChange: (block: Project) => void}> = ({project, handleBlockChange}) => {
    const blockService = Container.get(ProjectService);
    const [pdfFile, setPdfFile] = React.useState<string | null>(null);
    const [fileName, setFileName] = React.useState<string>("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (project.brochure) {
            getBrochure();
        }
    }, [project]);

    // =========================================================================================
    // Snackbar configuration section:

    const {snackbar, setSnackbar, handleClose} =
        useSnackbarHook({open: false, message: '', severity: "success"});

    // =========================================================================================

    async function getBrochure() {
        if (project.brochure) {
            blockService.getFile(project.brochure.url)
                .then(response => {
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const fileURL = URL.createObjectURL(blob);
                    setPdfFile(fileURL);
                    setFileName(project.brochure.name);
                })
                .catch(error => {});
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            if (file.type !== "application/pdf") {
                toast({
                    title: "Invalid file type",
                    description: "Please select a PDF file",
                    variant: "destructive",
                });
                return;
            }

            if (file.size > 100 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Maximum file size is 100MB",
                    variant: "destructive",
                });
                return;
            }

            // const fileUrl = URL.createObjectURL(file);
            //Handle Upload here:
            const formData = new FormData();
            formData.append('category', project.category);
            formData.append('brochure', file as Blob);

            if (project.brochure) {
                formData.append('imageId', String(project.brochure.id));
                blockService.uploadImage(formData, project.id).then((response) => {
                    // setSelectedBlock(project => ({...selectedBlock, images: response.data.images}));
                    handleBlockChange({...project, brochure: response.data.brochure})
                    setSnackbar(snackbarState =>
                        ({ ...snackbarState, open: true, message: 'File has been updated!', severity: "success" })
                    );
                }).catch(error => {
                    setSnackbar(snackbarState =>
                        ({ ...snackbarState, open: true, message: 'Error Happened while uploading file!', severity: "error" })
                    );
                })
            } else {
                blockService.addImage(formData, project.id)
                    .then(response =>{
                        handleBlockChange(response.data as Project);
                        setSnackbar(snackbarState =>
                            ({ ...snackbarState, open: true, message: 'File has been updated!', severity: "success" })
                        );
                    })
                    .catch(error => {
                        setSnackbar(snackbarState =>
                            ({ ...snackbarState, open: true, message: 'Error Happened while uploading file!', severity: "error" })
                        );
                    })
            }
            const fileURL = URL.createObjectURL(file);
            setPdfFile(fileURL);
            setFileName(project.brochure.name);
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'PDF loaded successfully', severity: "success" })
            );
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleClearPDF = () => {
        const formData = new FormData();
        formData.append('category', project.category);
        formData.append('imageId', String(project.brochure.id));
        blockService.deleteImage(formData, project.id)
            .then(response => {
                if (pdfFile) {
                    URL.revokeObjectURL(pdfFile);
                }
                setPdfFile(null);
                setFileName("");
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setPdfFile(null);
                setFileName("");
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                handleBlockChange(response.data as Project);
            })
            .catch(error => {})
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">PDF Viewer</h1>
                    {/*<p className="text-muted-foreground text-lg">*/}
                    {/*    Upload and view PDF*/}
                    {/*</p>*/}
                </div>

                <Card className="mb-6 bg-background">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Upload PDF
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <div className="flex flex-wrap items-center gap-4">
                            <Button onClick={handleUploadClick} className="gap-2">
                                <Upload className="w-4 h-4" />
                                Choose PDF File
                            </Button>

                            {project.brochure && <a href={blockService.getImageUrl(project.brochure.url)}
                                download={`/${project.brochure.url}`} target="_blank">
                                <Button className="gap-2">
                                    <Download className="w-4 h-4"/>
                                    Download Brochure
                                </Button>
                            </a>}

                            {fileName && (
                                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-md">
                                    <FileText className="w-4 h-4 text-accent" />
                                    <span className="text-sm text-foreground">{fileName}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearPDF}
                                        className="h-6 w-6 p-0 ml-2"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-4">
                            Maximum file size: 100MB
                        </p>
                    </CardContent>
                </Card>

                {pdfFile ? (
                    <Card>
                        <CardContent className="p-0">
                            <iframe
                                src={pdfFile}
                                className="w-full h-[800px] rounded-lg"
                                title={fileName}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-16">
                            <div className="text-center text-muted-foreground">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No PDF loaded</p>
                                <p className="text-sm mt-2">Upload a PDF file to view it here</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default BrochureInfo;
