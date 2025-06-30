import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ApiService } from '../../services/apiService/api.service';
import { IUser } from '../../types/user';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, CommonModule, RouterLink, MatIconModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  dialog = inject(MatDialog);
  auth = inject(ApiService);

  openUserModal() {
    this.dialog.open(UserModalComponent);
  }

  logout() {
    this.auth.logout(false);
  }

}

@Component({
  selector: 'dialog-content-example-dialog',
  templateUrl: 'dialog-user.html',
  imports: [MatDialogModule, MatButtonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserModalComponent implements OnInit {
  auth = inject(ApiService);
  userSignal = signal<IUser | null>(null);
  path = "";
  async ngOnInit(): Promise<void> {
    this.userSignal.set(this.auth.getUser());
    this.path = environment.urlSupaBase + "/storage/v1/object/public/" + this.userSignal()?.image;
  }
}
