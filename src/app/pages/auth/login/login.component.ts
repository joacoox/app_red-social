import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpinnerComponent } from '../../../components/spinner/spinner.component';
import { ApiService } from '../../../services/apiService/api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  api = inject(ApiService);
  router = inject(Router);
  formulario: FormGroup;
  flagError = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  msjError: string = "";


  constructor() {
    this.formulario = new FormGroup({
      username: new FormControl("", [Validators.required]),
      password: new FormControl("", [Validators.required])
    });
  }
  goTo(path: string) {
    this.router.navigateByUrl(path);
  }

  async login() {
    this.isLoading.set(true);
    if (!this.ValidateFields()) {
      this.isLoading.set(false);
      return;
    }
    this.api.login(this.username?.value, this.password?.value).subscribe({
      next: () => {
        this.goTo('/home/posts');
      },
      error: (err) => {
        this.flagError.set(true);
        this.msjError = "Error al iniciar sesion";
      }
    });
    this.isLoading.set(false);
  }

  ValidateFields(): boolean {
    if (this.username?.hasError("required")) {
      this.flagError.set(true);
      this.msjError = "El username es obligatorio";
      return false;
    }

    if (this.password?.hasError("required")) {
      this.flagError.set(true);
      this.msjError = "La contraseña es obligatoria";
      return false;
    }
    this.flagError.set(false);
    this.msjError = "";
    return true;
  }

  get username() {
    return this.formulario.get('username');
  }
  get password() {
    return this.formulario.get('password');
  }

  async AutoLogin() {
    this.isLoading.set(true);
    this.api.login("joaquin", "jOa123456").subscribe({
      next: () => {
        this.goTo('/home/posts');
      },
      error: (err) => {
        console.log("Error capturado en componente:", err);
        this.flagError.set(true);
        this.msjError = "Error al iniciar sesion";
      }
    });
    this.isLoading.set(false);
  }
}
