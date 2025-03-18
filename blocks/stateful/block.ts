import { type Remapper } from '@appsemble/sdk';

type StateAction = Remapper;

declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * This event changes the internal state.
     *
     * It requires an object with two entries:
     * - `stateAction` - the state action from this block's parameters
     * - `data` - an object which will be used to update the state
     */
    onStateChange: never;
  }

  interface EventEmitters {
    /**
     * This event is emitted when the state updates and contains the state itself
     * as well as the state action that triggered the update.
     */
    stateChanged: never;
  }

  interface Parameters {
    /**
     * A record of stateAction names to remappers
     *
     * The remappers will be used to extract data from the existing state
     * and from the incoming data to update the state
     *
     * @example
     * ```yaml
     * updatePagination:
     *   object.from:
     *     $skip: { prop: [ data, $skip ] }
     *     $top: { prop: [ data, $top ] }
     *     $filter: { prop: [ state, $filter ] }
     * updateFilter:
     *   object.from:
     *     $skip: { prop: [ state, $skip ] }
     *     $top: { prop: [ state, $top ] }
     *     $filter: { prop: [ data, $filter ] }
     * ```
     */
    stateActions: Record<string, StateAction>;
  }
}
