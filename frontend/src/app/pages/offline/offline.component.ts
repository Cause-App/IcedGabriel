import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Game, GameListService } from 'src/app/services/game-list.service';

@Component({
  selector: 'app-offline',
  templateUrl: './offline.component.html',
  styleUrls: ['./offline.component.scss']
})
export class OfflineComponent implements OnInit {

  public game?: Game;

  constructor(private route: ActivatedRoute, public gameList: GameListService, private router: Router) {

  }

  ngOnInit(): void {
    this.route.params.subscribe(async params => {
      const gameID = params['id'];
      this.game = this.gameList.gameWithID(gameID);
      if (!this.game || !this.game.available) {
        this.router.navigate(["/"]);
      }
    });
  }

}
