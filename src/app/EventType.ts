import { EdgeType } from './lct/EdgeSet';
import { LinkCutTreeNode, NullableNode } from './lct/LinkCutTreeNode';

interface AddNodeEvent {
    kind: 'AddNode';
    node: LinkCutTreeNode;
}

interface AddEdgeEvent {
    kind: 'AddEdge';
    edge: EdgeType;
}

interface ApplyValueEvent {
    kind: 'ApplyValue';
    node: LinkCutTreeNode;
    value: number;
}

interface ToHeavyEvent {
    kind: 'ToHeavy';
    preRight: NullableNode;
    curRight: NullableNode;
}

interface DeleteEdgeEvent {
    kind: 'DeleteEdge';
    edge: EdgeType;
}

interface RotateEvent {
    kind: 'Rotate';
    id: number;
    nodes: LinkCutTreeNode[];
    added: EdgeType[];
    deleted: EdgeType[];
}

interface ToggleEvent {
    kind: 'Toggle';
    node: LinkCutTreeNode;
}

interface PushEvent {
    kind: 'Push';
    node: LinkCutTreeNode;
}


type LinkCutTreeEvent = AddNodeEvent | AddEdgeEvent | ApplyValueEvent | ToHeavyEvent |
                        DeleteEdgeEvent | RotateEvent | ToggleEvent | PushEvent;
type EventGenerator = Generator<LinkCutTreeEvent, any, any>;

export {
    EdgeType,
    AddNodeEvent,
    AddEdgeEvent,
    ApplyValueEvent,
    ToHeavyEvent,
    DeleteEdgeEvent,
    RotateEvent,
    ToggleEvent,
    PushEvent,
    LinkCutTreeEvent,
    EventGenerator,
};
