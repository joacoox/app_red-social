import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../../services/apiService/api.service';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';

const today = new Date();
const month = today.getMonth();
const year = today.getFullYear();

@Component({
  selector: 'app-estadisticas',
  imports: [
    BaseChartDirective, MatFormFieldModule, MatDatepickerModule, FormsModule, ReactiveFormsModule,MatIcon
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadisticasComponent implements OnInit {

  api = inject(ApiService);
  postsPerUser = signal<any[]>([]);
  allComments = signal<number>(0);
  commentsPost = signal<any[]>([]);
  
  postsPerUserEvent() {
    let start = this.postsPerUserDates.get('start')?.value;
    let end = this.postsPerUserDates.get('end')?.value;
    if(start && end) {
      this.loadPostsPerUser(start, end);
    }
  }
  readonly postsPerUserDates = new FormGroup({
    start: new FormControl(new Date(year, month-1, new Date().getDate())),
    end: new FormControl(new Date(year, month, new Date().getDate())),
  });

  allCommentsEvent() {
    let start = this.allCommentsDate.get('start')?.value;
    let end = this.allCommentsDate.get('end')?.value;
    if(start && end) {
      this.getAllComments(start, end);
    }
  }
  readonly allCommentsDate = new FormGroup({
    start: new FormControl(new Date(year, month-1, new Date().getDate())),
    end: new FormControl(new Date(year, month, new Date().getDate())),
  });

  commentsPerPostEvent() {
    let start = this.commentsPerPostDate.get('start')?.value;
    let end = this.commentsPerPostDate.get('end')?.value;
    if(start && end) {
      this.commentsPerPost(start, end);
    }
  }
  readonly commentsPerPostDate = new FormGroup({
    start: new FormControl(new Date(year, month-1, new Date().getDate())),
    end: new FormControl(new Date(year, month, new Date().getDate())),
  });

  barChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [
      {
        label: 'Publicaciones',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  });

  barChartLabels = signal<string[]>([]);

  barChartOptions = signal<ChartOptions<'bar'>>({
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#222", // var(--gray-800)
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#64707d' }, // var(--gray-600)
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      y: {
        ticks: { color: '#64707d' },
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  });

  barChartDataComments = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [
      {
        label: 'Comentarios por Publicación',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  });

  barChartOptionsComments = signal<ChartOptions<'bar'>>({
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#222",
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#64707d' },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      y: {
        ticks: { color: '#64707d' },
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  });

  doughnutChartDataComments = signal<ChartData<'doughnut'>>({
    labels: ['Total de comentarios'],
    datasets: [
      {
        label: 'Comentarios',
        data: [0],
        backgroundColor: ['rgba(75, 192, 192, 0.5)'], // verde agua
        borderColor: ['rgba(75, 192, 192, 1)'],
        borderWidth: 1
      }
    ]
  });

  doughnutChartOptionsComments = signal<ChartOptions<'doughnut'>>({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#222'
        }
      }
    }
  });


  ngOnInit(): void {
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    const to = new Date();
    to.setDate(to.getDate() + 1);

    this.loadPostsPerUser(from, to);
    this.getAllComments(from, to);
    this.commentsPerPost(from, to);
  }

  private formatDateToApi(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // loadPostsPerUser(from: Date, to: Date) {

  //   this.api.getPostsPerUser(this.formatDateToApi(from), this.formatDateToApi(to)).subscribe((data) => {
  //     console.log("Posts Per User: ", data);
  //     this.postsPerUser.set(data);
  //   });
  // }

  loadPostsPerUser(from: Date, to: Date) {
    this.api.getPostsPerUser(this.formatDateToApi(from), this.formatDateToApi(to)).subscribe((data) => {
      this.postsPerUser.set(data);

      const labels = data.map((user: any) => user.username || 'Sin nombre');
      const values = data.map((user: any) => user.count || 0);

      this.barChartData.set({
        ...this.barChartData(),
        labels: labels,
        datasets: [
          {
            ...this.barChartData().datasets[0],
            data: values
          }
        ]
      });
    });
  }


  getAllComments(from: Date, to: Date) {
    this.api.getAllComments(this.formatDateToApi(from), this.formatDateToApi(to)).subscribe((data) => {
      this.allComments.set(data?.totalComentarios || 0);

      this.doughnutChartDataComments.set({
        ...this.doughnutChartDataComments(),
        datasets: [
          {
            ...this.doughnutChartDataComments().datasets[0],
            data: [data?.totalComentarios || 0]
          }
        ]
      });
    });
  }


  commentsPerPost(from: Date, to: Date) {
    this.api.commentsPerPost(this.formatDateToApi(from), this.formatDateToApi(to)).subscribe((data) => {
      this.commentsPost.set(data);

      const labels = data.map((post: any) => post.title || 'Sin título');
      const values = data.map((post: any) => post.cantidadComentarios || 0);

      this.barChartDataComments.set({
        ...this.barChartDataComments(),
        labels: labels,
        datasets: [
          {
            ...this.barChartDataComments().datasets[0],
            data: values
          }
        ]
      });
    });
  }

}
