import {Service} from "typedi";
import axios from "axios";

@Service()
export class WhatsAppService {
    send(data: FormData) {
        return axios.post(
            "/api/whatsapp/send",
            data,
            {
                headers: {
                    'Content-Type' : 'multipart/form-data',
                }
            }
        );
    }
}
