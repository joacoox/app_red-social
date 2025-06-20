import { IUser } from "./user";

export interface IPost {
    _id?: string;
    title: string;
    description?: string;
    image?: string | File;
    filed?: boolean;
    userId?: IUser;
    username?:string;
    imageUrl?: string;
    likes?: string[];
    comments?: Comment[];
    createdAt?: Date;
}

export interface Comment {
    username?: string;
    image?:string | File;
    createdAt?: Date;
    text: string;
    userId?: any;
}