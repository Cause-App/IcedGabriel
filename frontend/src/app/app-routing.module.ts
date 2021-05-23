import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { GameComponent } from './pages/game/game.component';
import { UserDataService } from './services/user-data.service';
import { ChangesMadeGuard } from './guards/changes-made.guard';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';

const routes: Routes = [
  {path: "game/:id", component: GameComponent, canActivate: [UserDataService], canDeactivate: [ChangesMadeGuard]},
  {path: "leaderboard/:id", component: LeaderboardComponent},
  { path: '', component: HomePageComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
