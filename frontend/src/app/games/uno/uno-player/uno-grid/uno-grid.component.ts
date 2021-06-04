import { Component, Input, OnInit } from '@angular/core';
import { WarningsService } from 'src/app/services/warnings.service';
import { ConsoleService } from 'src/app/services/console.service';

type suit = "red" | "blue" | "green" | "yellow" | "wild";
type value = "zero" | "one" | "two" | "three" | "four" | "five" | "six" | "seven" | "eight" | "nine" | "skip" | "reverse" | "draw2" | "draw4" | "changecolor";
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
export class UnoGridComponent implements OnInit {

  constructor(private warnings: WarningsService, private consoleService: ConsoleService) {
    this.clearBoard();
  }

  text: any = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    skip: "Skip",
    reverse: "Reverse",
    draw2: "+2",
    draw4: "+4",
    changecolor: "Pick Color"

  }

  winner: string = "";
  details: string = "";

  public turnsPerSecond = 1;
  public playingGame: boolean = false;
  public cancelledGame: boolean = false;

  get opponentCards() {
    return Array(this.opponentHandSize).map((x, i) => i);
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


      let round = 1;
      if (logMessages[0]) {
        log(logMessages[0]);
      }
      
      const handleMove = (cb: (winner: number) => void) => {
        try {
          console.log(this.opponentHandSize);
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
          const opponentPickupSize = +parts[index++];
          console.log({opponentPickupSize});
          this.opponentHandSize += opponentPickupSize;
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
    this.deckSize = 0;
    this.myHand = [];
    this.opponentHandSize = 0;
    this.myTurn = false;
    this.lastPlayedCard = undefined;
  }

  ngOnInit(): void {
  }
}
