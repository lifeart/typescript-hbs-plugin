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
        expect(quickInfo.documentation).toBe("Color of an element's text")
        expect(quickInfo.start.line).toBe(3);
        expect(quickInfo.start.offset).toBe(5);
        expect(quickInfo.end.line).toBe(3);
        expect(quickInfo.end.offset).toBe(15);

    });
});

function getQuickInfoInMockFile(contents, position) {
    const server = createServer();
    openMockFile(server, mockFileName, contents);
    server.sendCommand('quickinfo', { file: mockFileName, ...position });
    return server.close().then(() => getFirstResponseOfType('quickinfo', server).body);
}