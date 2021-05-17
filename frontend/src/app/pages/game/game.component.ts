import { AfterViewInit, Component, ComponentFactoryResolver, EventEmitter, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CodeFile, Game, GameListService } from 'src/app/services/game-list.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, AfterViewInit {

  public game?: Game;
  public resizeEmitter: EventEmitter<void> = new EventEmitter<void>();

  constructor(private route: ActivatedRoute, public gameList: GameListService, private router: Router, private resolver: ComponentFactoryResolver) {
  }

  @ViewChild("optionsContainer", {read: ViewContainerRef}) optionsContainer?: ViewContainerRef;

  loadedCodeFiles: EventEmitter<CodeFile[]> = new EventEmitter<CodeFile[]>();

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

  codeFilesLoaded(files: CodeFile[]) {
    this.loadedCodeFiles.emit(files);
  }

  ngAfterViewInit(): void {
    if (this.game && this.optionsContainer) {
      this.optionsContainer.clear(); 
      const factory = this.resolver.resolveComponentFactory(this.game.optionsComponent);
      const reference: any = this.optionsContainer.createComponent(factory);  
      reference.instance.getFiles = this.getFiles.bind(this); 
      reference.instance.onFilesLoaded = this.codeFilesLoaded.bind(this); 
    }
  }


  resized(): void {
    this.resizeEmitter.emit();
  }

}
