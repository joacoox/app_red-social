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
import { SpinnerComponent } from "../../../../components/spinner/spinner.component";

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
    DatePipe,
    SpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostModalComponent {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<PostModalComponent>);
  comments = signal<Comment[]>([]);
  newComment = signal<string>('');
  path = environment.urlSupaBase + "/storage/v1/object/public/";
  activeUser = signal<IUser | null>(null);
  api = inject(ApiService);
  isLoading = signal<boolean>(false);
  noMoreComments = signal<boolean>(false);

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
    this.isLoading.set(true);
    if (!comments) return;
    if (!this.data.post._id) return;

    this.api.commentPost(this.data.post._id!, comments).subscribe({
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
    this.isLoading.set(false);
  }

  findAllComments() {
    this.isLoading.set(true);

    this.api.findAllComments(this.data.post._id!).subscribe({
      next: (data) => {
        console.log(data);
        this.comments.set(data.comments);
        if(data.comments.lenght < 3){
          this.noMoreComments.set(true);
        }
      },
      error: (error) => {
        console.log(error);
      }
    });

    this.isLoading.set(false);
  }

  handleClose(){
    this.dialogRef.close(this.comments());
  }
}