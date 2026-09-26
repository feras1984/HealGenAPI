import User from "@/models/User/User";

class Administrator extends User{
    name: string;
    firstName: string;
    lastName: string;
    type: string;
    role: string;
    constructor({
                    id = -1,
                    email = '',
                    avatar = '',
                    isActive = false,
                    createdAt = '',
                    name = '',
                    firstName = '',
                    lastName = '',
                    type = '',
                    role = '',
                }) {
        super({id, email, avatar, isActive, createdAt});
        this.name = name;
        this.firstName = firstName;
        this.lastName = lastName;
        this.type = type;
        this.role = role;
    }
}

export default Administrator;
