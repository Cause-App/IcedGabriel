import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CodeFile, Game } from 'src/app/services/game-list.service';
import * as ace from "ace-builds";
import 'ace-builds/src-noconflict/ext-language_tools';
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ContextMenuItem } from 'src/app/widgets/context-menu/context-menu.component';
import * as JSZip from 'jszip';
import { saveAs } from '@progress/kendo-file-saver';
import { WarningsService } from 'src/app/services/warnings.service';

const languageOfExtension: { [key: string]: string } = {
  "java": "java",
  "js": "javascript",
  "html": "html",
  "css": "css",
  "py": "python",
  "txt": "text"
};

const languageFromFilename = (filename: string): string => {
  const parts = filename.split(".");
  const ext = (parts.length === 1 ? "" : parts.pop()) ?? "";
  return languageOfExtension[ext] ?? "text";
}

const allowedCharsInFilenames = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&'()+,-;=@[]^_`{}~. ";
const notAllowedAtEndOfFilename = ". ";
const notAllowedAtStartOfFilename = " ";

@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss']
})
export class IdeComponent implements OnInit, AfterViewInit {

  @Input() game?: Game;
  @Input() resize?: EventEmitter<void>;
  private aceEditor?: ace.Ace.Editor;
  codeFiles: CodeFile[] = [];
  @Input() newCodeFiles?: EventEmitter<CodeFile[]>;
  public defaultCodeFiles: CodeFile[] = [];
  private editSessions: ace.Ace.EditSession[] = [];
  public displayingContextMenu: boolean = false;
  private contextMenuX: number = -1;
  private contextMenuY: number = -1;
  public contextMenuItems: ContextMenuItem[] = [];

  faDownload = faDownload;

