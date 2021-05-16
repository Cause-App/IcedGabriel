import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { GameComponent } from './pages/game/game.component';
import { UserDataService } from './services/user-data.service';

const routes: Routes = [
  {path: "game/:id", component: GameComponent, canActivate: [UserDataService]},
  { path: '', component: HomePageComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
