//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('OutliningSpans', () => {
    it('should return basic html outlining spans', async () => {
        const spans = await getOutlingSpansForMockFile([
            'const q = hbs`',
            '<div>',
            '    <img src="cat.gif" />',
            '</div>',
            '<div>',
            '    <img src="cat2.gif" />',
            '</div>',
            '`'
        ].join('\n'));

        expect(spans.length).toBe(3);

        const [span3, span1, span2] = spans;


        assertPosition(span3.textSpan.start, 1, 14);
        assertPosition(span3.textSpan.end, 8, 2);

        assertPosition(span1.textSpan.start, 2, 1);
        assertPosition(span1.textSpan.end, 3, 1);

        assertPosition(span2.textSpan.start, 5, 1);
        assertPosition(span2.textSpan.end, 6, 1);


    });
});

async function getOutlingSpansForMockFile(contents) {
    const server = createServer();
    await openMockFile(server, mockFileName, contents);
    server.sendCommand('getOutliningSpans', { file: mockFileName });
    await server.waitResponse('getOutliningSpans');
    return server.close().then(() => getFirstResponseOfType('getOutliningSpans', server).body);
}

function assertPosition(pos, line, offset) {
    expect(`line:${pos.line}, offset:${pos.offset}`).toBe(`line:${line}, offset:${offset}`);
}