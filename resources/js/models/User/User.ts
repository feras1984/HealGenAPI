class User {
    id: number;
    email: string;
    avatar: string;
    isActive: boolean;
    createdAt: string;

    constructor({
        id = -1,
        email = '',
        avatar = '',
        isActive = false,
        createdAt = '',
                }) {
        this.id = id;
        this.email = email;
        this.avatar = avatar;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }
}

export default User;
