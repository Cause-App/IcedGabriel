import { Component } from '@angular/core';
import { GamePlayerComponent } from '../../generic/game-player/game-player.component';
import { SnakeGridComponent } from './snake-grid/snake-grid.component';

@Component({
  templateUrl: '../../generic/game-player/game-player.component.html',
  styleUrls: ['../../generic/game-player/game-player.component.scss']
})
export class SnakePlayerComponent extends GamePlayerComponent {

  gameID = "snake";
  errorPreamble: string = "Below are the errors thrown by the Java compiler. Note that some of the errors may be for your own code, and some may be for your opponent's code. Errors in files in the directory './snake1' are for your own code, and those in './snake2' are for your opponent's.\n\n";
  gridComponent = SnakeGridComponent;

}