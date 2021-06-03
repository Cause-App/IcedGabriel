import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { WarningsService } from 'src/app/services/warnings.service';
import { ConsoleService } from 'src/app/services/console.service';

type suit = "red" | "blue" | "green" | "yellow" | "wild";
type value = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "skip" | "reverse" | "draw2" | "draw4" | "changecolor";
interface Card {
  suit: suit;
  value: value;
}

const codeToCard = (code: string): Card => {
  const [v, s] = code.split("_").map(x => x.toLowerCase());
  return {suit: (s as suit), value: (v as value)};
}

@Component({
  selector: 'app-uno-grid',
  templateUrl: './uno-grid.component.html',
  styleUrls: ['./uno-grid.component.scss']
})
export class UnoGridComponent implements OnInit, AfterViewInit {

  constructor(private warnings: WarningsService, private consoleService: ConsoleService) {
    this.clearBoard();
  }

  winner: string = "";
  details: string = "";

  @ViewChild("canvas") canvasRef?: ElementRef;

  public turnsPerSecond = 1;
  public playingGame: boolean = false;
  public cancelledGame: boolean = false;

  private drawCanvas() {
    if (!this.canvasRef) {
      return;
    }
    const ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext("2d");
    const width = this.canvasRef.nativeElement.width;
    const height = this.canvasRef.nativeElement.height;

    console.log(JSON.parse(JSON.stringify({
      myHand: this.myHand,
      deckSize: this.deckSize,
      opponentHandSize: this.opponentHandSize,
      lastPlayedCard: this.lastPlayedCard,
      myTurn: this.myTurn
    })));

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

  }

  deckSize: number = 0;
  myHand: Card[] = [];
  opponentHandSize: number = 0;
  lastPlayedCard?: Card;
  myTurn: boolean = false;

  @Input() set gameString(game: string) {
    if (this.playingGame) {
      this.cancelledGame = true;
      setTimeout(() => {
        this.gameString = game;
      }, 100);
      return;
    }
    if (!game) {
      this.clearBoard();
      return;
    }
    try {
      this.winner = "";
      this.details = "";
      this.playingGame = true;
      this.cancelledGame = false;
      const lines = game.split("\n");
      const parts: string[] = lines[0].split(",");
      console.log(parts);

      const logMessages: {[key: number]: string} = {};

      const log = (msg: string) => {
        msg = msg.replace(/&colon;/g, ":").replace(/&newline;/g, "\n").replace(/&amp;/g, "&");
        this.consoleService.log(msg);
      }

      for (let x=1; x<lines.length; x++) {
        if (!lines[x]) {
          continue;
        }
        const [r, l] = lines[x].split(":");
        logMessages[+r] = l;
      }

      this.clearBoard();

      this.deckSize = +parts[0];
      this.myHand = [];
      let index = 3;
      for (let i=0; i<+parts[1]; i++) {
        this.myHand.push(codeToCard(parts[index++]));
      }
      this.opponentHandSize = +parts[2];
      this.lastPlayedCard = codeToCard(parts[index++]);
      this.myTurn = parts[index++] === "1";
      const pickupSize = +parts[index++];
      for (let i=0; i<pickupSize; i++) {
        this.myHand.push(codeToCard(parts[index++]));
      }
      this.opponentHandSize += +parts[index++];

      this.drawCanvas();

      let round = 1;
      if (logMessages[0]) {
        log(logMessages[0]);
      }
      
      const handleMove = (cb: (winner: number) => void) => {
        try {
          if (logMessages[round]) {
            log(logMessages[round]);
          }
          round++;
          if (this.cancelledGame) {
            this.playingGame = false;
            return;
          }

          this.lastPlayedCard = codeToCard(parts[index++]);
          if (this.myTurn) {
            for (let i=0; i<this.myHand.length; i++) {
              const c = this.myHand[i];
              if (c.suit === this.lastPlayedCard.suit && c.value === this.lastPlayedCard.value) {
                this.myHand.splice(i, 1);
                break;
              }
            }
          } else {
            this.opponentHandSize--;
          }
          const pickupSize = +parts[index++];
          for (let i=0; i<pickupSize; i++) {
            this.myHand.push(codeToCard(parts[index++]));
          }
          this.opponentHandSize += +parts[index++];
          this.deckSize = +parts[index++];
          const nextTurn = parts[index++];
          
          if (nextTurn === "0") {
            cb(+parts[index++]);
          }else {
            this.myTurn = nextTurn === "1";
            setTimeout(() => {
              handleMove(cb);
            }, 1000 / this.turnsPerSecond);
          }
          
          this.drawCanvas();
        } catch (e) {
          console.error(e);
          this.warnings.setWarning("invalidGame", true);
        }
      }
      setTimeout(() => handleMove((winner: number) => {
        if (winner === 0) {
          this.winner = "You tied :/";
        } else if (winner === 1) {
          this.winner = "You win :)";
        } else {
          this.winner = "You lose :(";
        }
        this.playingGame = false;
      }), 1000 / this.turnsPerSecond);
  
    } catch (e) {
      console.error(e);
      this.warnings.setWarning("invalidGame", true);
    }
  }

  private clearBoard() {
    this.drawCanvas();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.drawCanvas();
  }

}
