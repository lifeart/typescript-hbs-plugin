//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('CompletionEntryDetails', () => {
    it('should return html details for tag completion', () => {
        const server = createServer();
        openMockFile(server, mockFileName, 'const q = hbs`<`');
        server.sendCommand('completionEntryDetails', { file: mockFileName, offset: 17, line: 1, entryNames: ['a'] });

        return server.close().then(() => {
            const completionsResponse = getFirstResponseOfType('completionEntryDetails', server);
            expect(completionsResponse.success).toBe(true);
            expect(completionsResponse.body.length).toBe(1);

            const firstDetails = completionsResponse.body[0]
            expect(firstDetails.name).toBe('a');
            expect(firstDetails.documentation[0].text.indexOf('href') >= 0).toBe(true);
        });
    });

    it('should return css details for tag completion', () => {
        const server = createServer();
        openMockFile(server, mockFileName, 'const q = hbs`<style> .test {  }</style>`');
        server.send({ command: 'completionEntryDetails', arguments: { file: mockFileName, offset: 32, line: 1, entryNames: ['color'] } });

        return server.close().then(() => {
            const completionsResponse = getFirstResponseOfType('completionEntryDetails', server);
            expect(completionsResponse.success).toBe(true);
            expect(completionsResponse.body.length).toBe(1);

            const firstDetails = completionsResponse.body[0]
            expect(firstDetails.name).toBe('color');
            expect(firstDetails.documentation[0].text.indexOf('color') >= 0).toBe(true);
        });
    });
});
