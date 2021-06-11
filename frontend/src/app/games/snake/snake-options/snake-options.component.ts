import { Component } from '@angular/core';
import { GameOptionsComponent } from '../../generic/game-options/game-options.component';


@Component({
  templateUrl: '../../generic/game-options/game-options.component.html',
  styleUrls: ['../../generic/game-options/game-options.component.scss']
})
export class SnakeOptionsComponent extends GameOptionsComponent {

  gameID = "snake";
  defaultPlayerName = "An unnamed snake";
  myPlayersString: string = "My Snakes"
  newPlayerString: string = "New Snake"
  deletePlayerString: string = "Delete This Snake"
  renamePlayerString: string = "Rename Snake"
  deletePrompt: (code: string) => string = (code: string) => `Are you sure you want to delete this snake? You will be unable to play as this player; others will be unable to play against this snake; its rank in the leaderboard will be lost. This action is irreversible. Please enter '${code}' to confirm`;

 
}
