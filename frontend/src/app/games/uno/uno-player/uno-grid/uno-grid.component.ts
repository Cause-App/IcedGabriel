import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { WarningsService } from 'src/app/services/warnings.service';
import { ConsoleService } from 'src/app/services/console.service';

@Component({
  selector: 'app-uno-grid',
  templateUrl: './uno-grid.component.html',
  styleUrls: ['./uno-grid.component.scss']
})
export class UnoGridComponent implements OnInit {

  winner: string = "";
  details: string = "";

  public turnsPerSecond: number = 1;

  constructor(private warnings: WarningsService, private consoleService: ConsoleService) {
  }

  @Input() set gameString(game: string) {
    this.consoleService.log(game);
  }

  ngOnInit(): void {
  }

}
