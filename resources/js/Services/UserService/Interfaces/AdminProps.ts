import ListProps from "@/Components/Lists/Interfaces/ListProps";
import Administrator from "@/models/User/Administrator";
import PatientTest from "@/models/patient/PatientTest";


interface AdminProps extends ListProps {
    admins: Administrator [],
}

export default AdminProps;

export interface AdminGridProps {
    id: number;
    email: string;
    avatar: string;
    isActive: boolean;
    createdAt: string;
    name: string;
    type: string;
    role: string;
}


