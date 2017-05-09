import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';

import { TreeComponent, TreeNode, TREE_ACTIONS, KEYS, IActionMapping, ITreeOptions } from 'angular-tree-component';
import { Notebook } from '../../notebook/notebook';
import { Note } from '../../note';
import { NotebookShowComponent } from '../notebook-show/notebook-show.component';
import { DataService } from '../../services/data.service';
import { StatusEmitter } from '../../status-bar/status';

@Component({
  moduleId: module.id,
  selector: 'app-notebook-tree',
  templateUrl: './notebook-tree.component.html',
  styleUrls: ['./notebook-tree.component.scss']
})
export class NotebookTreeComponent implements OnInit {

  private _editableNodeId = '';
  private _initialName = '';

  actionMapping: IActionMapping = {
    mouse: {
      dblClick: (tree, node, $event) => {
        // if (node.hasChildren) TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
        this.startEdition(node.data.id);
      },
    },
    keys: {
      127: (tree, node, $event) => {
        this.deleteNode(node);
        $event.stopPropagation();
      },
    }
  }
  treeOptions: ITreeOptions = {
    // displayField: 'subTitle',
    actionMapping: this.actionMapping,
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
    if (this._editableNodeId === id) {
      this.cancelEdition(id);
    } else {
      this.startEdition(id);
    }
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

  addNode(node: TreeNode) {
    // create a default new node with a predefined name
    const newnb = new Notebook({ name: 'new notebook' });
    // add it to the children in the current node
    let nb = this.rootNotebook.findById(node.id);
//    newnb.parent = nb;
    nb.children.push(newnb);
    this.saveRoot();
    // now update display and focus on new node
    this.notebookTree.treeModel.update();
    this.startEdition(newnb.id);
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
