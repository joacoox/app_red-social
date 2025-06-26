import { Component, inject, input, OnChanges, OnInit, output, signal } from '@angular/core';
import { Comment, IPost } from '../../../types/post';
import { environment } from '../../../../environments/environment';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../../services/apiService/api.service';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PostModalComponent } from './postModal/postModal.component';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { IUser } from '../../../types/user';
import { ROLES } from '../../../helpers/consts';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-post',
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    MatIcon,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css',
})
export class PostComponent implements OnInit, OnChanges {
  path = environment.urlSupaBase + "/storage/v1/object/public/";
  data = input.required<IPost>();
  liked? = output();
  isLiked = signal<boolean>(false);
  likeCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  api = inject(ApiService);
  comments = signal<Comment[]>([]);
  newComment = signal<string>('');
  dialog = inject(MatDialog);
  user = signal<IUser | null>(null);
  ROLES = ROLES;
  editPost: any = output<string>();
  noMoreComments = signal<boolean>(false);
  showComments = input<boolean>(true);

  ngOnInit(): void {
    this.setLikes();
    this.user!.set(this.api.getUser());
  }

  ngOnChanges(): void {
    this.setLikes();
  }
  openModal() {
    const dialogRef = this.dialog.open(PostModalComponent, {
      width: '70vw',
      maxWidth: '70vw',
      height: '90vh',
      data: {
        post: this.data(),
        isLiked: this.isLiked(),
        likeCount: this.likeCount()
      },
    });

    dialogRef.afterClosed().subscribe((comments) => {
      if (comments) {
        this.comments.set(comments)
      }
    });
  }

  setLikes() {
    this.comments.set(this.data().comments || []);
    this.likeCount.set(this.data().likes?.length || 0);
    const user = this.api.getUser();
    const likedByUser = this.data().likes?.includes(user?._id || "");
    this.isLiked.set(likedByUser || false);
  }

  toggleLike() {
    this.isLoading.set(true);

    const currentlyLiked = this.isLiked();

    this.isLiked.set(!currentlyLiked);
    this.likeCount.update(count => currentlyLiked ? count - 1 : count + 1);

    const request$ = currentlyLiked
      ? this.api.unLikePost(this.data()._id!)
      : this.api.likePost(this.data()._id!);

    request$.subscribe({
      next: () => {
        this.liked!.emit();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLiked.set(currentlyLiked);
        this.likeCount.update(count => currentlyLiked ? count + 1 : count - 1);
        this.isLoading.set(false);
      }
    });
  }
  addComment() {
    const text = this.newComment().trim();
    if (!text) return;

    const user = this.api.getUser();
    if (!user) return;

    const comment: Comment = {
      userId: {
        username: user?.username!,
      },
      createdAt: new Date(),
      text: text,
    };

    this.comments()?.push(comment);
    this.sendcomments(comment);
    this.newComment.set('');
  }

  sendcomments(comments: Comment) {
    if (!comments) return;
    if (!this.data()._id) return;
    this.api.commentPost(this.data()._id!, comments).subscribe({
      next: (data) => {
        this.comments.set(data.comments);
        if(data.comments.lenght < 3){
          this.noMoreComments.set(true);
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  editEvent() {
    this.editPost.emit(this.data()._id);
  }
}

