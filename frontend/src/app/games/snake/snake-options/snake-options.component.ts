import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { WarningsService } from 'src/app/services/warnings.service';
import { CodeFile, GameListService } from 'src/app/services/game-list.service';
import { UserDataService } from 'src/app/services/user-data.service';

export interface Snake {
  _id: string;
  name: string;
  code: CodeFile[];
  owner?: string;
  ownerName?: string;
  rank?: number;
}

const DEFAULT_SNAKE_NAME = "An unnamed snake";

@Component({
  selector: 'app-snake-options',
  templateUrl: './snake-options.component.html',
  styleUrls: ['./snake-options.component.scss']
})
export class SnakeOptionsComponent implements OnInit {

  constructor(private api: ApiService, private gameList: GameListService, private warnings: WarningsService, private user: UserDataService) {
  }

  snakes: Snake[] = [];
  snakesById: { [key: string]: Snake } = {};

  renamingSnake = false;

  snakeName: string = DEFAULT_SNAKE_NAME;
  snakeID: string | undefined | null;

  leaderboardSize: number = 0;

  ranking: boolean = false;
  rankStart: number = 0;
  rankEnd: number = 0;
  snakeCount: number = -1;
  rankQueue: number = -1;
  cancellable: boolean = true;
  rankResult = -1;

  @Input() getFiles: () => CodeFile[] = () => { return [] };
  @Input() onFilesLoaded: (files: CodeFile[]) => void = () => { };
  @Input() onIdChanged: (id: string | undefined | null) => void = () => { };
  @Input() onCodeChanged?: EventEmitter<void>;

  @Input() onChangesMade: (changesMade: boolean) => void = () => { };

  snakeUpdated(): void {
    if (this.snakeID && this.snakeID !== "undefined") {
      this.snakeName = this.snakesById[this.snakeID].name;
      this.onFilesLoaded(this.snakesById[this.snakeID].code);
    } else {
      this.snakeName = DEFAULT_SNAKE_NAME;
      this.onFilesLoaded(this.gameList.gameWithID("snake")?.defaultCode ?? []);
    }
    this.save();
    this.onIdChanged(this.snakeID);
  }

  private saveCooldown: number = 1000;
  private saveInterrupted: number = 0;
  private saving: boolean = false;

  save(): void {
    this.onChangesMade(true);
    if (this.saving) {
      this.saveInterrupted++;
    } else {
      this.saving = true;
      this.saveInterrupted = 0;
    }
    setTimeout(() => {
      if (this.saveInterrupted > 0) {
        this.saveInterrupted--;
      } else {
        this.realSave();
        this.saving = false;
      }
    }, this.saveCooldown);
  }

  async realSave(): Promise<void> {
    if (!this.snakeName || this.snakeID === null) {
      return;
    }

    const code = this.getFiles();
    const snakeID = this.snakeID;
    if (!this.snakeID || this.snakeID === "undefined") {
      this.snakeID = null;
    }
    let response: any;
    try {
      response = await this.api.post("snake/editsnake", { id: snakeID, name: this.snakeName, code });
    } catch {
      response = { err: "Could not connect to server" };
    }
    if (response.err) {
      this.warnings.setWarning("unsavedChanges", true);
      console.error(response.err);
      return;
    }
    this.onChangesMade(false);
    this.warnings.setWarning("unsavedChanges", false);
    this.warnings.setWarning("save", true);
    if (response.id) {
      const newSnake: Snake = {
        _id: response.id,
        name: this.snakeName,
        code,
        owner: this.user.sub,
        ownerName: this.user.name
      };
      this.snakes.push(newSnake);
      this.snakesById[response.id] = newSnake;
      this.snakeID = response.id;
      this.snakeUpdated();
    } else if (snakeID && snakeID !== "undefined" && this.snakesById[snakeID]) {
      this.snakesById[snakeID].name = this.snakeName;
      this.snakesById[snakeID].code = code;
    }
  }

