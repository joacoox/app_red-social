import { Component, inject, input, OnChanges, OnInit, output, signal } from '@angular/core';
import { IPost } from '../../../types/post';
import { environment } from '../../../../environments/environment';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../services/apiService/api.service';

@Component({
  selector: 'app-post',
  imports: [DatePipe],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css',

})
export class PostComponent implements OnInit, OnChanges {
  path = environment.urlSupaBase + "/storage/v1/object/public/";
  data = input.required<IPost>();
  liked ?= output();
  isLiked = signal<boolean>(false);
  likeCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  api = inject(ApiService);

  ngOnInit(): void {
    this.setLikes();
  }

  ngOnChanges(): void {
    this.setLikes();
  }

  setLikes() {
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
}
