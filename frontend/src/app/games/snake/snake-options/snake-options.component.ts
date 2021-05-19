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
}

const DEFAULT_SNAKE_NAME = "Un unnamed snake";

@Component({
  selector: 'app-snake-options',
  templateUrl: './snake-options.component.html',
  styleUrls: ['./snake-options.component.scss']
})
export class SnakeOptionsComponent implements OnInit {

  constructor(private api: ApiService, private gameList: GameListService, private warnings: WarningsService, private user: UserDataService) { }

  snakes: Snake[] = [];
  private snakesById: {[key: string]: Snake} = {};

  pickingOtherSnake = false;

  snakeName: string = DEFAULT_SNAKE_NAME;
  snakeID: string | undefined | null;

  @Input() getFiles: () => CodeFile[] = () => {return []};
  @Input() onFilesLoaded: (files: CodeFile[]) => void = () => {};
  @Input() onIdChanged: (id: string | undefined | null) => void = () => {};
  @Input() onCodeChanged?: EventEmitter<void>;

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
  
  async save(): Promise<void> {
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
      response = await this.api.post("snake/editsnake", {id: snakeID, name: this.snakeName, code});
    } catch {
      response = {err: "Could not connect to server"};
    }
    if (response.err) {
      this.warnings.setWarning("unsavedChanges", true);
      console.error(response.err);
      return;
    }
    this.warnings.setWarning("unsavedChanges", false);
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
      this.onIdChanged(this.snakeID);
    } else if (snakeID && snakeID !== "undefined" && this.snakesById[snakeID]) {
      this.snakesById[snakeID].name = this.snakeName;
      this.snakesById[snakeID].code = code;
    }
  }

  async ngOnInit(): Promise<void> {
    const snakes: any = await this.api.get("snake/getsnakes", {});
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

}
