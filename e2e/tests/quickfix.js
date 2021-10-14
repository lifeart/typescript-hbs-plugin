// @ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('QuickFix', () => {
    it('should return css quickfix for misspelled properties', async () => {
        const quickFix = await getQuickFixInMockFile([
            'const q = hbs`',
            '<style>',
            'a { coloor: green; }',
            '</style>',
            '`'
        ].join('\n'), {
            startLine: 3,
            startOffset: 8,
            endLine: 3,
            endOffset: 8,
            errorCodes: [9999]
        });
        expect(quickFix.length).toBe(3);
        expect(quickFix.find(fix => fix.description === 'Rename to \'color\'')).toBeTruthy();
    });

    it(
        'should not return css quickfix for correctly spelled properties',
        async () => {
            const quickFix = await getQuickFixInMockFile([
                'const q = hbs`',
                '<style>',
                'a { color: green; }',
                '</style>',
                '`'
            ].join('\n'), {
                startLine: 3,
                startOffset: 8,
                endLine: 3,
                endOffset: 8,
                errorCodes: [9999]
            });
            expect(quickFix.length).toBe(0);
        }
    );

    it('should not return css quickfix outside of <style>', async () => {
        const quickFix = await getQuickFixInMockFile([
            'const q = hbs`',
            '<style>',
            'a { color: green; }',
            '</style>',
            '<h1>coloor</h1>',
            '`'
        ].join('\n'), {
            startLine: 4,
            startOffset: 8,
            endLine: 4,
            endOffset: 8,
            errorCodes: [9999]
        });
        expect(quickFix.length).toBe(0);
    });
});

async function getQuickFixInMockFile(contents, position) {
    const server = createServer();
    await openMockFile(server, mockFileName, contents);
    server.sendCommand('getCodeFixes', { file: mockFileName, ...position });
    await server.waitResponse('getCodeFixes');
    return server.close().then(() => {
        const test = getFirstResponseOfType('getCodeFixes', server);
        return test.body;
    });
}
