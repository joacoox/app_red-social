export interface IUser {
  _id?: string;
  email: string;
  name: string;
  password?: string;
  username: string;
  surname: string;
  description?: string;
  dateOfBirth: string;
  image ?: string | File;
}