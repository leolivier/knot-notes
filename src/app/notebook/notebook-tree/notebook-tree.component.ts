import { Component, OnInit, AfterViewInit, ViewChild, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';

import { TreeComponent, TreeNode, TREE_ACTIONS, KEYS, IActionMapping } from 'angular-tree-component';
import { Notebook } from '../../notebook/notebook';
import { Note } from '../../note';
import { DataService } from '../../services/data.service';
import { NotebookShowComponent } from '../notebook-show/notebook-show.component';
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

  customTemplateStringOptions = {
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
  rootNotebook: Notebook[];
  selectedNotebook: Notebook;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private noteService: DataService,
    private alerter: StatusEmitter) {
    // creates a pseudo tree (or else the TreeComponent won't update)
    this.initRoot(new Notebook({ name: '/' }));
  }

  // load the notebook tree at init
  ngOnInit() {
    this.noteService.getRootNotebook()
      .then(notebook => this.initRoot(notebook))
      .then(() => this.notebookTree.treeModel.getFirstRoot().setActiveAndVisible());
  }

  ngAfterViewInit() {
    //    setTimeout(() => this.notebookTree.treeModel.expandAll());
    //    this.notebookTree.treeModel.getFirstRoot().setActiveAndVisible();
  }

  // set the data in the node tree (as an array because this is the way the TreeComponent wants it)
  initRoot(root: Notebook): void {
    this.expandAll(root);
    this.rootNotebook = [root];
    this.selectedNotebook = root;
    // this.notebookTree.treeModel.update();
    this.alerter.info('Root initialized');
  }

  saveRoot() {
    this.noteService.saveRootNotebook(this.rootNotebook[0])
      .then(nb => this.rootNotebook = [nb])
      .catch(reason => this.alerter.error(reason));
  }

  selectNotebook($event) {
    this.selectedNotebook = $event.node.data;
    this.onSelectedNotebook.emit(this.selectedNotebook);
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

  // expandAll not taken into account so rewrite it
  expandAll(nb: Notebook) {
    const that = this;
    nb['isExpanded'] = true;
    if (nb.children && Array.isArray(nb.children)) { nb.children.forEach((c) => that.expandAll(c)); }
  }

  cancelEdition(id: string): void {
    if (this._editableNodeId === id) {
      const n = this.rootNotebook[0].findById(this._editableNodeId);
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

  // find a tree node by its id (recursively) or null if the id is not found
/* useless, replaced by this.notebookTree.treeModel.getNodeById(id);
  findNodeById(from: TreeNode, id: string): TreeNode {
    if (from.id === id) {
      return from;
    } else if (from.children && from.children.length > 0) {
      return from.children.find(c => this.findNodeById(c, id) != null);
//      for (let c of from.children) {
//        const r = this.findNodeById(c, id);
//        if (r) { return r; }
//      }
    }
    return null;
  }
*/
}
