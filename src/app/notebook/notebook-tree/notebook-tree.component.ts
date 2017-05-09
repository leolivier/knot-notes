import { Component, OnInit, ViewChild, Input, Directive, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { TreeComponent, TreeNode, TREE_ACTIONS, KEYS, IActionMapping, ITreeOptions } from 'angular-tree-component';
import { Notebook } from '../../notebook/notebook';
import { Note } from '../../note';
import { NotebookShowComponent } from '../notebook-show/notebook-show.component';
import { DataService } from '../../services/data.service';
import { StatusEmitter } from '../../status-bar/status';

@Directive({ selector: '[TreeInput]' })
export class TreeInputDirective {
  constructor(el: ElementRef) {
//    setTimeout(() => el.nativeElement.setSelectionRange(0, 9999), 50);
    el.nativeElement.focus();
    setTimeout(() => el.nativeElement.select(), 50);
  }
}

@Component({
  moduleId: module.id,
  selector: 'app-notebook-tree',
  templateUrl: './notebook-tree.component.html',
  styleUrls: ['./notebook-tree.component.scss']
})
export class NotebookTreeComponent implements OnInit {

        private _editedNode: TreeNode = null;
  private _initialName = '';
  private _newNode: TreeNode = null;

  treeOptions: ITreeOptions = {
    // displayField: 'subTitle',
    actionMapping: {
      mouse: {
        /* dblClick: (tree, node, $event) => {
        //     if (node.hasChildren) TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
             this.startEdition(node.data.id);
           }, */
      },
      keys: { // does not work!
        delete: (tree, node, $event) => {
          $event.stopPropagation();
          this.deleteNode(node);
        },
      }
    },
    //    nodeHeight: 23,
    allowDrag: true,
    allowDrop: true,
    useVirtualScroll: false
  };

  // inject the TreeComponent
  @ViewChild(TreeComponent)
  private notebookTree: TreeComponent;

  // the notebook tree
  rootNotebook: Notebook;

  clicked: false;
  
  private _selectedNotebook: Notebook;
  // inject current selected notebook
  @Input() set selectedNotebook(nb: Notebook) {
    if (!nb) { return; }
    if (!this._selectedNotebook || this._selectedNotebook.id !== nb.id) {
      this._selectedNotebook = nb;
      setTimeout(() => {
        const n = (nb.id === Notebook.rootId) ? this.notebookTree.treeModel.getFirstRoot() : this.notebookTree.treeModel.getNodeById(nb.id);
        if (n) {
          this.notebookTree.sizeChanged();
          n.focus();
          n.setActiveAndVisible();
          n.expandAll(); // expand all subtree
        } else {
          this.alerter.error('notebook ' + this.noteService.notebookFullName(nb) + ' not found');
        }
      });
    }
  }

  get selectedNotebook(): Notebook { return this._selectedNotebook; }
  
  constructor(
    private router: Router,
    private noteService: DataService,
    private alerter: StatusEmitter) {
    this.noteService.getRootNotebook()
      .then(notebook => {
        this.rootNotebook = notebook;
        this.alerter.info('Root initialized');
      });
  }

  ngOnInit() {}

  selectNode(n: TreeNode, force = false) {   
    // must used on node click only or if force=true
    if (!this.clicked && !force) return;
    else this.clicked = false;
    if (n.id === Notebook.rootId) {
      this.router.navigate(['notes']);
    } else {
      this.router.navigate(['notebook', n.id]);
    }
  }
  
  saveRoot() {
    this._newNode = null;
    this.noteService.saveRootNotebook(this.rootNotebook)
      .then(nb => this.rootNotebook = nb)
      .catch(reason => this.alerter.error(reason));
  }

  isEditable(node: TreeNode): boolean {
    return (this._editedNode && node.id === this._editedNode.id);
  }

  startEdition(node: TreeNode) {
    this._editedNode = node;
    this._initialName = node.data.name;
    node.focus();
    node.setActiveAndVisible();
  }

  private focusedInput = null;
  selectInput(input) {
    if (!input) return;
    if (this.focusedInput == input) return; //already focused, return so user can now place cursor at specific point in input.
    this.focusedInput = input;
    setTimeout(() => { this.focusedInput.select(); }, 50); //select all text in any field on focus for easy re-entry. Delay sightly to allow focus to "stick" before selecting.
  }

  cancelEdition() {
    if (this._newNode) { // cancel and not yet saved => delete only in tree
      let parent = this.notebookTree.treeModel.getNodeById(this._newNode.id).parent;
      parent.data.children = parent.data.children.filter((c) => c.id !== this._newNode.id);
      this.selectNode(parent, true); // and route to parent
    } else {
      this._editedNode.data.name = this._initialName;
    }  
    this._editedNode = null;
    this._initialName = '';
    this.notebookTree.treeModel.update();
  }

  endEdition(): void {
    if (this._editedNode.data.name === '') this.cancelEdition();
    this._editedNode = null;
    this._initialName = '';
    this.saveRoot();
    // now update display and focus on new node
    this.notebookTree.treeModel.update();
  }

  checkEndEdition($event): void {
    switch ($event.key) {
      case 'Enter': this.endEdition(); break;
      case 'Escape': this.cancelEdition(); break;
    }
  }

  addNode(node: TreeNode) {
    // create a default new node with an empty name
    const newnb = new Notebook({ name: '' });
    // add it to the children in the current node
    let nb = this.rootNotebook.findById(node.id);
    nb.children.push(newnb);
    // now update display and focus on new node
    this.notebookTree.treeModel.update();
    this._newNode = this.notebookTree.treeModel.getNodeById(newnb.id)
    this.startEdition(this._newNode);
  }

  deleteNode(node: TreeNode) {
    if (confirm('Are you sure you want to delete this notebook? \n(Warning: Notes inside this notebook will be lost!)')) {
      const selectedNode = this.notebookTree.treeModel.getNodeById(this.selectedNotebook.id)
      // TODO: If confirmed, ask if notes and subtree must be deleted also
      this.noteService.deleteNotebookContent(node.data);
      // remove in the parent node the node having the current node id
      let parent = this.notebookTree.treeModel.getNodeById(node.id).parent;      
      parent.data.children = parent.data.children.filter((c) => c.id !== node.id);
      this.saveRoot();
      // update the display
      this.notebookTree.treeModel.update();
      if (this.selectedNotebook.id === node.id || selectedNode.isDescendantOf(node)) {
        this.selectNode(parent, true);
      }
    }
  }  
}
