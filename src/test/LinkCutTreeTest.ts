import { LinkCutTree } from '../app/lct/LinkCutTree';
import { EventGenerator } from '../app/EventType';
import * as fs from 'fs';
import * as readline from 'readline';

type InputType = 'Init' | 'NodeValues' | 'Edges' | 'Queries';

class LinkCutTreeTest {
    private tree: LinkCutTree;
    private inputStream: readline.Interface;
    private readonly results: number[] = [];

    constructor(private readonly inputFilePath: string,
                private readonly answerFilePath: string)
    {
        this.tree = new LinkCutTree(0);
    }

    private consumeGenerator(gen: EventGenerator) {
        while (true) {
            const cur = gen.next();
            if (cur.done) break;
        }
    }

    private async execAll() {
        const inputStream = readline.createInterface({
            input: fs.createReadStream(this.inputFilePath),
            crlfDelay: Infinity,
        });
        let count = 0;
        let curType: InputType = 'Init';
        let N: number = 0;
        let Q: number = 0;
        for await (const line of inputStream) {
            switch (curType) {
                case 'Init':
                    [ N, Q ] = line.split(' ').map(e => parseInt(e));
                    curType = 'NodeValues';
                    break;
                case 'NodeValues':
                    const lis = line.split(' ')
                                    .forEach(e => this.tree.appendNode(parseInt(e)));
                    curType = 'Edges';
                    break;
                case 'Edges':
                    const [ u, v ] = line.split(' ').map(e => parseInt(e));
                    this.consumeGenerator(this.tree.link(u, v));
                    count++;
                    if (count === N - 1) {
                        count = 0;
                        curType = 'Queries';
                    }
                    break;
                case 'Queries':
                    const query = line.split(' ').map(e => parseInt(e));
                    if (query[0] === 0) {
                        const [ t, u, v, w, x ] = query;
                        this.consumeGenerator(this.tree.evert(v));
                        this.consumeGenerator(this.tree.cut(u));
                        this.consumeGenerator(this.tree.link(w, x));
                    } else if (query[0] === 1) {
                        const [ t, p, x ] = query;
                        this.consumeGenerator(this.tree.addVertex(p, x));
                    } else if (query[0] === 2) {
                        const [ t, u, v ] = query;
                        this.consumeGenerator(this.tree.evert(u));
                        this.consumeGenerator(this.tree.expose(v));
                        this.results.push(this.tree.getSum(v));
                    } else {
                        throw new Error('a');
                    }
                    break;
            }
        }
    }

    private async check() {
        let index = 0;
        let res = true;
        const answerStream = readline.createInterface({
            input: fs.createReadStream(this.answerFilePath),
            crlfDelay: Infinity,
        });
        console.log(this.results);
        for await (const line of answerStream) {
            const ans = parseInt(line);
            res = (res && (this.results[index] === ans));
            index++;
        }
        return res;
    }

    async test() {
        await this.execAll();
        return await this.check();
    }
}

export default LinkCutTreeTest;
