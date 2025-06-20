import { CommonModule, DatePipe } from "@angular/common";
import { Component, ChangeDetectionStrategy, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { environment } from "../../../../../environments/environment";
import { ApiService } from "../../../../services/apiService/api.service";
import { IUser } from "../../../../types/user";
import { Comment } from "../../../../types/post";

@Component({
  selector: 'app-post-modal',
  templateUrl: 'postModal.component.html',
  styleUrls: ['postModal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    DatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostModalComponent {
  data = inject(MAT_DIALOG_DATA);
  comments = signal<Comment[]>([]);
  dialogRef = inject(MatDialogRef<PostModalComponent>);
  newComment = signal<string>('');
  path = environment.urlSupaBase + "/storage/v1/object/public/";
  activeUser = signal<IUser | null>(null);
  api = inject(ApiService);

  ngOnInit() {
    this.activeUser.set(this.api.getUser());
    this.comments.set([...this.data.post.comments]);
  }

  addComment() {
    const text = this.newComment().trim();
    if (!text) return;

    //const user = this.api.getUser();
    if (!this.activeUser) return;

    const comment: Comment = {
      userId: {
        username: this.activeUser()?.username!,
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
    if (!this.data.post._id) return;

    this.api.commentPost(this.data.post._id!, comments).subscribe({
      next: (data) => {
        this.comments.set(data.comments);
      },
      error: (error) => {
        console.log(error);
      }
    });

  }
}