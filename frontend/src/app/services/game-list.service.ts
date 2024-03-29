import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SnakeOptionsComponent } from '../games/snake/snake-options/snake-options.component';
import { SnakePlayerComponent } from '../games/snake/snake-player/snake-player.component';
import { EinOptionsComponent } from '../games/ein/ein-options/ein-options.component';
import { EinPlayerComponent } from '../games/ein/ein-player/ein-player.component';

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
  package1?: string;
  package2?: string;
  playerSingular?: string;
  playerPlural?: string;
  offlineControls?: string;
  params?: string;
};

@Injectable({
  providedIn: 'root'
})
export class GameListService {

  private gamesByID: { [key: string]: Game } = {};

  games: Game[] = [
    {
      name: "Snake", id: "snake", available: true, optionsComponent: SnakeOptionsComponent, playerComponent: SnakePlayerComponent, package1: "snake1", package2: "snake2", playerSingular: "snake", playerPlural: "snakes", defaultCode: [
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
      ], offlineControls: "use the arrow keys or WASD to control the other snake",
      params: "You must provide 6 parameters. The first two are the grid width and height respectively. You should set these both to 16. The next is the number of milliseconds which each snake is allowed to take in order to make its decision. A good value for this is 200. The next is the maximum number of rounds a game can have before the longest snake wins by default. This should be set to 1000. The fifth parameter is the number of turns per second the game should play at. You can modify this number to help you debug your snake, but a good default is 10. The final number is the number of games to be played. Set this to something big, like 1000."
    },
    {
      name: "Ein", id: "ein", available: false, optionsComponent: EinOptionsComponent, playerComponent: EinPlayerComponent, package1: "einplayer1", package2: "einplayer2", playerSingular: "player", playerPlural: "players", defaultCode: [
        {
          filename: "EinPlayer.java",
          protected: true,
          code: `import logic.EinPlayerInterface;
import logic.Card;

public class EinPlayer implements EinPlayerInterface {

    @Override
    public Card playCard(Card facingCard, Card[] hand, int opponentHandSize) {
        /*
            Welcome to Ein!

            It's a lot like Uno except we won't get sued!

            Your goal is to get rid of all of your cards before your opponent does.
            
            Rules:
            ------
            You and your opponent start with 7 cards each. There is also a "facing
            card" which is the last card to have been played.
            Players take it in turns to play cards from their own hand, with a
            random player going first.

            Cards have 5 suits: red, blue, green, yellow, and wild.
            Cards also have values. For non-wild cards, these values are 0-9, Skip,
            Reverse, and +2.

            Wild cards can have a value of Color-Changer, or +4.

            A non-wild card can be played if either its suit or its value matches
            that of the facing card. It then becomes the other player's turn.

            If either a Skip or Reverse card is played, then the other player misses
            their next turn. (Since this is 2-player, Skip and Reverse act
            identically)

            If a +2 card is played, the next player is forced to draw 2 cards from the
            deck, unless that player also has a +2 in their hand, in which case they
            can play this card, and the first player will have to draw 4 cards from the
            deck, unless they have another +2 card and so on. After the cards are drawn,
            it becomes the turn of the player who did not have to draw cards.

            Wild cards can be played regardless of the suit/value of the facing card.
            (But they can't be used to avoid the effects of +2 cards).

            If a Color-Changer is played, you are then free to put down another card.
            This can be any card in your hand regardless of suit/value. (This is
            different from traditional Uno in which you would simply declare a colour
            and then it would become the next player's turn).

            If a +4 is played, then the next player is forced to draw 4 cards from the
            deck, unless that player also has a +4 in their hand. This is similar to
            the rules for +2 cards above, with the penalty increasing by 4 cards for
            each +4 played. After the cards are drawn, the player who did not draw
            cards is free to play another card. This can be any card in their hand
            regardless of suit/value.

            If and only if when it comes to your turn, you have no playable cards,
            then you must draw one from the deck. If this new card is playable,
            you must play it. Otherwise, the turn goes to the next player.

            The winner is the first player to run out of cards.

            If the deck becomes empty, then all of the cards which have bee played
            (excluding the facing card) are shuffled. This becomes the new deck.

            If after this the deck is still empty, then the players tie.

            Implementation:
            ---------------
            Enums Card.Suit and Card.Value exist as follows:

            enum Suit {
                RED, GREEN, YELLOW, BLUE, WILD
            }

            enum Value {
                ZERO, ONE, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, SKIP, REVERSE, DRAW2, DRAW4, CHANGECOLOR
            }

            The Card class is immutable and its contructor looks like this:
            
            public Card(Value value, Suit suit)

            Its equals method has been overridden to compare by suit and value

            When it is a player's turn to play a card, its playCard() method will be
            called. This method should return an instance of Card.

            If this card is not part of the player's hand, or is not playable
            in this game according to the rules above, then this player loses.

            The method logic.Program.isCardValid(Card c) is exposed in order to help
            you test whether a card is playable at this point in the game.

            If cards are required to be drawn from the deck (either because a +2 or
            +4 card has been played against you, or you have no playable cards) then
            this will be done automatically between turns.

            Your class attributes will persist from round to round, so feel free to
            store data from one round to the next.

            Good Luck!
        */

        throw new RuntimeException("I forgot how to Ein :(");
    }

}`
        }
      ], offlineControls: "use the mouse to select which card to play",
      params: "You must provide 3 parameters. The first is the number of milliseconds each player can take to make its decision. If one of your players is using the mouse to make a selection, set this to be something very big like 200000000. The next parameter is the animation speed. You can mess around with this parameter to help with debugging your code, but a good default value is 3. The next parameter is the number of games to be played. Set this to something big like 100."
    },
    { name: "Game of Life (Murder Edition)", id: "gameoflife", available: false },
  ]

  constructor() {
    for (const game of this.games) {
      this.gamesByID[game.id] = game;
    }
  }


  goTo(game: Game): void {
    if (!game.available) {
      return;
    }
    window.location.href = "/game/" + game.id;
  }

  gameWithID(id: string): Game | undefined {
    return this.gamesByID[id];
  }


}
