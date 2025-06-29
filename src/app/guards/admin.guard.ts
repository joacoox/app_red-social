import { CanActivateFn } from '@angular/router';
import { ApiService } from '../services/apiService/api.service';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(ApiService);
  const user = authService.getUser();

  if (!user || user.role !== 'admin') {
    return false;
  }
  return true;
};
