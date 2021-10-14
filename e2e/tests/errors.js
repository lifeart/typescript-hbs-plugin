//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('Errors', () => {
    it('should return error for unknown css property', async () => {
        const errors = await getErrorsInMockFile([
            'let hbs = function(a) { return [a]};',
            'declare const html: any; const q = hbs`',
            '<style>',
            'a { colour: red; }',
            '</style>',
            '`'
        ].join('\n'));
        expect(errors.length).toBe(1);
        expect(errors[0].code).toBe(9999);
        expect(errors[0].text).toBe("Unknown property: 'colour'");
    });

    it('should not return errors for a basic css placeholder', async () => {
        const errors = await getErrorsInMockFile([
            'let hbs = function(a, b) { return [a,b]};',
            'declare const html: any; const q = hbs`',
            '<style>',
            'a { color: ${"red"}; }',
            '</style>',
            '`'
        ].join('\n'));
        expect(errors.length).toBe(0);
    });
});

async function getErrorsInMockFile(contents) {
    const server = createServer();
    await openMockFile(server, mockFileName, contents);
    server.sendCommand('semanticDiagnosticsSync', { file: mockFileName });
    await server.waitResponse('semanticDiagnosticsSync');
    return server.close().then(() => getFirstResponseOfType('semanticDiagnosticsSync', server).body);
}