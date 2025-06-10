import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { IUser } from '../../types/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  httpClient = inject(HttpClient);
  router = inject(Router);
  private user = signal<IUser | null>(null);

  isLoggedIn() {
    return this.user() !== null;
  }
  setUser(user: IUser) {
    if (!user) {
      this.user.set(null);
      return;
    }
    this.user.set(user);
    this.goTo('/home');
  }
  getUser() {
    return this.user();
  }

  goTo(path: string) {
    this.router.navigateByUrl(path);
  }

  register(user: IUser) {
    const formData = new FormData();

    formData.append('email', user.email);
    formData.append('username', user.username);
    formData.append('name', user.name);
    formData.append('surname', user.surname);
    formData.append('password', user.password!);
    formData.append('dateOfBirth', user.dateOfBirth);
    formData.append('description', user.description || '');
    formData.append('image', user.image!, user.image!.name);

    return this.httpClient
      .post(environment.api_url + 'autenticacion/registro', formData)
      .subscribe((data) => {
        this.setUser(data as IUser);
      });
  }

  login(username: string, password: string) {
    return this.httpClient
      .post(environment.api_url + 'autenticacion/login', { username, password })
      .subscribe((data) => {
        this.setUser(data as IUser);
      });
  }

}
