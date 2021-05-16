import { Component, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Game, GameListService } from 'src/app/services/game-list.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  public game?: Game;
  public resizeEmitter: EventEmitter<void> = new EventEmitter<void>();
  constructor(private route: ActivatedRoute, public gameList: GameListService, private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const gameID = params['id'];
      this.game = this.gameList.gameWithID(gameID);
      if (!this.game) {
        this.router.navigate(["/"]);
      } else {
        
      }
    });
  }




  resized(): void {
    this.resizeEmitter.emit();
  }

}
