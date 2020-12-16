import { LinkCutTreeNode, isNonNull, NullableNode } from './LinkCutTreeNode';
import * as event from '../EventType';

class LinkCutTree {
    public readonly nodes: LinkCutTreeNode[];

    constructor(n: number) {
        this.nodes = new Array(n);
        for (let i = 0; i < n; i++) this.nodes[i] = new LinkCutTreeNode(0, i);
    }

    appendNode(value: number): event.LinkCutTreeEvent {
        const sz = this.nodes.length;
        this.nodes.push(new LinkCutTreeNode(value, sz));
        return {
            kind: 'AddNode',
            node: this.nodes[sz],
        };
    }

    getSum(index: number) {
        return this.nodes[index].sum;
    }

    *addVertex(index: number, value: number): event.EventGenerator {
        yield* this.expose(index);
        this.nodes[index].addVertex(value);
        this.nodes[index].push();
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
        {
            let tmp = this.nodes[index];
            while (true) {
                const p = tmp.parent;
                if (!isNonNull(p)) break;
                if (p.children[0] === tmp) {
                    throw new Error("a");
                }
                if (p.children[1] !== tmp) {
                    throw new Error("a");
                }
                tmp = p;
            }
        }
        if (this.nodes[index].children[1] !== null) throw new Error();
        const gen = this.nodes[index].splay(true);
        while (true) {
            const cur = gen.next();
            if (cur.done) break;
            const val = cur.value;
            console.log(val.id, val.added, val.deleted);
        }
        if (isNonNull(this.nodes[index].children[1])) {
            console.log(this.nodes[index]);
            throw new Error("hage");
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
        if (isNonNull(c.parent)) throw new Error("po");
        if (isNonNull(p.children[1])) throw new Error();
        if (!c.isRoot()) throw new Error();
        if (!p.isRoot()) throw new Error();
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

    *addPath(index: number, value: number): event.EventGenerator {
        yield* this.expose(index);
        const n = this.nodes[index];
        n.addPath(value);
        yield {
            kind: 'ApplyValue',
            node: n,
            value,
        };
        n.update();
        yield n.push();
    }
}

export { LinkCutTree }
