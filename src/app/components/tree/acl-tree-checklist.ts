import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Injectable } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { AclDatabase } from './database/AclDatabase';
import { ItemTree } from './item/ItemTree';

/**
 * @title Tree with checkboxes
 */
@Component({
  selector: 'acl-tree-checklist',
  templateUrl: 'acl-tree-checklist.html',
  styleUrls: ['acl-tree-checklist.scss'],
  providers: [AclDatabase],
})
export class ACLChecklist {
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<ItemTree, ItemTree>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<ItemTree, ItemTree>();

  /** A selected parent node to be inserted */
  selectedParent: ItemTree | null = null;

  /** The new item's name */
  newItemName = '';

  treeControl: FlatTreeControl<ItemTree>;

  treeFlattener: MatTreeFlattener<ItemTree, ItemTree>;

  dataSource: MatTreeFlatDataSource<ItemTree, ItemTree>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<ItemTree>(true /* multiple */);

  constructor(private _database: AclDatabase) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<ItemTree>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    _database.dataChange.subscribe((data) => {
      this.dataSource.data = data;
      console.log('DATA:: ', data);
      console.log('this.dataSource', this.dataSource);
    });
  }

  getLevel = (node: ItemTree) => node.level;

  isExpandable = (node: ItemTree) => node.expandable;

  getChildren = (node: ItemTree): any => node.children;

  hasChild = (_: number, _nodeData: ItemTree) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: ItemTree) => _nodeData.name === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: ItemTree, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.name === node.name
        ? existingNode
        : new ItemTree();
    flatNode.name = node.name;
    flatNode.level = level;
    flatNode.expandable = !!node.children?.length;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: ItemTree): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: ItemTree): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some((child) =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: ItemTree): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach((child) => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: ItemTree): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: ItemTree): void {
    let parent: ItemTree | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: ItemTree): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: ItemTree): ItemTree | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  /** Select the category so we can insert the new item. */
  addNewItem(node: ItemTree) {
    const parentNode = this.flatNodeMap.get(node);
    console.log('xxxxxx ', parentNode);
    this._database.insertItem(parentNode!, { name: '' } as ItemTree);
    this.treeControl.expand(node);
  }

  /** Save the node to database */
  saveNode(node: ItemTree, itemValue: string) {
    const nestedNode = this.flatNodeMap.get(node);
    console.log('yyyyyyy ', nestedNode);
    this._database.updateItem(nestedNode!, itemValue);
  }

  removeItem(node: ItemTree) {
    console.log('remove:: ', node);
    const parentNode = this.getParentNode(node);
    console.log('parentNode:: ', parentNode);
    this._database.removeItems(this._database.data!, node);
  }

  showFuncs(node: ItemTree) {}
}
