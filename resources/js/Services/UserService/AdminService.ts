import {Service} from "typedi";
import Administrator from "@/models/User/Administrator";
import {AdminGridProps} from "@/Services/UserService/Interfaces/AdminProps";
import axios, {AxiosResponse} from "axios";

@Service()
class AdminService {
    mapAdminsGrid = (admins: Administrator []): AdminGridProps [] => {
        return admins.map(admin => ({
            id: admin.id,
            email: admin.email,
            avatar: admin.avatar,
            isActive: admin.isActive,
            createdAt: admin.createdAt,
            name: admin.name,
            type: admin.type,
            role: admin.role,
        }))
    }

    storeAdmin = (data: FormData) => {
        return axios.post<AxiosResponse<Administrator>>(
            '/users/add',
            data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        )
    }

    updateAdmin = (data: FormData, userId: number) => {
        return axios.post<{
            status: string,
            message: string,
            user: Administrator,
        }>(
            `/users/${userId}?_method=PATCH`,
            data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        )
    }

    uploadAvatar = (data: FormData, userId: number) => {
        return axios.post<{
            status: string,
            message: string,
            user: Administrator,
        }>(
            `/users/upload/${userId}?_method=PATCH`,
            data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        )
    }

    validateEmail = (email: string, id?: number) => {
        return axios.post<AxiosResponse<{status: boolean}>>(
            `/users/validate/email/${id || -1}`,
            {email: email},
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        )
    }
}

export default AdminService;
