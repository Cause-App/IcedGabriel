import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SnakeOptionsComponent } from '../games/snake/snake-options/snake-options.component';
import { SnakePlayerComponent } from '../games/snake/snake-player/snake-player.component';
import { UnoOptionsComponent } from '../games/uno/uno-options/uno-options.component';
import { UnoPlayerComponent } from '../games/uno/uno-player/uno-player.component';

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
import logic.Direction;

public class Snake implements Slitherable {
        
    public Direction move(int myHeadX, int myHeadY, int enemyHeadX, int enemyHeadY, int appleX, int appleY) {
        
        /*
            Welcome to CodeSnake!

            You are the red snake. Your opponent is the blue snake. The apple is green.
            If you collide with the other snake, or your own tail, you lose.
            The goal is to avoid losing while trying to make your opponent lose (obviously).

            Each round, each player's "move" function is called. It should return either:
                Direction.UP, Direction.RIGHT, Direction.DOWN, or Direction.LEFT
            to indicate which way the snake's head should move.

            If you go past the edge, you wrap back around to the opposite edge.

            If you hit the apple, your tail will get longer by one cell.

            Your class attributes will persist from round to round, so feel free to
            store data from one round to the next.

            There are limitations on how much memory you're allowed to use, and on how
            much time the "move" method takes to execute.

            If the game goes on for too long, the longest snake wins.

            Good luck!
        */

        throw new RuntimeException("I do not know how to snake. Please help me."); 

    }
  
}`
        }
      ]
    },
    { name: "Uno", id: "uno", available: true, optionsComponent: UnoOptionsComponent, playerComponent: UnoPlayerComponent, defaultCode: [
      {
        filename: "UnoPlayer.java",
        protected: true,
        code: `import logic.UnoPlayerInterface;
import logic.Card;

public class UnoPlayer implements UnoPlayerInterface {

    @Override
    public Card playCard(Card lastPlayedCard, Card[] hand) {
        /*
            Welcome to Uno!
        */

        throw new RuntimeException("I forgot how to Uno :(");
    }

}`
      }
    ] },
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
    window.location.href = "/game/"+game.id;
  }

  gameWithID(id: string): Game | undefined {
    return this.gamesByID[id];
  }


}
