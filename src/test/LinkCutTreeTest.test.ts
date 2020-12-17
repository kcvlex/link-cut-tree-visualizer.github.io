import * as toml from 'toml';
import * as fs from 'fs';
import LinkCutTreeTest from './LinkCutTreeTest';

const dirPath = 'src/test/library-checker-problems/datastructure/dynamic_tree_vertex_add_path_sum';

function readInfoToml(): string[] {
    const path = dirPath + '/info.toml';
    const data = fs.readFileSync(path, 'utf-8');
    const info = toml.parse(data);
    return info['tests'].map(
        (value) => {
            const filename = value['name'];
            const num = value['number'];
            const casename = filename.split('.')[0];
            const res: string[] = [];
            for (let i = 0; i < num; i++) {
                let casenum = Number(i).toString();
                while (casenum.length < 2) casenum = '0' + casenum;
                res.push(casename + '_' + casenum);
            }
            return res
        }).reduce((acc, val) => acc.concat(val), []);
}

type TestcaseInfo = [ string, string, string ];
function testcases(): TestcaseInfo[] {
    return readInfoToml().map(e => [ e, `${dirPath}/in/${e}.in`, `${dirPath}/out/${e}.out` ]); 
}

const cases = testcases();
let counter = 0;
for (const e of cases) {
    const casename = e[0];
    const input = e[1];
    const output = e[2];
    if (casename.includes('max')) break;
    if (casename.includes('random')) break;
    test(casename, async () => {
        const tester = new LinkCutTreeTest(input, output);
        const res = await tester.test();
        expect(res).toBe(true);
    }, 5000);
    //if (3 <= ++counter) break;
}
