import { LinkCutTreeNode, isNonNull, NullableNode } from './LinkCutTreeNode';
import * as event from '../EventType';

class LinkCutTree {
    public readonly nodes: LinkCutTreeNode[];

    constructor(n: number) {
        this.nodes = new Array(n);
        for (let i = 0; i < n; i++) this.nodes[i] = new LinkCutTreeNode(0, i);
    }

    add(value: number): event.LinkCutTreeEvent {
        const sz = this.nodes.length;
        this.nodes.push(new LinkCutTreeNode(value, sz));
        return {
            kind: 'AddNode',
            node: this.nodes[sz],
        };
    }

    *expose(index: number): event.EventGenerator {
        let r: NullableNode = null;
        let cur: NullableNode = this.nodes[index];
        while (isNonNull(cur)) {
            yield* cur.splay();
            const tmp = cur.children[1];
            cur.children[1] = r;
            cur.update();
            yield {
                kind: 'ToHeavy',
                preRight: tmp,
                curRight: r,
            };
            r = cur;
            cur = cur.parent;
        }
    }

    *evert(index: number): event.EventGenerator {
        yield* this.expose(index);
        const n = this.nodes[index];
        yield n.toggle();
        yield n.push();
    }

    *link(cIndex: number, pIndex: number): event.EventGenerator {
        yield* this.evert(cIndex);
        yield* this.expose(cIndex);
        yield* this.expose(pIndex);
        const c = this.nodes[cIndex], p = this.nodes[pIndex];
        c.parent = p;
        p.children[1] = c;
        p.update();
        yield {
            kind: 'AddEdge',
            edge: [ c.id, p.id, true ],
        };
    }

    *cut(index: number): event.EventGenerator {
        yield* this.expose(index);
        const p = this.nodes[index];
        const l = p.children[0];
        if (isNonNull(l)) {
            p.children[0] = null;
            p.update();
            l.parent = null;
            yield {
                kind: 'DeleteEdge',
                edge: [ l.id, p.id, true ],
            };
        } else {
            throw Error(`${index} is root node`);
        }
    }

    *applyPath(index: number, value: number): event.EventGenerator {
        yield* this.expose(index);
        const n = this.nodes[index];
        n.applyPath(value);
        yield {
            kind: 'ApplyValue',
            node: n,
            value,
        };
        yield n.push();
    }
}

export { LinkCutTree }
