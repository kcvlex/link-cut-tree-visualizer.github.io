import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Graph from "react-graph-vis";
import { LinkCutTreeNode, isNonNull, NullableNode } from './lct/LinkCutTreeNode';
import { LinkCutTree } from './lct/LinkCutTree';
import * as event from './EventType.ts';
import { DrawGraph, GraphState, tree, graphList } from './GraphState';
import { EdgeType } from './lct/EdgeSet';

interface GraphWithIndex {
    g: DrawGraph;
    index: number;
}

let gen: event.EventGenerator = null;

function App() {
    const [ currentNodeValue, setCurrentNode ] = useState('0');
    const [ currentSrc, setCurrentSrc ] = useState('0');
    const [ currentDst, setCurrentDst ] = useState('0');
    const [ currentExposeNode, setCurrentExposeNode ] = useState('0');

    const setCurrentNodeValue = (event) => {
        setCurrentNode(event.target.value);
    };

    const setCurrentSrcValue = (event) => {
        setCurrentSrc(event.target.value);
    };

    const setCurrentDstValue = (event) => {
        setCurrentDst(event.target.value);
    };

    const setCurrentExposeNodeValue = (event) => {
        setCurrentExposeNode(event.target.value);
    };

    const events = {
        select: (event) => {
            var { nodes, edges } = event;
            console.log(nodes);
            console.log(edges);
        },
    };
    
    const [ graph, setGraph ] = useState({ g: graphList[0], index: 0 });

    const clamp = (i: number, lb: number, ub: number) => {
        return Math.min(ub, Math.max(lb, i));
    };

    const changeIndex = (delta) => {
        setGraph(gi => {
            const cIndex = gi.index;
            const index = clamp(cIndex + delta, 0, graphList.length - 1);
            return { g: graphList[index], index };
        });
    }

    const updateGraph = (e: event.LinkCutTreeEvent): void => {
        setGraph(_ => {
            const latest = graphList[graphList.length - 1];
            const g = latest.getNextGraphState(e);
            const index = graphList.length;
            graphList.push(g);
            return { g, index };
        });
    };

    const consumeEventRec = (gen: event.EventGenerator): void => {
        const cur = gen.next();
        if (cur.done) return;
        console.log(cur.value.kind);
        updateGraph(cur.value);
        console.log(tree);
        setTimeout(consumeEventRec, 50, gen);
    };

    const consumeEventRecInit = (gen: event.EventGenerator): void => {
        consumeEventRec(gen);
    };

    const consumeEvent = (e: event.LinkCutTreeEvent) => {
        console.log(graph);
        console.log(graphList);
        updateGraph(e);
    };

    const appendNode = () => {
        const value = parseInt(currentExposeNode);
        if (isNaN(value)) {
            console.log("error");
            return;
        }
        consumeEvent(tree.appendNode(value));
    };

    const linkEvent = () => {
        const child = parseInt(currentSrc);
        const parent = parseInt(currentDst);
        if (isNaN(child) || isNaN(parent)) {
            console.log("error");
            return;
        }
        consumeEventRecInit(tree.link(child, parent));
    };

    const exposeEvent = () => {
        const id = parseInt(currentExposeNode);
        if (isNaN(id)) {
            console.log("error");
            return;
        }
        // gen = tree.expose(id);
        consumeEventRecInit(tree.expose(id));
    };

    const consumeGen = () => {
        if (gen === null) return;
        const cur = gen.next();
        if (cur.done) {
            gen = null;
            return;
        }
        consumeEvent(cur.value);
    };

    // initialize(0, false, consumeEvent, consumeEventRecInit);

    return (
      <div>
        <div>
          <button onClick={appendNode}> Add Node </button>
        </div>
        <div>
          <input type='text' value={currentSrc} onChange={setCurrentSrcValue} />
          <input type='text' value={currentDst} onChange={setCurrentDstValue} />
          <button onClick={linkEvent}> Link </button>
        </div>
        <div>
          <input type='text' value={currentExposeNode} onChange={setCurrentExposeNodeValue} />
          <button onClick={exposeEvent}> Expose </button>
        </div>
        <div>
          {graph.g.operation}
        </div>
        <div>
          <button onClick={() => changeIndex(-1)}> &laquo; </button>
          <button onClick={() => changeIndex(+1)}> &raquo; </button>
        </div>
        <Graph
          graph={graph.g.graph}
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
