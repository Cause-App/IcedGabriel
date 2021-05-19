import { Component, Input, OnInit } from '@angular/core';
import { WarningsService } from 'src/app/services/warnings.service';

type gridContent = "empty" | "snake1" | "snake2" | "apple" | "collision";

@Component({
  selector: 'app-snake-grid',
  templateUrl: './snake-grid.component.html',
  styleUrls: ['./snake-grid.component.scss']
})
export class SnakeGridComponent implements OnInit {

  constructor(private warnings: WarningsService) {
    this.clearGrid();
  }

  @Input() width: number = 16;
  @Input() height: number = 16;

  private turnsPerSecond = 10;
  public playingGame: boolean = false;
  public cancelledGame: boolean = false;

  @Input() set gameString(game: string) {
    if (this.playingGame) {
      this.cancelledGame = true;
      setTimeout(() => {
        this.gameString = game;
      }, 100);
      return;
    }
    if (!game) {
      return;
    }
    try {
      this.playingGame = true;
      this.cancelledGame = false;
      const parts: number[] = game.split(",").map(x => +x);
      this.width = parts[0];
      this.height = parts[1];

      this.clearGrid();

      let s1x = parts[2];
      let s1y = parts[3];
      let s2x = parts[4];
      let s2y = parts[5];
      let ax = parts[6];
      let ay = parts[7];

      const s1Trail = [[s1x, s1y]];
      const s2Trail = [[s2x, s2y]];


      this.grid[s1y][s1x] = "snake1";
      this.grid[s2y][s2x] = "snake2";
      this.grid[ay][ax] = "apple";


      let index = 8;
      const handleMove = (cb: (winner: number) => void) => {
        try {
          if (this.cancelledGame) {
            this.playingGame = false;
            return;
          }
          const d1 = parts[index++];
          const d2 = parts[index++];

          if (d1 === -1 && d2 === -1) {
            console.log("Both snakes exploded");
            cb(0);
          } else if (d1 === -1) {
            console.log("You exploded");
            cb(2);
          } else if (d2 === -1) {
            console.log("Your opponent exploded");
            cb(1);
          } else {
            let ns1x = s1x + this.width;
            let ns1y = s1y + this.height;
            if (d1 === 0) {
              ns1y--;
            } else if (d1 === 1) {
              ns1x++;
            } else if (d1 === 2) {
              ns1y++;
            } else if (d1 === 3) {
              ns1x--;
            }

            let ns2x = s2x + this.width;
            let ns2y = s2y + this.height;
            if (d2 === 0) {
              ns2y--;
            } else if (d2 === 1) {
              ns2x++;
            } else if (d2 === 2) {
              ns2y++;
            } else if (d2 === 3) {
              ns2x--;
            }

            ns1x %= this.width;
            ns1y %= this.height;
            ns2x %= this.width;
            ns2y %= this.height;

            if (ns1x === ns2x && ns1y === ns2y) {
              console.log("You collided head-on");
              if (this.grid[ns1y][ns1x] !== "apple") {
                const [removed1] = s1Trail.splice(0, 1);
                this.grid[removed1[1]][removed1[0]] = "empty";
                const [removed2] = s2Trail.splice(0, 1);
                this.grid[removed2[1]][removed2[0]] = "empty";
                this.grid[ns1y][ns1x] = "collision";
              }
              cb(0);
            } else {
              let s1Died = false;
              let s2Died = false;
              const t1 = this.grid[ns1y][ns1x];
              const t2 = this.grid[ns2y][ns2x];
              if (t1 !== "apple") {
                const [removed] = s1Trail.splice(0, 1);
                this.grid[removed[1]][removed[0]] = "empty";
              }
              if (t2 !== "apple") {
                const [removed] = s2Trail.splice(0, 1);
                this.grid[removed[1]][removed[0]] = "empty";
              }

              if (t1 === "snake1" || t1 === "snake2") {
                s1Died = true;
              }

              if (t2 === "snake1" || t2 === "snake2") {
                s2Died = true;
              }

              s1Trail.push([ns1x, ns1y]);
              s2Trail.push([ns2x, ns2y]);
              this.grid[ns1y][ns1x] = "snake1";
              this.grid[ns2y][ns2x] = "snake2";
              s1x = ns1x;
              s1y = ns1y;
              s2x = ns2x;
              s2y = ns2y;

              ax = parts[index++];
              ay = parts[index++];

              if (ax >= 0 && ay >= 0) {
                this.grid[ay][ax] = "apple";
              }

              if (s1Died && !s2Died) {
                cb(2);
              } else if (!s1Died && s2Died) {
                cb(1);
              } else if (s1Died && s2Died) {
                cb(0);
              } else {
                setTimeout(() => {
                  handleMove(cb);
                }, 1000 / this.turnsPerSecond);
              }
            }
          }
        } catch (e) {
          console.error(e);
          this.warnings.setWarning("invalidGame", true);
        }
      }
      setTimeout(() => handleMove((winner: number) => {
        if (winner === 0) {
          console.log("You tied :/");
        } else if (winner === 1) {
          console.log("You win :)");
        } else {
          console.log("Opponent wins :(")
        }
        this.playingGame = false;
      }), 1000 / this.turnsPerSecond);
  
    } catch (e) {
      console.error(e);
      this.warnings.setWarning("invalidGame", true);
    }
  }

  public grid: gridContent[][] = [];

  get gridPos(): { [key: string]: number }[] {
    const result = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        result.push({ x, y });
      }
    }
    return result;
  }

  get gridStyle(): any {
    return {
      "grid-template-columns": "auto ".repeat(this.width),
      "grid-template-rows": "auto ".repeat(this.height)
    };
  }

  private clearGrid() {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      const row: gridContent[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push("empty");
      }
      this.grid.push(row);
    }
  }

  ngOnInit(): void {
  }

}
