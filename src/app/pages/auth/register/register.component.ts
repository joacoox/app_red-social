import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../../../components/spinner/spinner.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApiService } from '../../../services/apiService/api.service';
import { IUser } from '../../../types/user';

@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule, SpinnerComponent, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  templateUrl: './register.component.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  api = inject(ApiService);
  router = inject(Router);
  formulario: FormGroup;
  flagError = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  msjError: string = "";
  minLength: number = 6;
  maxLength: number = 13;
  //date picker
  date = new FormControl(new Date(), [Validators.required]);
  // image
  image?: File;

  constructor() {
    this.formulario = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email]),
      username: new FormControl("", [Validators.required]),
      name: new FormControl("", [Validators.required]),
      surname: new FormControl("", [Validators.required]),
      repeatPassword: new FormControl("", [Validators.required, Validators.minLength(this.minLength), Validators.maxLength(this.maxLength)]),
      password: new FormControl("", [Validators.required, Validators.minLength(this.minLength), Validators.maxLength(this.maxLength)]),
      dateOfBirth: this.date,
      description: new FormControl("", [Validators.required]),
      //profilePic: new FormControl<File | null>(null, [Validators.required]),
    });

  }

  async registrar() {
    try {
      this.isLoading.set(true);
      if (!this.ValidateFields()) {
        this.isLoading.set(false);
        return;
      }
      const user: IUser = {
        email: this.email?.value,
        name: this.name?.value,
        surname: this.surname?.value,
        username: this.username?.value,
        password: this.password?.value,
        dateOfBirth: this.formatDateToApi(this.dateOfBirth!.value),
        description: this.description?.value,
        image: this.image
      };
      this.api.register(user);

    } catch (error) {
      this.flagError.set(true);
      this.msjError = "Error al crear la cuenta";
    } finally {
      this.isLoading.set(false);
    }
  }

  saveImage(event: any) {
    if (event.target && event.target.files) {
      this.image = event.target.files[0];
    }
  }
  private formatDateToApi(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  HandleError(error: any) {
    if (error === null) return;
    this.flagError.set(true);

    switch (error.error.message) {
      case "User already registered":
        this.msjError = "Usuario ya registrado con ese email";
        break;
      default:
        this.msjError = "Error al crear la cuenta";
        break;
    }
  }

  ValidateFields(): boolean {

    if (this.email?.hasError("required")) {
      this.flagError.set(true);
      this.msjError = "El email es obligatorio";
      return false;
    }

    if (this.email?.invalid) {
      this.flagError.set(true);
      this.msjError = "El email no es valido";
      return false;
    }

    if (this.name?.hasError("required")) {
      this.flagError.set(true);
      this.msjError = "El nombre es obligatorio";
      return false;
    }

    if (this.surname?.hasError("required")) {
      this.flagError.set(true);
      this.msjError = "El apellido es obligatorio";
      return false;
    }

    if (this.password?.hasError("required") && this.repeatPassword?.hasError("required")) {
      this.flagError.set(true);
      this.msjError = "La contraseña es obligatoria";
      return false;
    }

    if (this.password?.hasError("minlength") && this.repeatPassword?.hasError("minlength")) {
      this.flagError.set(true);
      this.msjError = "La contraseña debe tener al menos " + this.minLength + " caracteres";
      return false;
    }

    if (this.password?.hasError("maxlength") && this.repeatPassword?.hasError("maxlength")) {
      this.flagError.set(true);
      this.msjError = "La contraseña debe tener como maximo " + this.maxLength + " caracteres";
      return false;
    }

    if (this.password?.value !== this.repeatPassword?.value) {
      this.flagError.set(true);
      this.msjError = "Las contraseñas no coinciden";
      return false;
    }

    if (this.dateOfBirth?.value === null || this.dateOfBirth?.value === undefined) {
      this.flagError.set(true);
      this.msjError = "La fecha de nacimiento es obligatoria";
      return false;
    }

    if (this.image === null || this.image === undefined || !(this.image instanceof File)) {
      this.flagError.set(true);
      this.msjError = "La foto de perfil es obligatoria";
    }
    this.flagError.set(false);
    this.msjError = "";
    return true;
  }

  get email() {
    return this.formulario.get('email');
  }
  get name() {
    return this.formulario.get('name');
  }
  get username() {
    return this.formulario.get('username');
  }
  get surname() {
    return this.formulario.get('surname');
  }
  get dateOfBirth() {
    return this.formulario.get('dateOfBirth');
  }
  get password() {
    return this.formulario.get('password');
  }
  get repeatPassword() {
    return this.formulario.get('repeatPassword');
  }
  get description() {
    return this.formulario.get('description');
  }

  goTo(path: string) {
    this.router.navigateByUrl(path);
  }
}
