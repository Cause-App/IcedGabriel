import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ConsoleService } from 'src/app/services/console.service';
import { WarningsService } from 'src/app/services/warnings.service';
import { Snake } from '../snake-options/snake-options.component';

@Component({
  selector: 'app-snake-player',
  templateUrl: './snake-player.component.html',
  styleUrls: ['./snake-player.component.scss']
})
export class SnakePlayerComponent implements OnInit {

  public snakes: Snake[] = [];

  queue: number = -1;

  myId: string = "";
  opponentId: string = "";
  @Input() getPlayerId: () => string | undefined | null = () => undefined;
  @Input() playerIdChanged?: EventEmitter<void>;

  public gameString: string = "";

  constructor(private api: ApiService, private warnings: WarningsService, public consoleService: ConsoleService) { }

  async ngOnInit(): Promise<void> {
    const response: any = await this.api.get("snake/getAllSnakes", {});
    this.snakes = response;
    this.opponentId = this.snakes[0]._id;

    this.myId = this.getPlayerId() ?? "";
    this.playerIdChanged?.subscribe(() => {
      this.myId = this.getPlayerId() ?? "";
    })
  }

  cancel() {
    this.api.websocket("snake/cancel", { }, () => {});
    this.queue = -1;
  }

  play() {
    this.gameString = "";
    this.api.websocket("snake/play", { myId: this.myId, opponentId: this.opponentId }, (response: any) => {
      if (response.err) {
        console.error(response.err);
        this.consoleService.log("Below are the errors thrown by the Java compiler. Note that some of the errors may be for your own code, and some may be for your opponent's code. Errors in files in the directory './snake1' are for your own code, and those in './snake2' are for your opponent's.\n\n");
        if (response.err.stdout) {
          this.consoleService.log(response.err.stdout);
        }
        if (response.err.stderr) {
          this.consoleService.log(response.err.stderr);
        }
        this.queue = -1;
        this.warnings.setWarning("failedToCompile", true);
      } else if (response.hasOwnProperty("queue")) {
        this.queue = response.queue;
      } else if (response.stdout) {
        this.queue = -1;
        this.gameString = response.stdout;
      } else {
        this.queue = -1;
        this.warnings.setWarning("invalidGame", true);
      }
    });
  }
}
