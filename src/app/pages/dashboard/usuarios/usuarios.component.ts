import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../services/apiService/api.service';
import { IUser } from '../../../types/user';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ROLES } from '../../../helpers/consts';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationToolTipComponent } from '../../../components/confirmationToolTip/confirmation-tool-tip/confirmation-tool-tip.component';
import { SpinnerComponent } from '../../../components/spinner/spinner.component';

@Component({
  selector: 'app-usuarios',
  imports: [
    MatTableModule, MatButtonModule, MatIconModule,
    ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule,
    MatTooltip, SpinnerComponent
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosComponent implements OnInit {
  formulario: FormGroup;
  users = signal<IUser[]>([]);
  displayedColumns: string[] = ['username', 'email', 'role', 'actions'];
  userService = inject(ApiService)
  selectedFile?: File;
  ROLES = ROLES;
  dialog = inject(MatDialog);
  isWorking = signal<boolean>(false);

  constructor() {

    this.formulario = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
      surname: new FormControl('', [Validators.required, Validators.minLength(3)]),
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(13)]),
      dateOfBirth: new FormControl(new Date(), [Validators.required]),
      description: new FormControl('', [Validators.required]),
      role: new FormControl(ROLES.USER, Validators.required),
    });
  }

  ngOnInit(): void {
    this.getUsers();
  }

  private formatDateToApi(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onFileSelected(event: any) {
    if (event.target && event.target.files) {
      this.selectedFile = event.target.files[0];
    }
  }

  getUsers() {
    this.isWorking.set(true);
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
      },
    });
    this.isWorking.set(false);
  }

  async registerUser() {
    this.isWorking.set(true);
    if (!this.ValidateFields()) {
      return;
    }
    const user: IUser = {
      email: this.email?.value!,
      name: this.name?.value!,
      surname: this.surname?.value!,
      username: this.username?.value!,
      password: this.password?.value!,
      dateOfBirth: this.formatDateToApi(this.dateOfBirth!.value),
      description: this.description?.value || '',
      role: this.role?.value || ROLES.USER,
      image: this.selectedFile!
    };

    (await this.userService.createUser(user)).subscribe({
      next: (data) => {
        this.getUsers();
        this.formulario.reset();
        this.selectedFile = undefined;
      },
    });
    this.isWorking.set(false);
  }

  disableUser(id: string) {
    this.isWorking.set(true);
    this.userService.disableUser(id).subscribe({
      next: (data) => {
        this.getUsers();
      }
    });
    this.isWorking.set(false);
  }

  enableUser(id: string) {
    this.isWorking.set(true);
    this.userService.enableUser(id).subscribe({
      next: (data) => {
        this.getUsers();
      },
    });
    this.isWorking.set(false);
  }

  confirmationDialog(id: string, username: string) {
    const dialogRef = this.dialog.open(ConfirmationToolTipComponent, {
      data: {
        message: "Estas seguro de que deseas bloquear a " + username + "?"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.disableUser(id);
      }
    });
  }

  ValidateFields(): boolean {

    if (this.email?.hasError("required")) {
      return false;
    }

    if (this.email?.invalid) {
      return false;
    }
    if (this.username?.hasError("required")) {
      return false;
    }

    if (this.username?.hasError("minlength")) {
      return false;
    }

    if (this.name?.hasError("required")) {
      return false;
    }

    if (this.name?.hasError("minlength")) {
      return false;
    }

    if (this.surname?.hasError("required")) {
      return false;
    }

    if (this.surname?.hasError("minlength")) {
      return false;
    }

    if (this.password?.hasError("required")) {
      return false;
    }

    if (this.password?.hasError("minlength")) {
      return false;
    }

    if (this.password?.hasError("maxlength")) {
      return false;
    }

    if (this.role?.value !== ROLES.ADMIN && this.role?.value !== ROLES.USER) {
      return false;
    }

    if (this.dateOfBirth?.value === null || this.dateOfBirth?.value === undefined) {
      return false;
    }

    if (this.selectedFile === null || this.selectedFile === undefined || !(this.selectedFile instanceof File)) {
      return false;
    }

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
  get description() {
    return this.formulario.get('description');
  }

  get role() {
    return this.formulario.get('role');
  }
}