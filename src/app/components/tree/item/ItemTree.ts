import { ItemTreeACL } from './ItemTreeACL';
import { ItemTreeBase } from './ItemTreeBase';

export class ItemTree extends ItemTreeBase {
  children: ItemTreeACL[] = [];
}
