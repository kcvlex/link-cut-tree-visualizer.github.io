import { useState } from "react";
import Graph from "react-graph-vis";
import { LinkCutTreeNode, isNonNull, NullableNode } from './lct/LinkCutTreeNode';
import { LinkCutTree } from './lct/LinkCutTree';
import * as event from './EventType.ts';
import { EdgeType, EdgeStatus } from './lct/EdgeSet';

interface DrawNode {
    id: number;
    label: string;
};

interface DrawEdge {
    from: number;
    to: number;
    dashes: boolean;
    width: number;
    color: string;
};

function getEdgeStatus(c: LinkCutTreeNode, p: LinkCutTreeNode): EdgeStatus {
    if (c.parent !== p) throw new Error();
    if (p.children[0] === c) return 'Left';
    if (p.children[1] === c) return 'Right';
    return 'Light';
}

const leftColor = 'red', rightColor = 'blue';
function makeEdge(e: EdgeType) {
    const [ src, dst, status ] = e;
    const w = 3;
    switch (status) {
        case 'Left': return { from: src, to: dst, dashes: false, width: w, color: leftColor };
        case 'Right': return { from: src, to: dst, dashes: false, width: w, color: rightColor };
        case 'Light': return { from: src, to: dst, dashes: true, width: w, color: 'black' };
    }
}

function makeNodeLabel(n: LinkCutTreeNode) {
    return Number(n.id).toString();
}

function makeNodeTitle(n: LinkCutTreeNode) {
    return `value = ${n.value}\n` +
           `sum = ${n.sum}\n` +
           `lazyValue = ${n.lazyValue}\n` +
           `rev = ${n.rev}\n`;
}

function eqDrawEdge(lhs: DrawEdge, rhs: DrawEdge) {
    if (lhs.from !== rhs.from) return false;
    if (lhs.to !== rhs.to) return false;
    if (lhs.dashes !== rhs.dashes) return false;
    if (lhs.color !== rhs.color) return false;
    return true;
}

interface DrawGraph {
    nodes: DrawNode[];
    edges: DrawEdge[];
};

const tree = new LinkCutTree(0);

class GraphState {
    public operation: string;

    constructor(public readonly graph: DrawGraph) {
    }

    private handleAddNode(e: event.AddNodeEvent) {
        const n = e.node;
        this.graph.nodes.push(
            { id: n.id, label: makeNodeLabel(n) });
        this.operation = `Add Node ${n.id}`;
    }

    private handleAddEdge(e: event.AddEdgeEvent) {
        this.graph.edges.push(makeEdge(e.edge));
        this.operation = `Link Node ${e.edge[0]} to ${e.edge[1]}`;
    }

    private handleToHeavy(e: event.ToHeavyEvent) {
        const preR = e.preRight, curR = e.curRight;
        let removeIndex = -1;
        this.graph.edges.forEach((edge, idx) => {
            if (isNonNull(preR)) {
                if (edge.from === preR.id) this.graph.edges[idx] = makeEdge([ edge.from, edge.to, 'Light' ]);
            } 
            if (isNonNull(curR)) {
                if (edge.from === curR.id) removeIndex = idx;
            }
        });
        if (removeIndex !== -1) this.graph.edges.splice(removeIndex, 1);
        if (isNonNull(curR)) {
            const p = curR.parent;
            if (isNonNull(p)) {
                this.graph.edges.push(makeEdge([ curR.id, p.id, getEdgeStatus(curR, p) ]));
            }
        }

        if (isNonNull(curR)) {
            const p = curR.parent;
            if (isNonNull(p)) {
                this.operation = `Connect Node ${curR.id} to Node ${p.id}`;
            } else {
                this.operation = `Node ${curR.id} became root`;
            }
        } else {
            this.operation = `Connect nullptr`;
        }
    }

    private removeEdge(item: EdgeType) {
        const e = makeEdge(item);
        for (const i in this.graph.edges) {
            if (!eqDrawEdge(e, this.graph.edges[i])) continue;
            this.graph.edges.splice(parseInt(i), 1);
            break;
        }
    }

    private handleDeleteEdge(e: event.DeleteEdgeEvent) {
        this.removeEdge(e.edge);
    }

    private handleRotate(e: event.RotateEvent) {
        console.log(e);
        e.nodes.forEach(n => { this.graph.nodes[n.id].label = makeNodeLabel(n); });
        e.deleted.forEach(de => { this.removeEdge(de); });
        e.added.forEach(ae => { this.graph.edges.push(makeEdge(ae)); });
        this.operation = `Rotate Node ${e.id}`;
    }

    private handlePush(e: event.PushEvent) {
        const ns = [ e.node, e.node.children[0], e.node.children[1] ];
        for (const e of ns) {
            if (isNonNull(e)) {
                this.graph.nodes[e.id].label = makeNodeLabel(e);
            }
        }
    }

    private handleToggle(e: event.ToggleEvent) {
        const n = e.node;
        for (const i in this.graph.edges) {
            const tmp = this.graph.edges[i];
            if (tmp.to !== n.id) continue;
            this.graph.edges[i].color = (tmp.color === leftColor ? rightColor : leftColor);
        }
        this.operation = `Toggle Node ${n.id}`;
    }

    convert(e: event.LinkCutTreeEvent) {
        this.operation = e.kind;
        switch (e.kind) {
            case 'AddNode':
                this.handleAddNode(e);
                break;
            case 'AddEdge':
                this.handleAddEdge(e);
                break;
            case 'ApplyValue':
                // FIXME
                break;
            case 'ToHeavy':
                this.handleToHeavy(e);
                break;
            case 'DeleteEdge':
                this.handleDeleteEdge(e);
                break;
            case 'Rotate':
                this.handleRotate(e);
                break;
            case 'Toggle':
                this.handleToggle(e);
                break;
            case 'Push':
                this.handlePush(e);
                break;
            default:
                throw new Error('aaaaa');
        }
    }

    copy() {
        const res: DrawGraph = { nodes: [], edges: [] };
        this.graph.nodes.forEach(e => res.nodes.push(
            { id: e.id, label: e.label }));
        this.graph.edges.forEach(e => res.edges.push(
            { from: e.from, to: e.to, dashes: e.dashes, width: e.width, color: e.color }));
        return res;
    }

    getNextGraphState(e: event.LinkCutTreeEvent) {
        const res = new GraphState(this.copy());
        res.convert(e);
        return res;
    }
}

const graphList: Array<GraphState> = [ new GraphState({ nodes: [], edges: [] }) ];

export {
    DrawNode,
    DrawEdge,
    DrawGraph,
    tree,
    GraphState,
    graphList,
};
