//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('JsxTagClosing', () => {
    it('should return closing tag for jsx', async () => {
        const closing = await getClosingTagInMockFile([
            'const q = hbs`',
            '<p>',
            '<b class="bold">',
            '</p>',
            '`'
        ].join('\n'), { line: 3, offset: 17 });
        expect(closing.newText).toBe("</b>")
    });
});

const command = 'jsxClosingTag'

async function getClosingTagInMockFile(contents, position) {
    const server = createServer();
    await openMockFile(server, mockFileName, contents);
    server.sendCommand(command, { file: mockFileName, ...position });
    await server.waitResponse(command);
    return server.close().then(() => getFirstResponseOfType(command, server).body);
}