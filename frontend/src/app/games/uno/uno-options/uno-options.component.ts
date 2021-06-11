import { Component } from '@angular/core';
import { GameOptionsComponent } from '../../generic/game-options/game-options.component';


@Component({
  selector: 'app-uno-options',
  templateUrl: '../../generic/game-options/game-options.component.html',
  styleUrls: ['../../generic/game-options/game-options.component.scss']
})
export class UnoOptionsComponent extends GameOptionsComponent {
  
  gameID = "ein";
  defaultPlayerName = "An unnamed Ein player";
 
}
