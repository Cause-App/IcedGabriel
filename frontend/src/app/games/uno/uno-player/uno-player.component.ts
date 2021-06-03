import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from 'src/app/services/api.service';
import { ConsoleService } from 'src/app/services/console.service';
import { WarningsService } from 'src/app/services/warnings.service';
import { UnoPlayer } from '../uno-options/uno-options.component';

type opponentSelectMethod = "mine" | "leaderboard" | "search";

@Component({
  selector: 'app-uno-player',
  templateUrl: './uno-player.component.html',
  styleUrls: ['./uno-player.component.scss']
})
export class UnoPlayerComponent implements OnInit {

  public myPlayers: UnoPlayer[] = [];
  public leaderboard: UnoPlayer[] = [];

  queue: number = -1;

  faTrophy = faTrophy;

  myId: string = "";
  opponentId: string = "";
  @Input() getPlayerId: () => string | undefined | null = () => undefined;
  @Input() playerIdChanged?: EventEmitter<void>;
  @Input() reloadOpponents?: EventEmitter<void>;

  public gameString: string = "";

  public osm: opponentSelectMethod = "mine";

  switchOSM(x: opponentSelectMethod) {
    this.osm = x;
    if (x === "mine") {
      this.opponentId = this.myPlayers[0]._id;
    } else if (x === "leaderboard") {
      this.opponentId = this.leaderboard[0]._id;
    } else if (x === "search") {
      this.opponentId = "";
    }
  }

  searchKeyword = 'name&dev';
  searched = "";
  allPlayers: any[] = [];

  selectEvent(item: any) {
    setTimeout(() => {
      this.opponentId = item._id;
      console.log(this.opponentId);
    }, 0);
  }

  searchTermChanged() {
    for (const s of this.allPlayers) {
      if (s["name&dev"] === this.searched) {
        this.selectEvent(s);
        return;
      }
    }
    this.opponentId = "";
  }

  async loadOpponents() {
    const response: any = await this.api.get("uno/mine", {});
    this.myPlayers = response;
    this.opponentId = this.myPlayers[0]._id;

    const lbResponse: any = await this.api.get("uno/leaderboard", {});
    this.leaderboard = lbResponse;

    const allResponse: any = await this.api.get("uno/getAllPlayers", {});
    this.allPlayers = allResponse;
    for (const player of this.allPlayers) {
      player["name&dev"] = `${player.name} by ${player.ownerName}`;
    }
  }

  constructor(private api: ApiService, private warnings: WarningsService, public consoleService: ConsoleService) { }

  async ngOnInit(): Promise<void> {

    await this.loadOpponents();
    this.reloadOpponents?.subscribe(this.loadOpponents.bind(this));

    this.myId = this.getPlayerId() ?? "";
    this.playerIdChanged?.subscribe(() => {
      this.myId = this.getPlayerId() ?? "";
    })
  }

  cancel() {
    this.api.websocket("uno/cancel", {}, () => { });
    this.queue = -1;
  }

  play() {
    if (!this.opponentId) {
      return;
    }
    this.gameString = "";
    this.api.websocket("uno/play", { myId: this.myId, opponentId: this.opponentId }, (response: any) => {
      if (response.err) {
        console.error(response.err);
        this.consoleService.log("Below are the errors thrown by the Java compiler. Note that some of the errors may be for your own code, and some may be for your opponent's code. Errors in files in the directory './unoplayer1' are for your own code, and those in './unoplayer2' are for your opponent's.\n\n");
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
