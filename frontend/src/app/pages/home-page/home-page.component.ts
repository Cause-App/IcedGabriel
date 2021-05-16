import { Component } from '@angular/core';
import { UserDataService } from 'src/app/services/user-data.service';
import { GameListService } from 'src/app/services/game-list.service';


@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  constructor(public user: UserDataService, public gameList: GameListService) { }

}
