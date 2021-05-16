import { Component, Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface Game {
  name: string;
  id: string;
  available: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class GameListService {

  private gamesByID: {[key: string]: Game} = {};

  games: Game[] = [
    {name: "Snake", id: "snake", available: true},
    {name: "Uno", id: "uno", available: false},
    {name: "Monopoly", id: "monopoly", available: false},
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
