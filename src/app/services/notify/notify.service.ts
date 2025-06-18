import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { SuccesNotificationComponent } from '../../components/succes-notification/succes-notification.component';
import { ErrorNotificationComponent } from '../../components/error-notification/error-notification.component';

@Injectable({
  providedIn: 'root'
})
export class NotifyService {

  private snackBar = inject(MatSnackBar); 

  showSuccess(message: string, duration: number = 5000) {
    this.snackBar.openFromComponent(SuccesNotificationComponent, {
      data: { message }, 
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
  showError(message: string, duration: number = 5000): MatSnackBarRef<any> {
    return this.snackBar.openFromComponent(ErrorNotificationComponent, {
      data: { message },
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

}
