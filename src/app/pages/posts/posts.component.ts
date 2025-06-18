import { ChangeDetectionStrategy, Component, inject, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ApiService } from '../../services/apiService/api.service';
import { IPost } from '../../types/post';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostComponent } from './post/post.component';
import { IPaginationPosts } from '../../types/paginationPosts';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { CommonModule } from '@angular/common';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-posts',
  imports: [FormsModule, PostComponent, MatIconModule, CommonModule, SpinnerComponent],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css'
})
export class PostsComponent implements OnInit, OnChanges {

  dialog = inject(MatDialog);
  posts = signal<IPost[]>([]);
  sortBy: 'date' | 'likes' = 'date';
  postService = inject(ApiService);
  isLoading = signal<boolean>(false);

  pagination: Pagination = {
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0,
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadPosts();
  }

  loadPosts() {
    this.isLoading.set(true);
    this.postService.getPosts(this.sortBy, this.pagination.page, this.pagination.limit).subscribe({
      next: (data) => {
        const response = data as IPaginationPosts;
        this.posts.set(Array.isArray(response.results) ? response.results : []);
        this.pagination = {
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages
        }
      },
      error: (err) => console.error('Error cargando posts:', err)
    });
    this.isLoading.set(false);
  }

  createPost() {
    const dialogRef = this.dialog.open(PostModalComponent);
    dialogRef.afterClosed().subscribe((newPost) => {
      if (newPost) {
        this.loadPosts();
      }
    });
  }
  nextPage() {
    if (this.pagination.page < this.pagination.totalPages) {
      this.pagination.page++;
      this.loadPosts();
    }
  }

  prevPage() {
    if (this.pagination.page > 1) {
      this.pagination.page--;
      this.loadPosts();
    }
  }

  changeSort(order: 'date' | 'likes') {
    this.sortBy = order;
    this.pagination.page = 1;
    this.loadPosts();
  }

  onPostLiked() {
    this.loadPosts();
  }
}

@Component({
  selector: 'dialog-content-example-dialog',
  templateUrl: 'dialog-post.html',
  imports: [MatDialogModule, MatButtonModule, FormsModule, ReactiveFormsModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dialog-post.css'
})
export class PostModalComponent {
  isLoading = signal<boolean>(false);
  formulario: FormGroup;
  image?: File;
  api = inject(ApiService);
  flagError = signal<boolean>(false);
  msjError: string = "";
  minLength = 5;
  dialog = inject(MatDialogRef<PostModalComponent>);

  constructor() {
    this.formulario = new FormGroup({
      title: new FormControl("", [Validators.required, Validators.minLength(this.minLength)]),
      description: new FormControl("", [Validators.required]),
    });
  }

  saveImage(event: any) {
    if (event.target && event.target.files) {
      this.image = event.target.files[0];
    }
  }

  async createPublication() {
    this.isLoading.set(true);

    if (!this.ValidateFields()) {
      this.isLoading.set(false);
      return;
    }

    const post: IPost = {
      title: this.title?.value,
      description: this.description?.value,
      image: this.image
    };

    const post$ = await this.api.createPost(post);

    if (post$) {
      post$.subscribe({
        next: () => {
          this.isLoading.set(false);
          this.dialog.close(post)
        },
        error: (err: any) => {
          this.isLoading.set(false);
          console.error("Error creating post:", err);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  ValidateFields(): boolean {

    if (this.title?.hasError("required")) {
      this.flagError.set(true);
      this.msjError = "El titulo es obligatorio";
      return false;
    }

    if (this.title?.hasError("minLength")) {
      this.flagError.set(true);
      this.msjError = "El titulo debe tener al menos  " + this.minLength + " caracteres";
      return false;
    }
    if (this.image === null || this.image === undefined || !(this.image instanceof File)) {
      this.flagError.set(true);
      this.msjError = "La imagen es obligatoria";
      return false;
    }
    this.flagError.set(false);
    this.msjError = "";
    return true;
  }

  get title() {
    return this.formulario.get('title');
  }
  get description() {
    return this.formulario.get('description');
  }
}