  async ngOnInit(): Promise<void> {
    const snakes: any = await this.api.get("snake/mine", {});
    this.snakes = snakes;
    for (const snake of this.snakes) {
      this.snakesById[snake._id] = snake;
    }
    if (this.snakes.length) {
      this.snakeID = this.snakes[0]._id;
    } else {
      this.snakeID = undefined;
    }
    this.snakeUpdated();
    this.onIdChanged(this.snakeID);

    this.onCodeChanged?.subscribe(() => {
      this.save();
    });
  }

  async deleteSnake(): Promise<void> {
    if (!this.snakeID) {
      return;
    }
    const promptString = `Are you sure you want to delete this snake? You will be unable to play as this snake; others will be unable to play against this snake; its rank in the leaderboard will be lost. This action is irreversible. Please enter '${this.snakeName}' to confirm`;
    if (prompt(promptString) !== this.snakeName) {
      return;
    }
    let response: any;
    try {
      response = await this.api.get("snake/deletesnake", { id: this.snakeID });
    } catch {
      response = { err: "Could not connect to server" };
    }
    if (response.err) {
      console.error(response.err);
      this.warnings.setWarning("failedToDelete", true);
    } else {
      delete this.snakesById[this.snakeID];
      this.snakes = this.snakes.filter(x => x._id !== this.snakeID);
      this.snakeID = this.snakes.length ? this.snakes[0]._id : undefined;
      this.snakeUpdated();
    }
  }

  rankSnake() {
    this.ranking = true;
    this.rankStart = 0;
    this.rankEnd = 0;
    this.snakeCount = -1;
    this.rankQueue = -1;
    this.rankResult = -1;
    const snakeToRank = this.snakeID;
    this.cancellable = true;
    if (!snakeToRank) {
      return;
    }
    const currentRank = this.snakesById[snakeToRank].rank;
    const listener = this.api.websocket("snake/rank", { myId: snakeToRank }, async (response) => {
      if (response.err) {
        this.warnings.setWarning("failedToRank", true);
        this.ranking = false;
      }
      if (response.hasOwnProperty("queue")) {
        this.rankQueue = response.queue;
      }
      if (response.hasOwnProperty("start")) {
        this.rankStart = response.start;
        this.rankEnd = response.end;
        if (this.snakeCount < 0) {
          this.snakeCount = response.end + 1;
          if (currentRank !== undefined) {
            this.snakeCount++;
          }
        }
        if (currentRank !== undefined && currentRank < this.rankStart) {
          this.rankStart++;
        }

        if (currentRank !== undefined && currentRank <= this.rankEnd+1) {
          this.rankEnd++;
        }
      }
      if (response.cancel) {
        this.api.removeCallback(listener);
      }
      if (response.hasOwnProperty("rank")) {
        this.snakesById[snakeToRank].rank = response.rank;
        this.api.removeCallback(listener);
        this.rankStart = response.rank;
        this.rankEnd = response.rank;
        this.rankQueue = -1;
        this.cancellable = false;
        const leaderboard: any = await this.api.get("snake/leaderboard", {});
        this.leaderboardSize = leaderboard.length;
        let i;
        for (i=0; i<leaderboard.length; i++) {
          if (leaderboard[i].rank > response.rank) {
            break;
          }
        }
        this.rankResult = i;
        setTimeout(() => {
          this.ranking = false;
        }, 3000);
      }
    });
  }

  rankSliderStyle(): any {
    const l = this.rankStart/this.snakeCount;
    const r = (this.rankEnd+1)/this.snakeCount;
    const elim = "#003333";
    const active = "#ff0000";
    return {
      "background-image": `linear-gradient(to right, ${elim} 0%, ${elim} ${l * 100}%, ${active} ${l * 100}%, ${active} ${r * 100}%, ${elim} ${r * 100}%, ${elim} 100%)`
    }
  }

  cancelRank() {
    this.api.websocket("snake/cancelrank", {}, () => {});
    this.ranking = false;
  }

  suffix(x: number): string {
    switch (x % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }
 
}
