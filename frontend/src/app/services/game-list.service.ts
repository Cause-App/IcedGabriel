import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SnakeOptionsComponent } from '../games/snake/snake-options/snake-options.component';
import { SnakePlayerComponent } from '../games/snake/snake-player/snake-player.component';

export interface CodeFile {
  filename: string;
  code: string;
  protected?: boolean;
}

export interface Game {
  name: string;
  id: string;
  available: boolean;
  defaultCode?: CodeFile[];
  optionsComponent?: any;
  playerComponent?: any;
};

@Injectable({
  providedIn: 'root'
})
export class GameListService {

  private gamesByID: { [key: string]: Game } = {};

  games: Game[] = [
    {
      name: "Snake", id: "snake", available: true, optionsComponent: SnakeOptionsComponent, playerComponent: SnakePlayerComponent, defaultCode: [
        {
          filename: "Snake.java",
          protected: true,
          code:
            `import logic.Slitherable;
import logic.Slitherable.Direction;

public class Snake implements Slitherable {
  
    public Direction move(int myHeadX, int myHeadY, int enemyHeadX, int enemyHeadY, int appleX, int appleY) {
        return Direction.LEFT;
    }
  
}`
        }
      ]
    },
    { name: "Uno", id: "uno", available: false },
    { name: "Monopoly", id: "monopoly", available: false },
  ]

  constructor(private router: Router) {
    for (const game of this.games) {
      this.gamesByID[game.id] = game;
    }
  }


  goTo(game: Game): void {
    if (!game.available) {
      return;
    }
    this.router.navigate(["game", game.id]);
  }

  gameWithID(id: string): Game | undefined {
    return this.gamesByID[id];
  }


}
