import { Component } from '@angular/core';
import { GameOptionsComponent } from '../../generic/game-options/game-options.component';


@Component({
  selector: 'app-ein-options',
  templateUrl: '../../generic/game-options/game-options.component.html',
  styleUrls: ['../../generic/game-options/game-options.component.scss']
})
export class EinOptionsComponent extends GameOptionsComponent {
  
  gameID = "ein";
  defaultPlayerName = "An unnamed Ein player";
  offlineString: string = "Or use the mouse to play against your own code?"

}
