//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('QuickInfo', () => {
    it('should return css quick info in styled blocks', async () => {
        const quickInfo = await getQuickInfoInMockFile([
            'const q = hbs`',
            '<style>',
            'a { color: red; }',
            '</style>',
            '`'
        ].join('\n'), { line: 3, offset: 6 });
        expect(quickInfo.documentation).toContain("Sets the color of an element's text")
        expect(quickInfo.start.line).toBe(3);
        expect(quickInfo.start.offset).toBe(5);
        expect(quickInfo.end.line).toBe(3);
        expect(quickInfo.end.offset).toBe(15);

    });
});

async function getQuickInfoInMockFile(contents, position) {
    const server = createServer();
    await openMockFile(server, mockFileName, contents);
    server.sendCommand('quickinfo', { file: mockFileName, ...position });
    await server.waitResponse('quickinfo');
    return server.close().then(() => getFirstResponseOfType('quickinfo', server).body);
}