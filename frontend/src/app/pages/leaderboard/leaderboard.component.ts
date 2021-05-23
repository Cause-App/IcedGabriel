import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { Game, GameListService } from 'src/app/services/game-list.service';
import { UserDataService } from 'src/app/services/user-data.service';

export interface LeaderboardEntry {
  _id: string;
  index: number;
  owner: string;
  ownerName: string;
  name: string;
  rank: number;
}

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {

  public game?: Game;
  public leaderboard: LeaderboardEntry[] = [];

  public myID: string = "";

  constructor(private route: ActivatedRoute, public gameList: GameListService, private router: Router, private api: ApiService, private user: UserDataService) { }

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async params => {
      const gameID = params['id'];
      this.game = this.gameList.gameWithID(gameID);
      if (!this.game) {
        this.router.navigate(["/"]);
      }
      this.leaderboard = await this.api.get(`${this.game?.id}/leaderboard`, {}) as any;
      for (let i = 0; i < this.leaderboard.length; i++) {
        this.leaderboard[i].index = i;
      }

      if (this.user.loggedIn) {
        this.myID = this.user.sub || "";
        const myPlayers = await this.api.get(`${this.game?.id}/mine`, { leaderboard: true }) as any;
        const ids = this.leaderboard.map((x) => x._id);
        for (const player of myPlayers) {
          if (ids.includes(player._id)) {
            continue;
          }
          const newObj = { ...player, index: -1 };
          const rank = player.rank;
          let added = false;
          for (let i = 0; i < this.leaderboard.length; i++) {
            if (this.leaderboard[i].rank >= rank) {
              this.leaderboard.splice(i, 0, newObj);
              added = true;
              break;
            }
          }
          if (!added) {
            this.leaderboard.push(newObj);
          }
        }
      }
    });

  }


}
