import { AfterViewInit, Component, ComponentFactoryResolver, EventEmitter, HostListener, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeableComponent, checkSaveChangesBeforeLeave } from 'src/app/guards/changes-made.guard';
import { CodeFile, Game, GameListService } from 'src/app/services/game-list.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, AfterViewInit, ChangeableComponent {

  public game?: Game;
  public resizeEmitter: EventEmitter<void> = new EventEmitter<void>();
  public changesMade: boolean = false;

  codeChanged: EventEmitter<void> = new EventEmitter<void>();

  constructor(private route: ActivatedRoute, public gameList: GameListService, private router: Router, private resolver: ComponentFactoryResolver) {
  }

  @ViewChild("optionsContainer", { read: ViewContainerRef }) optionsContainer?: ViewContainerRef;
  @ViewChild("playerContainer", { read: ViewContainerRef }) playerContainer?: ViewContainerRef;

  loadedCodeFiles: EventEmitter<CodeFile[]> = new EventEmitter<CodeFile[]>();
  playerIdChanged: EventEmitter<void> = new EventEmitter<void>();

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const gameID = params['id'];
      this.game = this.gameList.gameWithID(gameID);
      if (!this.game) {
        this.router.navigate(["/"]);
      }
    });
  }

  codeFiles: CodeFile[] = [];

  getFiles() {
    return this.codeFiles;
  }

  playerId: string | undefined | null = "";
  getPlayerId(): string | undefined | null {
    return this.playerId;
  }

  onPlayerIdChange(id: string | undefined | null): void {
    this.playerId = id;
    this.playerIdChanged.emit();
  }

  codeFilesLoaded(files: CodeFile[]) {
    this.loadedCodeFiles.emit(files);
  }

  ngAfterViewInit(): void {
    if (this.game) {
      if (this.optionsContainer) {
        this.optionsContainer.clear();
        const factory = this.resolver.resolveComponentFactory(this.game.optionsComponent);
        const reference: any = this.optionsContainer.createComponent(factory);
        reference.instance.getFiles = this.getFiles.bind(this);
        reference.instance.onFilesLoaded = this.codeFilesLoaded.bind(this);
        reference.instance.onCodeChanged = this.codeChanged;
        reference.instance.onIdChanged = this.onPlayerIdChange.bind(this);
        reference.instance.onChangesMade = (x: boolean) => {
          this.changesMade = x;
        }
      }
      if (this.playerContainer) {
        this.playerContainer.clear();
        const factory = this.resolver.resolveComponentFactory(this.game.playerComponent);
        const reference: any = this.playerContainer.createComponent(factory);
        reference.instance.getPlayerId = this.getPlayerId.bind(this);
        reference.instance.playerIdChanged = this.playerIdChanged;
      }
    }
  }


  resized(): void {
    this.resizeEmitter.emit();
  }

  @HostListener('window:beforeunload', ['$event'])
  onbeforeunload(event: Event) {
    if (this.changesMade && !checkSaveChangesBeforeLeave()) {
      event.preventDefault();
      event.returnValue = false;
    }
  }

}
