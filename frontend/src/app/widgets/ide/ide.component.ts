import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CodeFile, Game } from 'src/app/services/game-list.service';
import * as ace from "ace-builds";
import 'ace-builds/src-noconflict/ext-language_tools';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ContextMenuItem } from 'src/app/widgets/context-menu/context-menu.component';

const languageOfExtension: {[key: string]: string} = {
  "java": "java",
  "js": "javascript",
  "html": "html",
  "css": "css",
  "py": "python",
  "txt": "text"
};

const languageFromFilename = (filename: string): string => {
  const parts = filename.split(".");
  const ext = (parts.length === 1 ? "": parts.pop()) ?? "";
  return languageOfExtension[ext] ?? "text";
}

@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss']
})
export class IdeComponent implements OnInit, AfterViewInit {

  @Input() game?: Game;
  @Input() resize?: EventEmitter<void>;
  private aceEditor?: ace.Ace.Editor;
  public codeFiles: CodeFile[] = [];
  private editSessions: ace.Ace.EditSession[] = [];
  public displayingContextMenu: boolean = false;
  private contextMenuX: number = -1;
  private contextMenuY: number = -1;
  public contextMenuItems: ContextMenuItem[] = [];

  public _editingFilename: number | null = null;

  public get editingFilename(): number | null {
    return this._editingFilename;
  }

  public set editingFilename(x: number | null) {
    this._editingFilename = x;
    if (this.filenameInputs && x !== null) {
      setTimeout(() => { this.filenameInputs?.get(x)?.nativeElement.focus() }, 0);
    }
  }


  faPlus = faPlus;

  private _selectedSession: number = 0;

  public get selectedSession(): number {
    return this._selectedSession;
  }

  public set selectedSession(x: number) {
    this._selectedSession = Math.min(Math.max(0, Math.floor(x)), this.editSessions.length - 1);
    if (this.aceEditor) {
      this.aceEditor.setSession(this.editSessions[this._selectedSession]);
    }
  }

  private makeSession(text?: string) {
    const session = new ace.EditSession(text ?? "");
    session.setUndoManager(new ace.UndoManager());
    return session;
  }

  newFile(): void {
    const session = this.makeSession();
    this.editSessions.push(session);
    this.codeFiles.push({
      filename: "New file.txt",
      code: ""
    })
    this.selectedSession = this.editSessions.length - 1;
  }

  updateLanguage(i: number, event: Event) {
    this.editSessions[i].setMode(`ace/mode/${languageFromFilename((event.target as HTMLInputElement).value)}`);
  }

  @ViewChild("editor") private editor?: ElementRef;
  @ViewChildren('filenameinput') filenameInputs?: QueryList<ElementRef>



  constructor() { }

  ngOnInit(): void {
    this.codeFiles = this.game?.defaultCode || [];
    this.resize?.subscribe(() => {
        this.aceEditor?.resize();
    })
  }

  ngAfterViewInit(): void {
    if (this.editor) {
      ace.config.set("basePath", "https://unpkg.com/ace-builds@1.4.12/src-noconflict");
      ace.config.set("fontSize", "0.7em");
      this.aceEditor = ace.edit(this.editor.nativeElement);
      for (const codeFile of this.codeFiles) {
        const session = this.makeSession(codeFile.code);
        session.setMode(`ace/mode/${languageFromFilename(codeFile.filename)}`);
        this.editSessions.push(session);
      }
      while (this.editSessions.length <= this.selectedSession) {
        const session = this.makeSession("");
        this.editSessions.push(session);
      }
      this.aceEditor.setSession(this.editSessions[this.selectedSession]);
      this.aceEditor.setTheme("ace/theme/twilight");
      this.aceEditor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: false,
        mergeUndoDeltas: true
      });

      this.aceEditor.commands.addCommand({
        name: "undo",
        bindKey: { win: "Ctrl-Z", mac: "Command-Z" },
        exec: (editor) => {
          editor.session.getUndoManager().undo(editor.session);
        }
      });

      this.aceEditor.commands.addCommand({
        name: "redo",
        bindKey: { win: "Ctrl-Y", mac: "Command-Y" },
        exec: (editor) => {
          editor.session.getUndoManager().redo(editor.session);
        }
      });
    }
  }

  displayContextMenu(event: MouseEvent, i: number) {
    this.displayingContextMenu = true;
    this.contextMenuItems = []
    if (this.codeFiles[i].protected) {
      this.contextMenuItems.push({
        text: "Reset to default",
        click: () => {
          this.editSessions[i].setValue(this.codeFiles[i].code);
          this.editSessions[i].setMode(`ace/mode/${languageFromFilename(this.codeFiles[i].filename)}`);
          this.displayingContextMenu = false;
        }
      });
    } else {
      this.contextMenuItems.push({
        text: "Rename",
        click: () => {
          this.editingFilename = i;
          this.displayingContextMenu = false;
        }
      });
      this.contextMenuItems.push({
        text: "Delete",
        click: () => {
          this.codeFiles.splice(i, 1);
          this.editSessions.splice(i, 1);
          if (i === this.selectedSession) {
            this.selectedSession--;
          }
          this.displayingContextMenu = false;
        }
      });
    }
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
  }

  getContextMenuStyle() {
    return {
      position: 'fixed',
      left: `${this.contextMenuX}px`,
      top: `${this.contextMenuY}px`
    }
  }

  @HostListener("document:click", ["$event.target"])
  @HostListener("document:contextmenu", ["$event.target"])
  documentClick(target: HTMLElement): void {
    if (!target.classList.contains("file")) {
      this.displayingContextMenu = false;
    }
  }
}
