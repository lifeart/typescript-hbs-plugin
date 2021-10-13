//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('SignatureHelp', () => {
    it('should not return signature help of outer function', () => {
        const server = createServer();
        openMockFile(server, mockFileName, 'const q = hbs`<`');
        server.sendCommand('signatureHelp', { file: mockFileName, offset: 17, line: 1 });

        return server.close().then(() => {
            const response = getFirstResponseOfType('signatureHelp', server).body;
            expect(response).toBe(undefined);
        });
    });
});
