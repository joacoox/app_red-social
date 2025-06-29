import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IUser } from '../../types/user';
import { Router } from '@angular/router';
import { catchError, from, map, Observable, Subscription, tap, throwError, timer } from 'rxjs';
import { IAuth } from '../../types/auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NotifyService } from '../notify/notify.service';
import { Comment, IPost } from '../../types/post';
import { funciones } from '../../helpers/functions';
import { MatDialog } from '@angular/material/dialog';
import { ExtendSessionDialogComponent } from '../../components/extendSessionDialog/extend-session-dialog/extend-session-dialog.component';
import { ROLES } from '../../helpers/consts';

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
  private dialog = inject(MatDialog);
  private ngZone = inject(NgZone);

  private warningTimerSub: Subscription = new Subscription;
  private expireTimerSub: Subscription = new Subscription;

  private readonly sessionDuration = 15 * 60 * 1000;
  private readonly warningOffset = 10 * 60 * 1000;

  constructor() {
    this.supabase = createClient(environment.urlSupaBase, environment.tokenSupaBase);
  }

  private startTimers() {

    this.warningTimerSub?.unsubscribe();
    this.expireTimerSub?.unsubscribe();

    this.warningTimerSub = timer(this.warningOffset
    ).subscribe(() => {
      this.ngZone.run(() => this.openExtendDialog());
    });

    this.expireTimerSub = timer(this.sessionDuration).subscribe(() => {
      this.logout();
    });
  }

  private openExtendDialog() {
    const dialogRef = this.dialog.open(ExtendSessionDialogComponent, {
      width: '400px',
      data: { minutesLeft: 5 }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.refreshToken().subscribe({
          next: () => {
            this.notify.showSuccess("Sesion extendida")
          },
          error: (err) => {
            this.notify.showError("No pudimos extender tu sesion")
          }
        });
      }
    });
  }

  private refreshToken() {

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<IAuth>(environment.api_url + 'autenticacion/refrescar', {}, { headers }).pipe(
      tap((data) => {
        this.startTimers();
        this.setToken(data.token);
        this.setUser(data);
        this.notify.showSuccess(`Sesion extendida correctamente!`);
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al extender sesion';

        if (error.status === 401) {
          this.logout();
          return throwError(() => new Error());
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.notify.showError(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getToken() {
    return this.token();
  }

  private setToken(token: string) {
    if (!token) return;
    this.token.set(token);
  }

  logout(showMessage: boolean = true) {
    this.user.set(null);
    this.token.set(null);
    if (showMessage) {
      this.notify.showError("Porfavor ingrese sus credenciales nuevamente");
    }
    this.goTo('/login');
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

  isAdmin(): boolean {
    const user = this.getUser();
    return user ? user.role === ROLES.ADMIN : false;
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
        this.startTimers();
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
          this.logout();
          return throwError(() => new Error());
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
          this.logout();
          return throwError(() => new Error());
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

  deletePost(id: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.delete<any>(environment.api_url + 'publication/' + id, { headers }).pipe(
      tap((data) => {
        this.notify.showSuccess(`Publicacion eliminada con exito`);
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al eliminar la publicacion';
        if (error.status === 401) {
          this.logout();
          return throwError(() => new Error());
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

  editPost(post: IPost, id: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.put<any>(environment.api_url + 'publication/' + id, {
      title: post.title,
      description: post.description ? post.description : ""
    }, { headers }).pipe(
      tap((data) => {
        this.notify.showSuccess(`Publicacion editada con exito`);
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al editar la publicacion';
        if (error.status === 401) {
          this.logout();
          return throwError(() => new Error());
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

          if (error.status === 401) {
            this.logout();
            return throwError(() => new Error());
          }

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
          if (error.status === 401) {
            this.logout();
            return throwError(() => new Error());
          }
          this.notify.showError(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  commentPost(idPost: string, comments: Comment) {

    const url = `${environment.api_url}comments/${idPost}/comments`;

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
          if (error.status === 401) {
            this.logout();
            return throwError(() => new Error());
          }
          const errorMessage = 'Error al comentar la publicacion';
          this.notify.showError(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  findAllComments(id: string, limit: number = 0) {
    const url = `${environment.api_url}comments/${id}/comments/findAll`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });
    let params = new HttpParams()
      .set('limit', limit.toString());

    return this.httpClient.get<any>(url,
      { headers, params }).pipe(
        tap((data) => {
        }),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = 'Error al traer los comentarios';
          if (error.status === 401) {
            this.logout();
            return throwError(() => new Error());
          }
          this.notify.showError(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Usuarios Module 

  getAllUsers() {

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.get<any>(environment.api_url + 'usuarios', { headers }).pipe(
      map(response => {
        return response as IUser[];
      }),
      catchError((error: HttpErrorResponse) => {

        let errorMessage = 'Error al traer los usuarios';

        if (error.status === 401) {
          this.logout();
          return throwError(() => new Error());
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

  async createUser(user: IUser) {

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });
    let imageData: any = null;

    try {
      if (user.image instanceof File) {
        imageData = await this.saveFile(`${user.dateOfBirth}-${user.username}`, user.image);
        if (imageData === null) throw new Error;
        user.image = imageData.fullPath;
      }
    } catch (error: any) {
      this.notify.showError("Error subiendo la imagen");
      return throwError(() => new Error("Error subiendo la imagen"));
    }

    return this.httpClient.post<any>(environment.api_url + 'usuarios', user, { headers }).pipe(
      tap(() => {
        this.notify.showSuccess('Usuario creado correctamente');
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al crear el usuario';
        if (error.status === 401) {
          this.logout();
          return throwError(() => new Error());
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

  disableUser(id: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.delete<any>(environment.api_url + 'usuarios/' + id, { headers }).pipe(
      tap(() => {
        this.notify.showSuccess('Usuario deshabilitado correctamente');
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al deshabilitar el usuario';
        if (error.status === 401) {
          this.logout();
          return throwError(() => new Error());
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

  enableUser(id: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<any>(environment.api_url + 'usuarios/' + id + '/enable', {}, { headers }).pipe(
      tap(() => {
        this.notify.showSuccess('Usuario habilitado correctamente');
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al habilitar el usuario';
        if (error.status === 401) {
          this.logout();
          return throwError(() => new Error());
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
