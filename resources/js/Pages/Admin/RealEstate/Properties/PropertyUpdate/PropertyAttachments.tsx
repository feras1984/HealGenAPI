import React from 'react';
import Project from "@/models/block/Project";
import BrochureInfo from "@/Pages/Admin/RealEstate/Properties/PropertyUpdate/BrochureInfo";
import {Box} from "@mui/material";
import QrInfo from "@/Pages/Admin/RealEstate/Properties/PropertyUpdate/QrInfo";
import Property from "@/models/block/Property";

const PropertyAttachments: React.FC<{property: Property, handleBlockChange: (block: Property) => void}> = ({property, handleBlockChange}) => {
    return (
        <Box>
            <QrInfo property={property} handleBlockChange={handleBlockChange} />
            <BrochureInfo property={property} handleBlockChange={handleBlockChange} />
        </Box>
    );
};

export default PropertyAttachments;
