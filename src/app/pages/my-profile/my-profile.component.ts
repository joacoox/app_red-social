import { Component, inject, OnInit, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/apiService/api.service';
import { IUser } from '../../types/user';
import { IPost } from '../../types/post';
import { IPaginationPosts } from '../../types/paginationPosts';
import { DatePipe } from '@angular/common';
import { PostComponent } from '../posts/post/post.component';
import { MatDialog } from '@angular/material/dialog';
import { NewPostModalComponent } from '../posts/postsModal/dialog.component';
import { SpinnerComponent } from '../../components/spinner/spinner.component';

@Component({
  selector: 'app-my-profile',
  imports: [DatePipe, PostComponent, SpinnerComponent],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnInit {

  auth = inject(ApiService);
  userSignal = signal<IUser | null>(null);
  recentPosts = signal<IPost[]>([]);
  path = "";
  isLoading = signal<boolean>(false);
  postService = inject(ApiService);
  dialog = inject(MatDialog);

  async ngOnInit(): Promise<void> {
    this.loadPosts();
    this.userSignal.set(this.auth.getUser());
    this.path = environment.urlSupaBase + "/storage/v1/object/public/" + this.userSignal()?.image;
  }

  loadPosts() {
    this.isLoading.set(true);
    let user = this.auth.getUser()
    this.postService.getPosts('date', 1, 3, user?._id).subscribe({
      next: (data) => {
        const response = data as IPaginationPosts;
        this.recentPosts.set(Array.isArray(response.results) ? response.results : []);
      },
      error: (err) => console.error('Error cargando posts:', err)
    });
    this.isLoading.set(false);
  }

  editPost(id: any) {
    const post = this.recentPosts().filter((e: IPost) => e._id === id)
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

}

