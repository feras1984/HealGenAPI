import React from 'react';
import Project from "@/models/block/Project";
import BrochureInfo from "@/Pages/Admin/RealEstate/Projects/projectsUpdate/BrochureInfo";
import {Box} from "@mui/material";
import QrInfo from "@/Pages/Admin/RealEstate/Projects/projectsUpdate/QrInfo";

const ProjectAttachments: React.FC<{project: Project, handleBlockChange: (block: Project) => void}> = ({project, handleBlockChange}) => {
    return (
        <Box>
            <QrInfo project={project} handleBlockChange={handleBlockChange} />
            <BrochureInfo project={project} handleBlockChange={handleBlockChange} />
        </Box>
    );
};

export default ProjectAttachments;
