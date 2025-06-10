export interface IUser {
  id?: string;
  email: string;
  name: string;
  password?: string;
  username: string;
  surname: string;
  description?: string;
  dateOfBirth: string;
  image ?: File;
  path ?: string;
}