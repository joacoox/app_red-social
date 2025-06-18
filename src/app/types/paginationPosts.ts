import { IPost } from "./post";

export interface IPaginationPosts {
    total : number;
    page : number;
    limit : number;
    totalPages : number;
    results : IPost[];
}