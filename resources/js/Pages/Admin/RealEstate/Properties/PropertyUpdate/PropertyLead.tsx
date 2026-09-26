import React from 'react';
import Property from "@/models/block/Property";
import LeadList from "@/Pages/Admin/RealEstate/Leads/LeadList";

const PropertyLead: React.FC<{category: string, block: Property}> = ({category, block}) => {
    return (
        <LeadList leads={block.leads}></LeadList>
    );
};

export default PropertyLead;
