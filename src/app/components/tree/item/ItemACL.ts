import { Functionality } from './Functionality';
import { ItemTree } from './ItemTree';

export class ItemACL extends ItemTree {
  functionalities: Functionality[];
  roles: ItemACL[];
}
