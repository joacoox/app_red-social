import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IUser } from '../../types/user';
import { Router } from '@angular/router';
import { catchError, from, map, Observable, of, tap, throwError } from 'rxjs';
import { IAuth } from '../../types/auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NotifyService } from '../notify/notify.service';
import { Comment, IPost } from '../../types/post';
import { funciones } from '../../helpers/functions';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  supabase: SupabaseClient<any, "public", any>;
  httpClient = inject(HttpClient);
  router = inject(Router);
  private notify = inject(NotifyService);
  private user = signal<IUser | null>(null);
  private token = signal<string | null>(null);

  constructor() {
    this.supabase = createClient(environment.urlSupaBase, environment.tokenSupaBase);
  }

  getToken() {
    return this.token();
  }

  private setToken(token: string) {
    if (!token) return;
    this.token.set(token);
  }

  isLoggedIn() {
    return this.user() !== null;
  }
  setUser(user: IAuth) {
    if (!user.user) {
      this.user.set(null);
      return;
    }
    this.notify.showSuccess('Bienvenido ' + user.user.username + '!');
    this.user.set(user.user);
  }
  getUser(): IUser | null {
    return this.user();
  }

  goTo(path: string) {
    this.router.navigateByUrl(path);
  }

  register(user: IUser): Observable<IAuth> {
    return new Observable<IAuth>(observer => {
      let imageData: any = null;

      const executeRegister = async () => {
        try {

          if (user.image instanceof File) {
            imageData = await this.saveFile(`${user.dateOfBirth}-${user.username}`, user.image);
          }

          const payload = {
            email: user.email,
            username: user.username,
            name: user.name,
            surname: user.surname,
            password: user.password,
            dateOfBirth: user.dateOfBirth,
            description: user.description || '',
            image: imageData?.fullPath || ''
          };

          const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

          this.httpClient.post<IAuth>(
            environment.api_url + 'autenticacion/registro',
            payload,
            { headers }
          ).subscribe({
            next: (data) => {
              this.setToken(data.token);
              this.setUser(data);
              this.notify.showSuccess(`¡Bienvenido ${data.user.username}! Registro exitoso.`);
              observer.next(data);
              observer.complete();
            },
            error: (error: HttpErrorResponse) => {
              let errorMessage = 'Error al registrarse';

              if (error.status === 0) {
                errorMessage = 'No hay conexión con el servidor';
              } else if (error.status === 400) {
                errorMessage = 'Credenciales inválidas';
              } else if (error.status === 409) {
                errorMessage = 'El usuario o correo electrónico ya existe';
              } else if (error.status === 500) {
                errorMessage = error.error.message || 'Error interno del servidor';
              } else if (error.error?.message) {
                errorMessage = error.error.message;
              }

              if (imageData?.fullPath) {
                this.deleteFile(imageData.fullPath).catch(cleanError => {
                  console.error('Error limpiando imagen:', cleanError);
                });
              }

              this.notify.showError(errorMessage);
              observer.error(new Error(errorMessage));
            }
          });
        } catch (err: any) {
          this.notify.showError("Error subiendo la imagen");
          if (imageData?.fullPath) {
            await this.deleteFile(imageData.fullPath);
          }
          observer.error(new Error("Error subiendo la imagen"));
        }
      };

      executeRegister();
    });
  }

  login(username: string, password: string) {
    return this.httpClient.post<IAuth>(environment.api_url + 'autenticacion/login', {
      username,
      password
    }).pipe(
      tap((data) => {
        this.setToken(data.token);
        this.setUser(data);
        this.notify.showSuccess(`Bienvenido ${data.user.username}!`);
      }),
      catchError((error: HttpErrorResponse) => {

        console.error("Error en login:", error);

        let errorMessage = 'Error al iniciar sesión';

        if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          errorMessage = 'No hay conexión con el servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.notify.showError(errorMessage);

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getPosts(
    sortBy: 'date' | 'likes',
    page: number,
    limit: number,
    userId?: string
  ) {

    let params = new HttpParams()
      .set('sortBy', sortBy)
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (userId) {
      params = params.set('userId', userId);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.get<any>(environment.api_url + 'publication', { headers, params }).pipe(
      map(response => {
        if (response.posts && Array.isArray(response.posts)) {
          return response.posts;
        }
        return response;
      }),
      catchError((error: HttpErrorResponse) => {

        let errorMessage = 'Error al traer las publicaciones';

        if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          errorMessage = 'No hay conexión con el servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.notify.showError(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  async createPost(post: IPost) {
    let imageData = null;
    try {
      if (post.image instanceof File) {
        imageData = await this.saveFile(funciones.generarHash(), post.image);
      }
    } catch (err) {
      this.notify.showError("Error subiendo la imagen");
      return;
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(environment.api_url + 'publication', {
      image: imageData?.fullPath,
      title: post.title,
      description: post.description ? post.description : ""
    }, { headers }).pipe(
      tap((data) => {
        this.notify.showSuccess(`Publicacion creada con exito`);
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al crear la publicacion';

        if (imageData?.fullPath) {
          try {
            this.deleteFile(imageData.fullPath);
          } catch (cleanError) {
            console.error('Error limpiando imagen:', cleanError);
          }
        }

        if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          errorMessage = 'No hay conexión con el servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.notify.showError(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  likePost(id: string) {

    const url = `${environment.api_url}publication/${id}/like`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(url, {},
      { headers }).pipe(
        tap((data) => {
        }),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = 'Error al likear la publicacion';
          this.notify.showError(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  unLikePost(id: string) {
    const url = `${environment.api_url}publication/${id}/like`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.delete<any>(url,
      { headers }).pipe(
        tap((data) => {
        }),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = 'Error al sacar el like de publicacion';
          this.notify.showError(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  commentPost(idPost: string, comments: Comment) {

    const url = `${environment.api_url}publication/${idPost}/comments`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(url, comments,
      { headers }).pipe(
        tap((data) => {
          console.log("succes")
        }),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = 'Error al comentar la publicacion';
          this.notify.showError(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  async saveFile(path: string, image: File) {
    const { data, error } = await this.supabase.storage
      .from('images-user')
      .upload(`public/${path}`, image);
    if (error) {
      throw error;
    }
    return data;
  }
  async deleteFile(path: string) {
    let pathImage = environment.urlSupaBase + "/storage/v1/object/public/" + path;
    const { error } = await this.supabase.storage
      .from('images-user')
      .remove([pathImage]);
    if (error) {
      console.error('Error deleting file:', error);
    }
  }
}
