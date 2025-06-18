import { Component, inject, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-error-notification',
  imports: [MatIconModule],
  templateUrl: './error-notification.component.html',
  styleUrl: './error-notification.component.css'
})
export class ErrorNotificationComponent implements OnInit {
  data = inject(MAT_SNACK_BAR_DATA);

  ngOnInit(): void {
    console.log(this.data.message);;
  }
}
