import ListProps from "@/Components/Lists/Interfaces/ListProps";
import Location from "@/models/location/Location";

export interface LocationGridProps {
    id: number;
    name: string;
    code: string;
    city: string;
    country: string;
    isActive: boolean;
    createdAt: string;
}

interface LocationProps extends ListProps {
    locations: Location[];
    toggleActive?: (id: number) => void;
}

export default LocationProps;