  @Output() onFilesChange: EventEmitter<CodeFile[]> = new EventEmitter<CodeFile[]>();

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
    this._selectedSession = Math.max(0, Math.min(Math.floor(x), this.editSessions.length - 1));
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
    if (this.codeFiles.length >= 16) {
      return;
    }
    const session = this.makeSession();
    this.editSessions.push(session);
    this.codeFiles.push({
      filename: this.incrementDuplicateFilenames("NewFile.java"),
      code: ""
    })
    this.selectedSession = this.editSessions.length - 1;
    this.onFilesChange.emit(this.codeFiles);
  }

  private filenameExists(filename: string): boolean {
    for (const codeFile of this.codeFiles) {
      if (codeFile.filename === filename) {
        return true;
      }
    }
    return false;
  }

  private incrementDuplicateFilenames(filename: string): string {
    let counter = 0;
    let test = filename;
    const parts = filename.split(".");
    const ext = (parts.length === 1 ? "" : "." + parts.pop()) ?? "";
    while (this.filenameExists(test)) {
      counter++;
      test = `${parts.join(".")} (${counter})${ext}`;
    }
    return test;
  }

  updateLanguage(i: number, event: Event) {
    const target = (event.target as HTMLInputElement);
    const filename = target.value;
    let sanitizedFilename = "";
    for (const c of filename) {
      if (allowedCharsInFilenames.includes(c)) {
        sanitizedFilename += c;
      }
    }
    while (sanitizedFilename.length && notAllowedAtEndOfFilename.includes(sanitizedFilename.charAt(sanitizedFilename.length - 1))) {
      sanitizedFilename = sanitizedFilename.substring(0, sanitizedFilename.length - 1);
    }
    while (sanitizedFilename.length && notAllowedAtStartOfFilename.includes(sanitizedFilename.charAt(0))) {
      sanitizedFilename = sanitizedFilename.substring(1, sanitizedFilename.length);
    }

    if (sanitizedFilename.length === 0) {
      sanitizedFilename = "file";
    }
    target.value = this.incrementDuplicateFilenames(sanitizedFilename);
    this.codeFiles[i].filename = target.value;
    const lang = languageFromFilename(target.value);
    this.editSessions[i].setMode(`ace/mode/${lang}`);
    this.editSessions[i].setOption("firstLineNumber", lang === "java" ? 2 : 1);
    this.onFilesChange.emit(this.codeFiles);
  }

  @ViewChild("editor") private editor?: ElementRef;
  @ViewChildren('filenameinput') filenameInputs?: QueryList<ElementRef>

  public saveMessage: boolean = false;

  constructor(private warningsService: WarningsService) {
    warningsService.onChange.subscribe((w) => {
      this.saveMessage = w.includes("save");
    })
  }

  ngOnInit(): void {
    this.defaultCodeFiles = this.game?.defaultCode || [];
    this.resize?.subscribe(() => {
      this.aceEditor?.resize();
    });
    this.newCodeFiles?.subscribe((files: CodeFile[]) => {
      this.codeFiles = files;
      this.loadCodeFiles();
    });
  }

  private loadCodeFiles() {
    if (this.editor) {
      this.aceEditor?.destroy();
      this.editor.nativeElement.innerHTML = "";
      this.editSessions = [];
      this._editingFilename = null;
      this.displayingContextMenu = false;
      this.selectedSession = 0;
      this.aceEditor = ace.edit(this.editor.nativeElement);
      for (const codeFile of this.codeFiles) {
        const session = this.makeSession(codeFile.code);
        const lang = languageFromFilename(codeFile.filename);
        session.setMode(`ace/mode/${lang}`);
        session.setOption("firstLineNumber", lang === "java" ? 2 : 1);
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

      this.aceEditor.commands.addCommand({
        name: "save",
        bindKey: { win: "Ctrl-S", mac: "Command-S" },
        exec: (editor) => {
          this.onFilesChange.emit(this.codeFiles);
        }
      });

      this.aceEditor.on("change", () => {
        if (!this.aceEditor) {
          return;
        }
        this.codeFiles[this.selectedSession].code = this.aceEditor.getValue();
        this.onFilesChange.emit(this.codeFiles);
      });
    }

    this.onFilesChange.emit(this.codeFiles);
  }

  ngAfterViewInit(): void {
    if (this.editor) {
      ace.config.set("basePath", "https://unpkg.com/ace-builds@1.4.12/src-noconflict");
      ace.config.set("fontSize", "0.7em");
      this.loadCodeFiles();
    }
  }

  displayContextMenu(event: MouseEvent, i: number) {
    this.displayingContextMenu = true;
    this.contextMenuItems = []
    if (this.codeFiles[i].protected) {
      this.contextMenuItems.push({
        text: "Reset to default",
        click: () => {
          if (confirm("Are you sure you want to do this? This action cannot be undone, and you will lose whatever code is in this file.")) {
            this.editSessions[i].setValue(this.defaultCodeFiles[i].code);
            const lang = languageFromFilename(this.defaultCodeFiles[i].filename);
            this.editSessions[i].setMode(`ace/mode/${lang}`);
            if (lang === "java") {
              this.editSessions[i].setOption("firstLineNumber", lang === "java" ? 2 : 1);
            }
              this.displayingContextMenu = false;
            this.onFilesChange.emit(this.codeFiles);
          }
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
          if (confirm("Are you sure you want to do this? This action cannot be undone, and you will lose whatever code is in this file.")) {
            this.codeFiles.splice(i, 1);
            this.editSessions.splice(i, 1);
            if (i === this.selectedSession) {
              this.selectedSession--;
            }
            this.displayingContextMenu = false;
            this.onFilesChange.emit(this.codeFiles);
          }
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

  download(): void {
    const zip = new JSZip();
    for (const file of this.codeFiles) {
      zip.file(file.filename, file.code);
    }

    zip.generateAsync({type: "blob"}).then((content) => {
      saveAs(content, "code.zip");
    })
  }

  @HostListener("document:click", ["$event.target"])
  @HostListener("document:contextmenu", ["$event.target"])
  documentClick(target: HTMLElement): void {
    if (!target.classList.contains("file")) {
      this.displayingContextMenu = false;
    }
  }
}
