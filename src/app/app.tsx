import React, { useState } from "react";
import ReactDOM from "react-dom";
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
    return `ID = ${n.id}`;
    return `ID = ${n.id}\n` +
        `value = ${n.value}\n` +
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

function removeEdge(edges: DrawEdge[], item: EdgeType) {
    for (const i in edges) {
        if (item[0] !== edges[i].from) continue;
        if (item[1] !== edges[i].to) continue;
        edges.splice(parseInt(i), 1);
        break;
    }
}

function copyGraph(original: DrawGraph) {
    const res: DrawGraph = { nodes: [], edges: [] };
    original.nodes.forEach(e => res.nodes.push({ id: e.id, label: e.label }));
    original.edges.forEach(e => res.edges.push({ from: e.from, to: e.to, dashes: e.dashes, width: e.width }));
    return res;
}

function convertGraph(graph: DrawGraph, e: event.LinkCutTreeEvent): DrawGraph {
    switch (e.kind) {
        case 'AddNode':
            const n = e.node;
            graph.nodes.push({ id: n.id, label: makeNodeLabel(n) });
            return graph;
        case 'AddEdge':
            const [ src, dst, heavy ] = e.edge;
            graph.edges = graph.edges.filter(e => (e.from !== src || e.to !== dst));
            graph.edges.push({ from: src, to: dst, dashes: !heavy, width: 3 });
            return graph;
        case 'ApplyValue':
            graph.nodes[e.node.id].label = makeNodeLabel(e.node);
            return graph;
        case 'ToHeavy':
            const preR = e.preRight, curR = e.curRight;
            graph.edges.forEach(edge => {
                if (isNonNull(preR)) {
                    if (edge.from === preR.id) edge.dashes = true;
                }
                if (isNonNull(curR)) {
                    if (edge.from === curR.id) edge.dashes = false;
                }
                console.log(edge);
            });
            return graph;
        case 'DeleteEdge':
            removeEdge(graph.edges, e.edge);
            return graph;
        case 'Rotate':
            e.nodes.forEach(n => { graph.nodes[n.id].label = makeNodeLabel(n); });
            e.deleted.forEach(de => { removeEdge(graph.edges, de); });
            e.added.forEach(ae => { graph.edges.push({ from: ae[0], to: ae[1], dashes: !ae[2], width: 3 }); });
            return graph;
        case 'Toggle': return graph; // FIXME
        case 'Push':
            const ns = [ e.node, e.node.children[0], e.node.children[1] ];
            for (const e of ns) {
                if (isNonNull(e)) {
                    graph.nodes[e.id].label = makeNodeLabel(e);
                }
            }
            return graph;
        default:
            throw new Error('aaaaa');
    }
}
const tree = new LinkCutTree(0);

const initialGraph: DrawGraph = {
    nodes: [],
    edges: [],
};


function App() {
    const [ currentNode, setCurrentNode ] = useState(0);
    const [ currentSrc, setCurrentSrc ] = useState(0);
    const [ currentDst, setCurrentDst ] = useState(0);

    const setCurrentNodeValue = (event) => {
        setCurrentNode(parseInt(event.target.value));
    };

    const setCurrentSrcValue = (event) => {
        setCurrentSrc(parseInt(event.target.value));
    };

    const setCurrentDstValue = (event) => {
        setCurrentDst(parseInt(event.target.value));
    };

    const events = {
        select: (event) => {
            var { nodes, edges } = event;
            console.log(nodes);
            console.log(edges);
        },
    };
    // const initialGraph: DrawGraph = { nodes: [], edges: [] };
    const [ graph, setGraph ] = useState(initialGraph);

    const consumeEventRec = (gen: event.EventGenerator): void => {
        const cur = gen.next();
        if (cur.done) return;
        console.log(cur.value.kind);
        setGraph(pg => convertGraph(copyGraph(pg), cur.value));
        console.log(tree);
        setTimeout(consumeEventRec, 100, gen);
    };

    const consumeEvent = (e: event.LinkCutTreeEvent) => {
        setGraph(pg => convertGraph(copyGraph(pg), e));
    };

    return (
      <div>
        <input type='text' value={currentNode} onChange={setCurrentNodeValue} />
        <button onClick={() => consumeEvent(tree.add(currentNode))}> Add Node </button>
        <br/>
        <input type='text' value={currentSrc} onChange={setCurrentSrcValue} />
        <input type='text' value={currentDst} onChange={setCurrentDstValue} />
        <button onClick={() => consumeEventRec(tree.link(currentSrc, currentDst))}> Link </button>
        <Graph
          graph={graph}
          events={events}
          getNetwork={network => {
              console.log(network);
          }}
        />
      </div>
    );
}


const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
