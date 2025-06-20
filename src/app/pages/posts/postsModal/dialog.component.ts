import { Component, ChangeDetectionStrategy, signal, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { SpinnerComponent } from "../../../components/spinner/spinner.component";
import { ApiService } from "../../../services/apiService/api.service";
import { IPost } from "../../../types/post";

@Component({
  selector: 'dialog-content-example-dialog',
  templateUrl: 'dialog-post.html',
  imports: [MatDialogModule, MatButtonModule, FormsModule, ReactiveFormsModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dialog-post.css'
})
export class NewPostModalComponent {
  isLoading = signal<boolean>(false);
  formulario: FormGroup;
  image?: File;
  api = inject(ApiService);
  flagError = signal<boolean>(false);
  msjError: string = "";
  minLength = 5;
  dialog = inject(MatDialogRef<NewPostModalComponent>);

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
