import { Service } from "typedi";
import Location from "@/models/location/Location";
import { LocationGridProps } from "@/Services/LocationService/Interfaces/LocationProps";
import axios, { AxiosResponse } from "axios";

@Service()
class LocationService {
    mapLocationsGrid = (locations: Location[]): LocationGridProps[] => {
        return locations.map(location => ({
            id: location.id,
            name: location.name,
            code: location.code,
            city: location.city,
            country: location.country,
            isActive: location.isActive,
            createdAt: location.createdAt,
        }));
    }

    storeLocation = (data: FormData | any) => {
        return axios.post<{
            status: boolean;
            message: string;
            location: Location;
        }>(
            '/locations/add',
            data
        );
    }

    updateLocation = (data: FormData | any, locationId: number) => {
        return axios.post<{
            status: boolean;
            message: string;
            location: Location;
        }>(
            `/locations/${locationId}?_method=PATCH`,
            data
        );
    }

    toggleActive = (locationId: number) => {
        return axios.post<{
            status: boolean;
            message: string;
            location: Location;
        }>(
            `/locations/${locationId}/toggle-active?_method=PATCH`
        );
    }

    validateCode = (code: string, id?: number) => {
        return axios.post<AxiosResponse<{ status: boolean }>>(
            `/locations/validate/code/${id || -1}`,
            { code: code }
        );
    }
}

export default LocationService;
