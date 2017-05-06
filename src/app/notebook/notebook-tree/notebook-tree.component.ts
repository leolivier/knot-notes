import { Component, OnInit, AfterViewInit, ViewChild, EventEmitter, Input, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';

import { TreeComponent, TreeNode, TREE_ACTIONS, KEYS, IActionMapping } from 'angular-tree-component';
import { Notebook } from '../../notebook/notebook';
import { Note } from '../../note';
import { NotebookShowComponent } from '../notebook-show/notebook-show.component';
import { DataService } from '../../services/data.service';
import { StatusEmitter } from '../../status-bar/status';

const actionMapping: IActionMapping = {
  mouse: {
    dblClick: (tree, node, $event) => {
      // if (node.hasChildren) TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
      this.startEdition(node.data.id);
    },
  },
  keys: {
    127: (tree, node, $event) => this.deleteNotebook($event, node.data),
  }
};

@Component({
  moduleId: module.id,
  selector: 'app-notebook-tree',
  templateUrl: './notebook-tree.component.html',
  styleUrls: ['./notebook-tree.component.scss']
})
export class NotebookTreeComponent implements OnInit, AfterViewInit {

  private _editableNodeId = '';
  private _initialName = '';

  treeOptions = {
    // displayField: 'subTitle',
    actionMapping,
    //    nodeHeight: 23,
    allowDrag: true,
    allowDrop: true
  };

  @Output() onSelectedNotebook = new EventEmitter<Notebook>();

  // inject the TreeComponent
  @ViewChild(TreeComponent)
  private notebookTree: TreeComponent;

  // the notebook tree
  rootNotebook: Notebook;

  // the currently selected notebook
  selectedNotebook: Notebook;

  // injected current selected note
  @Input() selectedNote: Note;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private noteService: DataService,
    private alerter: StatusEmitter) {
    this.noteService.getRootNotebook()
      .then(notebook => {
        this.rootNotebook = notebook;
        this.alerter.info('Root initialized');
      });
  }

  ngOnInit() {}

  ngAfterViewInit() {
  }

  // expandAll not taken into account so rewrite it
  expandAll(nb: Notebook) {
    const that = this;
    nb['isExpanded'] = true;
    if (nb.children && Array.isArray(nb.children)) { nb.children.forEach((c) => that.expandAll(c)); }
  }

  setSelectedNotebook(nb: Notebook) {
    this.selectedNotebook = nb;
    if (!this.selectedNote || this.selectedNote.notebookid != nb.id) { // avoid overriding current note
      this.onSelectedNotebook.emit(nb);
    }  
  }

  selectNotebook(nb: Notebook) {
    setTimeout(() => {
      const n = (nb.id === Notebook.rootId) ? this.notebookTree.treeModel.getFirstRoot() : this.notebookTree.treeModel.getNodeById(nb.id);
      if (n) {
        n.focus();        
        n.setActiveAndVisible();
        n.expandAll(); // expand all subtree
      } else {
        this.alerter.error('notebook ' + nb.fullName() + ' not found');
      }
    }, 150);
  }

  saveRoot() {
    this.noteService.saveRootNotebook(this.rootNotebook)
      .then(nb => this.rootNotebook = nb)
      .catch(reason => this.alerter.error(reason));
  }

  isEditable(id: string): boolean {
    return (id === this._editableNodeId);
  }

  startEdition(id: string): void {
    this._editableNodeId = id;
    const n = this.notebookTree.treeModel.getNodeById(id);
    if (n) {
      this._initialName = n.data.name;
      n.setActiveAndVisible();
    }
  }

  cancelEdition(id: string): void {
    if (this._editableNodeId === id) {
      const n = this.rootNotebook.findById(this._editableNodeId);
      n.name = this._initialName;
      const nt = this.notebookTree.treeModel.getNodeById(id);
      nt.data.name = this._initialName;
      this._editableNodeId = '';
      this._initialName = '';
      this.notebookTree.treeModel.update();
    }
  }

  toggleEdition(id: string): void {
    if (this._editableNodeId === id) { this.cancelEdition(id); } else { this.startEdition(id); }
  }

  endEdition(): void {
    this._editableNodeId = '';
    this._initialName = '';
    this.saveRoot();
    // now update display and focus on new node
    this.notebookTree.treeModel.update();
  }

  checkEndEdition($event): void {
    switch ($event.key) {
      case 'Enter': this.endEdition(); break;
      case 'Escape': this.cancelEdition(this._editableNodeId); break;
    }
  }

  addNotebook($event, nodedata: Notebook) {
    $event.stopPropagation();
    // create a default new node with a predefined name
    const newnb = new Notebook({ name: 'new notebook' });
    // add it to the children in the current node
    newnb.parent = nodedata;
    nodedata.children.push(newnb);
    this.saveRoot();
    // now update display and focus on new node
    this.notebookTree.treeModel.update();
    this.startEdition(newnb.id);
  }

  deleteNotebook($event, nodedata) {
    // TODO: Add a confirmation before actually deleting.
    // TODO: If confirmed, ask if notes and subtree must be deleted also
    // remove in the parent node the node having the current node id
    nodedata.parent.children = nodedata.parent.children.filter((c) => c.id !== nodedata.id);
    // update the display
    this.notebookTree.treeModel.update();
    this.saveRoot();
  }  
}
