//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('Errors', () => {
    it('should return error for unknown css property', async () => {
        const errors = await getErrorsInMockFile([
            'declare const html: any; const q = hbs`',
            '<style>',
            'a { colour: red; }',
            '</style>',
            '`'
        ].join('\n'));
        expect(errors.length).toBe(1);
        const [error] = errors;
        expect(error.code).toBe(9999);
        expect(error.text).toBe("Unknown property: 'colour'");
    });

    it('should not return errors for a basic css placeholder', async () => {
        const errors = await getErrorsInMockFile([
            'declare const html: any; const q = hbs`',
            '<style>',
            'a { color: ${"red"}; }',
            '</style>',
            '`'
        ].join('\n'));
        expect(errors.length).toBe(0);

    });
});

function getErrorsInMockFile(contents) {
    const server = createServer();
    openMockFile(server, mockFileName, contents);
    server.sendCommand('semanticDiagnosticsSync', { file: mockFileName });
    return server.close().then(() => getFirstResponseOfType('semanticDiagnosticsSync', server).body);
}