import { Component, OnInit } from '@angular/core';

type gridContent = "empty" | "snake1" | "snake2" | "apple" | "collision";

@Component({
  selector: 'app-snake-preview',
  templateUrl: './snake-preview.component.html',
  styleUrls: ['./snake-preview.component.scss']
})
export class SnakePreviewComponent implements OnInit {

  constructor() { }

  width: number = 32;
  height: number = 32;
  turnsPerSecond: number = 10;
  gameResetDelay: number = 200;

  s1Trail: number[][] = [];
  s2Trail: number[][] = [];

  ax: number = 0;
  ay: number = 0;

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

  calcS1Move(myHeadX: number, myHeadY: number, enemyHeadX: number, enemyHeadY: number, appleX: number, appleY: number): number {
    if (myHeadX > appleX) {
      return 3;
    }
    if (myHeadX < appleX) {
      return 1;
    }
    if (myHeadY > appleY) {
      return 0;
    }
    return 2;
  }

  calcS2Move(myHeadX: number, myHeadY: number, enemyHeadX: number, enemyHeadY: number, appleX: number, appleY: number): number {
    let dx = myHeadX-appleX;
    let dy = myHeadY-appleY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        return 3;
      }
      return 1;
    }
    if (dy > 0) {
      return 0;
    }
    return 2;
  }

  getRandomPos() {
    return {
      x: Math.floor(Math.random() * this.width),
      y: Math.floor(Math.random() * this.height)
    }
  }

  playGame() {
    try {
      this.clearGrid();

      const s1Pos = this.getRandomPos();
      const s2Pos = this.getRandomPos();
      const aPos = this.getRandomPos();
      let s1x = s1Pos.x;
      let s1y = s1Pos.y;
      let s2x = s2Pos.x;
      let s2y = s2Pos.y;
      this.ax = aPos.x;
      this.ay = aPos.y;

      this.s1Trail = [[s1x, s1y]];
      this.s2Trail = [[s2x, s2y]];


      this.grid[s1y][s1x] = "snake1";
      this.grid[s2y][s2x] = "snake2";
      this.grid[this.ay][this.ax] = "apple";

      const handleMove = (cb: (winner: number) => void) => {
        try {
          const d1 = this.calcS1Move(s1x, s1y, s2x, s2y, this.ax, this.ay);//parts[index++];
          const d2 = this.calcS2Move(s2x, s2y, s1x, s1y, this.ax, this.ay);
          if (d1 === -1 && d2 === -1) {
            cb(0);
          } else if (d1 === -1) {
            cb(2);
          } else if (d2 === -1) {
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
              if (this.grid[ns1y][ns1x] !== "apple") {
                const [removed1] = this.s1Trail.splice(0, 1);
                this.grid[removed1[1]][removed1[0]] = "empty";
                const [removed2] = this.s2Trail.splice(0, 1);
                this.grid[removed2[1]][removed2[0]] = "empty";
                this.grid[ns1y][ns1x] = "collision";
              }
              cb(0);
            } else {
              let s1Died = false;
              let s2Died = false;
              const t1 = this.grid[ns1y][ns1x];
              const t2 = this.grid[ns2y][ns2x];
              if (t1 === "apple" || t2 === "apple") {
                const applePos = this.getRandomPos();
                this.ax = applePos.x;
                this.ay = applePos.y;
              }

              if (t1 !== "apple") {
                const [removed] = this.s1Trail.splice(0, 1);
                this.grid[removed[1]][removed[0]] = "empty";
              }
              if (t2 !== "apple") {
                const [removed] = this.s2Trail.splice(0, 1);
                this.grid[removed[1]][removed[0]] = "empty";
              }

              this.grid[this.ay][this.ax] = "apple";

              if (t1 === "snake1" || t1 === "snake2") {
                s1Died = true;
              }

              if (t2 === "snake1" || t2 === "snake2") {
                s2Died = true;
              }

              this.s1Trail.push([ns1x, ns1y]);
              this.s2Trail.push([ns2x, ns2y]);
              
              this.grid[ns1y][ns1x] = "snake1";
              this.grid[ns2y][ns2x] = "snake2";
              s1x = ns1x;
              s1y = ns1y;
              s2x = ns2x;
              s2y = ns2y;

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
        }
      }
      setTimeout(() => handleMove((winner: number) => {
        this.clearGrid();
        setTimeout(this.playGame.bind(this), this.gameResetDelay);
      }), 1000 / this.turnsPerSecond);

    } catch (e) {
      console.error(e);
    }
  }

  public grid: gridContent[][] = [];


  ngOnInit(): void {
    this.playGame();
  }

}
