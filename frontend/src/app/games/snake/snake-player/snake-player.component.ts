import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from 'src/app/services/api.service';
import { ConsoleService } from 'src/app/services/console.service';
import { WarningsService } from 'src/app/services/warnings.service';
import { Snake } from '../snake-options/snake-options.component';

type opponentSelectMethod = "mine" | "leaderboard" | "search";

@Component({
  selector: 'app-snake-player',
  templateUrl: './snake-player.component.html',
  styleUrls: ['./snake-player.component.scss']
})
export class SnakePlayerComponent implements OnInit {

  public mySnakes: Snake[] = [];
  public leaderboard: Snake[] = [];

  queue: number = -1;

  faTrophy = faTrophy;

  myId: string = "";
  opponentId: string = "";
  @Input() getPlayerId: () => string | undefined | null = () => undefined;
  @Input() playerIdChanged?: EventEmitter<void>;

  public gameString: string = "";

  public osm: opponentSelectMethod = "mine";

  switchOSM(x: opponentSelectMethod) {
    this.osm = x;
    if (x === "mine") {
      this.opponentId = this.mySnakes[0]._id;
    } else if (x === "leaderboard") {
      this.opponentId = this.leaderboard[0]._id;
    } else if (x === "search") {
      this.opponentId = "";
    }
  }

  searchKeyword = 'name&dev';
  searched = "";
  allSnakes: any[] = [];

  selectEvent(item: any) {
    setTimeout(() => {
      this.opponentId = item._id;
      console.log(this.opponentId);
    }, 0);
  }

  searchTermChanged() {
    for (const s of this.allSnakes) {
      if (s["name&dev"] === this.searched) {
        this.selectEvent(s);
        return;
      }
    }
    this.opponentId = "";
  }

  constructor(private api: ApiService, private warnings: WarningsService, public consoleService: ConsoleService) { }

  async ngOnInit(): Promise<void> {
    const response: any = await this.api.get("snake/mine", {});
    this.mySnakes = response;
    this.opponentId = this.mySnakes[0]._id;

    const lbResponse: any = await this.api.get("snake/leaderboard", {});
    this.leaderboard = lbResponse;

    const allResponse: any = await this.api.get("snake/getAllSnakes", {});
    this.allSnakes = allResponse;
    for (const snake of this.allSnakes) {
      snake["name&dev"] = `${snake.name} by ${snake.ownerName}`;
    }

    this.myId = this.getPlayerId() ?? "";
    this.playerIdChanged?.subscribe(() => {
      this.myId = this.getPlayerId() ?? "";
    })
  }

  cancel() {
    this.api.websocket("snake/cancel", {}, () => { });
    this.queue = -1;
  }

  play() {
    if (!this.opponentId) {
      return;
    }
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
