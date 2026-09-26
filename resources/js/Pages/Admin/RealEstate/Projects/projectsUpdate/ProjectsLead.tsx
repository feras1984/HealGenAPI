import React from 'react';
import Project from "@/models/block/Project";
import LeadList from "@/Pages/Admin/RealEstate/Leads/LeadList";

const ProjectsLead: React.FC<{category: string, block: Project}> = ({category, block}) => {
    return (
        <LeadList leads={block.leads}></LeadList>
    );
};

export default ProjectsLead;
