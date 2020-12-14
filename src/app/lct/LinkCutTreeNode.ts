import * as event from '../EventType';
import { EdgeType, EdgeSet } from './EdgeSet';

type NullableNode = LinkCutTreeNode | null;

function isNonNull(n: NullableNode): n is LinkCutTreeNode {
    return n !== null;
}

class LinkCutTreeNode {
    private sz: number = 0;
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

    private update_aux(n: LinkCutTreeNode) {
        this.sz += n.sz;
        this.sum += n.sum;
    }

    private swapChildren() {
        [ this.children[1], this.children[0] ] = this.children;
    }

    toggle(): event.LinkCutTreeEvent {
        this.swapChildren();
        this.rev = !this.rev;
        return { 
            kind: 'Toggle', 
            node: this 
        };
    }

    applyPath(n: number) {
        this.value += n;
        this.sum += n * this.sz;
    }

    push(): event.LinkCutTreeEvent {
        for (const ch of this.children) {
            if (isNonNull(ch)) {
                ch.applyPath(this.lazyValue);
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
        this.sz = 1;
        this.sum = this.value;
        if (isNonNull(this.children[0])) {
            this.update_aux(this.children[0]);
        }
        if (isNonNull(this.children[1])) {
            this.update_aux(this.children[1]);
        }
    }

    // 0 if ccw
    private rotate(dir: boolean): event.LinkCutTreeEvent {
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
            }
        };

        if (isNonNull(this.parent)) {
            const p = this.parent, pp = this.parent.parent;

            addEdge(preSet, this);
            addEdge(preSet, p);
            addEdge(preSet, pp);

            const index = Number(dir);
            const ch = this.children[index];
            p.children[1 - index] = ch;
            if (isNonNull(ch)) ch.parent = p;
            this.children[index] = p;
            p.parent = this;
            this.parent = pp;
            p.update();
            this.update();
            if (isNonNull(pp)) {
                if (pp.children[0] == p) pp.children[0] = this;
                if (pp.children[1] == p) pp.children[1] = this;
                pp.update();
            }

            addEdge(postSet, this);
            addEdge(postSet, p);
            addEdge(postSet, pp);
        } else {
            throw new Error("Don't rotate root node");
        }

        const addedEdges = postSet.diff(preSet);
        const deletedEdges = preSet.diff(postSet);
        return {
            kind: 'Rotate',
            nodes: Array.from(nodeSet.values()),
            added: addedEdges.toArray(),
            deleted: deletedEdges.toArray(),
        };
    }

    *splay(): event.EventGenerator {
        while (!this.isRoot()) {
            const p = this.parent!;
            if (p.isRoot()) {
                yield p.push();
                yield this.push();
                if (p.children[0] == this) yield this.rotate(true);
                if (p.children[1] == this) yield this.rotate(false);
            } else {
                const pp = p.parent!;
                yield pp.push();
                yield p.push();
                yield this.push();
                const dir1 = (pp.children[0] == p);
                const dir2 = (p.children[0] == this);
                if (dir1 == dir2) {
                    yield p.rotate(!dir1);
                    yield this.rotate(!dir1);
                } else {
                    yield this.rotate(!dir2);
                    yield this.rotate(dir2);
                }
            }
        }
    }
}

export { LinkCutTreeNode, NullableNode, isNonNull }
