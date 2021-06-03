import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { WarningsService } from 'src/app/services/warnings.service';
import { CodeFile, GameListService } from 'src/app/services/game-list.service';
import { UserDataService } from 'src/app/services/user-data.service';

export interface UnoPlayer {
  _id: string;
  name: string;
  code: CodeFile[];
  owner?: string;
  ownerName?: string;
  rank?: number;
}

const DEFAULT_PLAYER_NAME = "An unnamed Uno player";

@Component({
  selector: 'app-uno-options',
  templateUrl: './uno-options.component.html',
  styleUrls: ['./uno-options.component.scss']
})
export class UnoOptionsComponent implements OnInit {

  constructor(private api: ApiService, private gameList: GameListService, private warnings: WarningsService, private user: UserDataService) {
  }

  players: UnoPlayer[] = [];
  playersById: { [key: string]: UnoPlayer } = {};

  renamingPlayer = false;

  playerName: string = DEFAULT_PLAYER_NAME;
  playerID: string | undefined | null;

  leaderboardSize: number = 0;

  ranking: boolean = false;
  rankStart: number = 0;
  rankEnd: number = 0;
  playerCount: number = -1;
  rankQueue: number = -1;
  cancellable: boolean = true;
  rankResult = -1;

  @Input() getFiles: () => CodeFile[] = () => { return [] };
  @Input() onFilesLoaded: (files: CodeFile[]) => void = () => { };
  @Input() onIdChanged: (id: string | undefined | null) => void = () => { };
  @Input() onCodeChanged?: EventEmitter<void>;

  @Input() onChangesMade: (changesMade: boolean) => void = () => { };

  playerUpdated(): void {
    if (this.playerID && this.playerID !== "undefined") {
      this.playerName = this.playersById[this.playerID].name;
      this.onFilesLoaded(this.playersById[this.playerID].code);
    } else {
      this.playerName = DEFAULT_PLAYER_NAME;
      this.onFilesLoaded(this.gameList.gameWithID("uno")?.defaultCode ?? []);
    }
    this.save();
    this.onIdChanged(this.playerID);
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
    if (!this.playerName || this.playerID === null) {
      return;
    }

    const code = this.getFiles();
    const playerID = this.playerID;
    if (!this.playerID || this.playerID === "undefined") {
      this.playerID = null;
    }
    let response: any;
    try {
      response = await this.api.post("uno/editplayer", { id: playerID, name: this.playerName, code });
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
      const newPlayer: UnoPlayer = {
        _id: response.id,
        name: this.playerName,
        code,
        owner: this.user.sub,
        ownerName: this.user.name
      };
      this.players.push(newPlayer);
      this.playersById[response.id] = newPlayer;
      this.playerID = response.id;
      this.playerUpdated();
    } else if (playerID && playerID !== "undefined" && this.playersById[playerID]) {
      this.playersById[playerID].name = this.playerName;
      this.playersById[playerID].code = code;
    }
  }

  async ngOnInit(): Promise<void> {
    const players: any = await this.api.get("uno/mine", {});
    this.players = players;
    for (const player of this.players) {
      this.playersById[player._id] = player;
    }
    if (this.players.length) {
      this.playerID = this.players[0]._id;
    } else {
      this.playerID = undefined;
    }
    this.playerUpdated();
    this.onIdChanged(this.playerID);

    this.onCodeChanged?.subscribe(() => {
      this.save();
    });
  }

  async deletePlayer(): Promise<void> {
    if (!this.playerID) {
      return;
    }
    const promptString = `Are you sure you want to delete this player? You will be unable to play as this player; others will be unable to play against this player; its rank in the leaderboard will be lost. This action is irreversible. Please enter '${this.playerName}' to confirm`;
    if (prompt(promptString) !== this.playerName) {
      return;
    }
    let response: any;
    try {
      response = await this.api.get("uno/deleteplayer", { id: this.playerID });
    } catch {
      response = { err: "Could not connect to server" };
    }
    if (response.err) {
      console.error(response.err);
      this.warnings.setWarning("failedToDelete", true);
    } else {
      delete this.playersById[this.playerID];
      this.players = this.players.filter(x => x._id !== this.playerID);
      this.playerID = this.players.length ? this.players[0]._id : undefined;
      this.playerUpdated();
    }
  }

  rankPlayer() {
    this.ranking = true;
    this.rankStart = 0;
    this.rankEnd = 0;
    this.playerCount = -1;
    this.rankQueue = -1;
    this.rankResult = -1;
    const playerToRank = this.playerID;
    this.cancellable = true;
    if (!playerToRank) {
      return;
    }
    const currentRank = this.playersById[playerToRank].rank;
    const listener = this.api.websocket("player/rank", { myId: playerToRank }, async (response) => {
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
        if (this.playerCount < 0) {
          this.playerCount = response.end + 1;
          if (currentRank !== undefined) {
            this.playerCount++;
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
        this.playersById[playerToRank].rank = response.rank;
        this.api.removeCallback(listener);
        this.rankStart = response.rank;
        this.rankEnd = response.rank;
        this.rankQueue = -1;
        this.cancellable = false;
        const leaderboard: any = await this.api.get("player/leaderboard", {});
        this.leaderboardSize = leaderboard.length;
        let i;
        for (i=0; i<leaderboard.length; i++) {
          if (leaderboard[i].rank > response.rank) {
            break;
          }
        }
        this.rankResult = i;
        this.onChangesMade(false);
        setTimeout(() => {
          this.ranking = false;
        }, 3000);
      }
    });
  }

  rankSliderStyle(): any {
    const l = this.rankStart/this.playerCount;
    const r = (this.rankEnd+1)/this.playerCount;
    const elim = "#003333";
    const active = "#ff0000";
    return {
      "background-image": `linear-gradient(to right, ${elim} 0%, ${elim} ${l * 100}%, ${active} ${l * 100}%, ${active} ${r * 100}%, ${elim} ${r * 100}%, ${elim} 100%)`
    }
  }

  cancelRank() {
    this.api.websocket("player/cancelrank", {}, () => {});
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
