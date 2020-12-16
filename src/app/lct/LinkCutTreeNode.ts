import * as event from '../EventType';
import { EdgeType, EdgeSet } from './EdgeSet';

type NullableNode = LinkCutTreeNode | null;

let counter = 0;
const lis: number[] = [];

function isNonNull(n: NullableNode): n is LinkCutTreeNode {
    return n !== null;
}

class LinkCutTreeNode {
    private sz: number = 1;
    public sum: number = 0;
    public parent: NullableNode;
    public children: NullableNode[];
    public rev: boolean = false;
    public lazyValue: number = 0;

    constructor(public value: number, public readonly id: number) {
        this.parent = null;
        this.sum = value;
        this.children = new Array(2);
        this.children[0] = this.children[1] = null;
    }

    isRoot() {
        if (isNonNull(this.parent)) {
            if (this.parent.children[0] === this) return false;
            if (this.parent.children[1] === this) return false;
        }
        return true;
    }

    private swapChildren() {
        const ch0 = this.children[0];
        const ch1 = this.children[1];
        this.children[1] = ch0;
        this.children[0] = ch1;
    }

    toggle(): event.LinkCutTreeEvent {
        this.swapChildren();
        this.rev = !this.rev;
        return { 
            kind: 'Toggle', 
            node: this 
        };
    }

    addVertex(n: number) {
        this.value += n;
        this.update();
    }

    addPath(n: number) {
        this.value += n;
        this.sum += n * this.sz;
    }

    push(): event.LinkCutTreeEvent {
        for (const ch of this.children) {
            if (isNonNull(ch)) {
                ch.addPath(this.lazyValue);
                if (this.rev) ch.toggle();
            }
        }
        this.lazyValue = 0;
        this.rev = false;
        return {
            kind: 'Push',
            node: this,
        };
    }

    update(): void {
        const updateAux = (n: LinkCutTreeNode) => {
            this.sz += n.sz;
            this.sum += n.sum;
        };
        
        this.sz = 1;
        this.sum = this.value;
        this.children.forEach(ch => {
            if (isNonNull(ch)) updateAux(ch);
        });
    }

    // 0 if ccw
    private rotate(dir: boolean, check: boolean = false): event.LinkCutTreeEvent {
        if (check && (this.children[1] !== null)) throw new Error();
        const nodeSet = new Set<LinkCutTreeNode>();
        const preSet = new EdgeSet();
        const postSet = new EdgeSet();

        const addEdge = (set: EdgeSet, n: NullableNode) => {
            if (isNonNull(n)) {
                nodeSet.add(n);
                n.children.forEach(ch => {
                    if (isNonNull(ch)) {
                        set.add([ ch.id, n.id, true ]);
                        nodeSet.add(ch);
                    }
                });
                const p = n.parent;
                if (isNonNull(p)) {
                    nodeSet.add(p);
                    const heavy = (p.children[0] === n || p.children[1] === n);
                    set.add([ n.id, p.id, heavy ]);
                }
            }
        };

        if (isNonNull(this.parent)) {
            const p = this.parent;
            const pp = this.parent.parent;
            const popopo = (p.children[1] === null);

            addEdge(preSet, this);
            addEdge(preSet, p);
            addEdge(preSet, pp);

            const index = dir ? 1 : 0;
            const ch = this.children[index];

            p.children[1 - index] = ch;
            if (isNonNull(ch)) ch.parent = p;

            this.children[index] = p;
            p.parent = this;

            this.parent = pp;

            p.update();
            this.update();

            if (isNonNull(pp)) {
                if (pp.children[0] === p) {
                    pp.children[0] = this;
                } else if (pp.children[1] === p) {
                    pp.children[1] = this;
                }
                pp.update();
            }

            addEdge(postSet, this);
            addEdge(postSet, p);
            addEdge(postSet, pp);
            if (popopo && !dir && (this.children[1] !== null)) throw new Error();
        } else {
            throw new Error("Don't rotate root node");
        }

        if (check && this.children[1] !== null) throw new Error();

        const addedEdges = postSet.diff(preSet);
        const deletedEdges = preSet.diff(postSet);
        return {
            kind: 'Rotate',
            id: this.id,
            nodes: Array.from(nodeSet.values()),
            added: addedEdges.toArray(),
            deleted: deletedEdges.toArray(),
        };
    }

    *splay(check: boolean = false): event.EventGenerator {
        this.push();
        while (!this.isRoot()) {
            const p = this.parent!;
            if (p.isRoot()) {
                yield p.push();
                yield this.push();
                if (p.children[0] === this) {
                    if (check && (this.children[1] !== null)) throw new Error();
                    yield this.rotate(true);
                    if (check && (this.children[1] !== null)) throw new Error();
                } else if (p.children[1] === this) {
                    if (check && (this.children[1] !== null)) throw new Error();
                    yield this.rotate(false);
                    if (check && (this.children[1] !== null)) throw new Error();
                } else {
                    throw Error("Unexcept");
                }
            } else {
                const pp = p.parent!;
                yield pp.push();
                yield p.push();
                yield this.push();
                const dir1 = (pp.children[0] === p);
                const dir2 = (p.children[0] === this);
                if (dir1 === dir2) {
                    if (check && (this.children[1] !== null)) throw new Error();
                    yield p.rotate(dir1);
                    if (check && (this.children[1] !== null)) throw new Error();
                    yield this.rotate(dir1, check);
                    if (check && (this.children[1] !== null)) throw new Error();
                } else {
                    if (check && (this.children[1] !== null)) throw new Error();
                    yield this.rotate(dir2, check);
                    if (check && (this.children[1] !== null)) throw new Error();
                    yield this.rotate(dir1, check);
                    if (check && (this.children[1] !== null)) throw new Error();
                }
            }
        }
    }
}

export { LinkCutTreeNode, NullableNode, isNonNull }
