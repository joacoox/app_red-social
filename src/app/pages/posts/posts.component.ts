import { Component, inject, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ApiService } from '../../services/apiService/api.service';
import { IPost } from '../../types/post';
import { FormsModule } from '@angular/forms';
import { PostComponent } from './post/post.component';
import { IPaginationPosts } from '../../types/paginationPosts';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { CommonModule } from '@angular/common';
import { NewPostModalComponent } from './postsModal/dialog.component';

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
    const dialogRef = this.dialog.open(NewPostModalComponent, {
      data: {
        post: undefined
      },
      width: '450px'
    });
    dialogRef.afterClosed().subscribe((newPost) => {
      if (newPost) {
        this.loadPosts();
      }
    });
  }

  editPost(id: any) {
    const post = this.posts().filter((e: IPost) => e._id === id)
    console.log(post)
    const dialogRef = this.dialog.open(NewPostModalComponent,
      {
        data: {
          post: post[0]
        },
        width: '450px'
      }
    );
    dialogRef.afterClosed().subscribe((editedPost) => {
      if (editedPost) {
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