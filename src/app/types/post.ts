export interface IPost {
    _id?: string;
    title: string;
    description?: string;
    image?: string | File;
    filed?: boolean;
    userId?: string;
    imageUrl?: string;
    likes?: string[];
    comments?: comment[];
    createdAt?: Date;
}

interface comment {
    username: string;
    createdAt?: Date;
    text: string;
    _id: string;
}