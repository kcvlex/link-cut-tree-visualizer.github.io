import { LinkCutTree } from './LinkCutTree';
import { LinkCutTreeNode } from './LinkCutTreeNode';

type EdgeStatus = 'Left' | 'Right' | 'Light';
type EdgeType = [ number, number, EdgeStatus ];

function edge2str(edge: EdgeType) {
    return edge.map(e => e + '').join(':');
}

function str2edge(s: string): EdgeType {
    const lis = s.split(':');
    if (lis.length === 3) {
        const src = parseInt(lis[0]);
        const dst = parseInt(lis[1]);
        const status = lis[2] as EdgeStatus;
        return [ src, dst, status ];
    } else {
        throw new Error("Invalid string");
    }
}

// Bad class.
class EdgeSet {
    private readonly set = new Set<string>();

    constructor() {
    }

    add(e: EdgeType) {
        this.set.add(edge2str(e));
    }

    delete(e: EdgeType) {
        return this.set.delete(edge2str(e));
    }

    has(e: EdgeType) {
        return this.set.has(edge2str(e));
    }

    values() {
        return this.set.values();
    }

    copy() {
        const ret = new EdgeSet();
        this.set.forEach(e => ret.set.add(e));
        return ret;
    }

    diff(rhs: EdgeSet) {
        const ret = this.copy();
        rhs.set.forEach(e => ret.set.delete(e));
        return ret;
    }

    toArray() {
        return Array.from(this.set.values())
                    .map(s => str2edge(s));
    }
}


export { EdgeType, EdgeSet, EdgeStatus }
