import { Component, inject, input, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-succes-notification',
  imports: [MatIconModule],
  templateUrl: './succes-notification.component.html',
  styleUrl: './succes-notification.component.css'
})
export class SuccesNotificationComponent implements OnInit {

  data = inject(MAT_SNACK_BAR_DATA);
 
  ngOnInit(): void {
    console.log(this.data.message);;
  }

}
