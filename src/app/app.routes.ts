import { Routes } from '@angular/router';
import { LayoutComponent } from './pages/layout/layout.component';
import { authGuard } from './guards/auth/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    {
        path: 'home',
        component: LayoutComponent,
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            {
                path: "my-profile",
                loadComponent: () => import("./pages/my-profile/my-profile.component").then((c) => c.MyProfileComponent),
            },
            {
                path: "posts",
                loadComponent: () => import("./pages/posts/posts.component").then((c) => c.PostsComponent),
            },
            {
                path : "dashboard/usuarios",
                loadComponent: () => import("./pages/dashboard/usuarios/usuarios.component").then((c) => c.UsuariosComponent),
                canActivate : [adminGuard]
            },
            {
                path : "dashboard/estadisticas",
                loadComponent: () => import("./pages/dashboard/estadisticas/estadisticas.component").then((c) => c.EstadisticasComponent),
                canActivate : [adminGuard]
            },
        ]
    },
    {
        path: "login",
        loadComponent: () => import("./pages/auth/login/login.component").then((c) => c.LoginComponent),
    },
    {
        path: "register",
        loadComponent: () => import("./pages/auth/register/register.component").then((c) => c.RegisterComponent),
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];
