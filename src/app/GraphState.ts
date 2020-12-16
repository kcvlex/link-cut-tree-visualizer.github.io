import { useState } from "react";
import Graph from "react-graph-vis";
import { LinkCutTreeNode, isNonNull, NullableNode } from './lct/LinkCutTreeNode';
import { LinkCutTree } from './lct/LinkCutTree';
import * as event from './EventType.ts';
import { EdgeType } from './lct/EdgeSet';

function isLeftNode(n: LinkCutTreeNode) {
    const p = n.parent!;
    return p.children[0] === n;
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

interface DrawNode {
    id: number;
    label: string;
};

interface DrawEdge {
    from: number;
    to: number;
    dashes: boolean;
    width: number;
};

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
    }

    private handleAddEdge(e: event.AddEdgeEvent) {
        const [ src, dst, heavy ] = e.edge;
        this.graph.edges = this.graph.edges.filter(e => (e.from !== src || e.to !== dst));
        this.graph.edges.push(
            { from: src, to: dst, dashes: !heavy, width: 3 });
    }

    private handleToHeavy(e: event.ToHeavyEvent) {
        const preR = e.preRight, curR = e.curRight;
        let removeIndex = -1;
        this.graph.edges.forEach((edge, idx) => {
            if (isNonNull(preR)) {
                if (edge.from === preR.id) edge.dashes = true;
            }
            if (isNonNull(curR)) {
                if (edge.from === curR.id) removeIndex = idx;
            }
        });
        if (removeIndex !== -1) this.graph.edges.splice(removeIndex, 1);
        if (isNonNull(curR)) {
            const p = curR.parent;
            if (isNonNull(p)) {
                this.graph.edges.push({ from: curR.id, to: p.id, dashes: false, width: 3 });
            }
        }

        this.operation += ` preR.id === ${preR === null ? -1 : preR.id}`;
        this.operation += ` curR.id === ${curR === null ? -1 : curR.id}`;
    }

    private removeEdge(item: EdgeType) {
        for (const i in this.graph.edges) {
            if (item[0] !== this.graph.edges[i].from) continue;
            if (item[1] !== this.graph.edges[i].to) continue;
            if (item[2] !== !this.graph.edges[i].dashes) continue;
            this.graph.edges.splice(parseInt(i), 1);
            break;
        }
    }

    private handleDeleteEdge(e: event.DeleteEdgeEvent) {
        this.removeEdge(e.edge);
    }

    private handleRotate(e: event.RotateEvent) {
        e.nodes.forEach(n => { this.graph.nodes[n.id].label = makeNodeLabel(n); });
        e.deleted.forEach(de => { this.removeEdge(de); });
        e.added.forEach(ae => { 
            this.graph.edges.push(
                { from: ae[0], to: ae[1], dashes: !ae[2], width: 3 });
        });
        this.operation += ` id = ${e.id}`;
    }

    private handlePush(e: event.PushEvent) {
        const ns = [ e.node, e.node.children[0], e.node.children[1] ];
        for (const e of ns) {
            if (isNonNull(e)) {
                this.graph.nodes[e.id].label = makeNodeLabel(e);
            }
        }
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
                // FIXME
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
            { from: e.from, to: e.to, dashes: e.dashes, width: e.width }));
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
