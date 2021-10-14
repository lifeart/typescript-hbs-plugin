//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('References', () => {
    it('should return tag matches as references', async () => {
        const { refs } = await getReferencesForMockFile([
            'const q = hbs`',
            '<div>',
            '<div>abc</div>',
            '</div>',
            '`'
        ].join('\n'), { line: 2, offset: 2 });

        expect(refs.length).toBe(2);

        const [ref1, ref2] = refs;
        assertPosition(ref1.start, 2, 2);
        assertPosition(ref1.end, 2, 5);

        assertPosition(ref2.start, 4, 3);
        assertPosition(ref2.end, 4, 6);
    });
});

async function getReferencesForMockFile(contents, position) {
    const server = createServer();
    await openMockFile(server, mockFileName, contents);
    server.sendCommand('references', { file: mockFileName, ...position });
    await server.waitResponse('references');
    return server.close().then(() => getFirstResponseOfType('references', server).body);
}

function assertPosition(pos, line, offset) {
    expect(pos.line).toBe(line);
    expect(pos.offset).toBe(offset);
}
