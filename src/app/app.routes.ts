import { Routes } from '@angular/router';
import { LayoutComponent } from './pages/layout/layout.component';

export const routes: Routes = [
    {
        path: 'home',
        component: LayoutComponent,
    },
    {
        path: "login",
        loadComponent: () => import("./pages/auth/login/login.component").then((c) => c.LoginComponent),
        //canActivateChild: [userActiveGuard]
    },
    {
        path: "register",
        loadComponent: () => import("./pages/auth/register/register.component").then((c) => c.RegisterComponent),
    },
    { path: '', redirectTo: 'register', pathMatch: 'full' },
    { path: '**', redirectTo: 'register' }
];
