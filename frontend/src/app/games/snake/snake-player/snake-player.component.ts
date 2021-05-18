import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Snake } from '../snake-options/snake-options.component';

@Component({
  selector: 'app-snake-player',
  templateUrl: './snake-player.component.html',
  styleUrls: ['./snake-player.component.scss']
})
export class SnakePlayerComponent implements OnInit {

  public snakes: Snake[] = [];

  myId: string = "";
  opponentId: string = "";
  @Input() getPlayerId: () => string | undefined | null = () => undefined;
  @Input() playerIdChanged?: EventEmitter<void>;

  public gameString: string = "";

  constructor(private api: ApiService) { }

  async ngOnInit(): Promise<void> {
    const response: any = await this.api.get("snake/getAllSnakes", {});
    this.snakes = response;
    this.opponentId = this.snakes[0]._id;

    this.myId = this.getPlayerId() ?? "";
    this.playerIdChanged?.subscribe(() => {
      this.myId = this.getPlayerId() ?? "";
    })
  }

  async play() {
    const response: any = await this.api.get("snake/play", { myId: this.myId, opponentId: this.opponentId });
    if (response.err) {
      console.error(response.err);
    } else {
      this.gameString = response.stdout;
    }
  }

}
