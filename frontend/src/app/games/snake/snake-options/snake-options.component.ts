import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { CodeFile, GameListService } from 'src/app/services/game-list.service';

export interface Snake {
  _id: string;
  name: string;
  code: CodeFile[];
}

@Component({
  selector: 'app-snake-options',
  templateUrl: './snake-options.component.html',
  styleUrls: ['./snake-options.component.scss']
})
export class SnakeOptionsComponent implements OnInit {

  constructor(private api: ApiService, private gameList: GameListService) { }

  snakes: Snake[] = [];
  private snakesById: {[key: string]: Snake} = {};

  snakeName: string = "";
  snakeID: string | undefined;

  @Input() getFiles: () => CodeFile[] = () => {return []};
  @Input() onFilesLoaded: (files: CodeFile[]) => void = () => {};

  snakeUpdated(): void {
    if (this.snakeID && this.snakeID !== "undefined") {
      this.snakeName = this.snakesById[this.snakeID].name;
      this.onFilesLoaded(this.snakesById[this.snakeID].code);
    } else {
      this.snakeName = "";
      this.onFilesLoaded(this.gameList.gameWithID("snake")?.defaultCode ?? []);
    }
  }
  
  async save(): Promise<void> {
    const code = this.getFiles();
    console.log(code);
    const response: any = await this.api.post("snake/editsnake", {id: this.snakeID, name: this.snakeName, code});
    if (response.err) {
      console.error(response.err);
      return;
    }
    if (response.id) {
      const newSnake: Snake = {
        _id: response.id,
        name: this.snakeName,
        code
      };
      this.snakes.push(newSnake);
      this.snakeID = response.id;
    } else if (this.snakeID && this.snakesById[this.snakeID]) {
      this.snakesById[this.snakeID].name = this.snakeName;
      this.snakesById[this.snakeID].code = code;
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

  }

}
