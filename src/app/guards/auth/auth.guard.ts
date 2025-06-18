import { CanActivateChildFn } from '@angular/router';
import { ApiService } from '../../services/apiService/api.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateChildFn = (childRoute, state) => {
  const authService = inject(ApiService);
  return authService.isLoggedIn();
};
