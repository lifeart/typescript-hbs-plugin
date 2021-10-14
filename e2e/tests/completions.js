//@ts-check
const path = require('path');
const createServer = require('../server-fixture');
const { openMockFile, getFirstResponseOfType } = require('./_helpers');

const mockFileName = path.join(__dirname, '..', 'project-fixture', 'main.ts');

describe('HTML Completions', () => {
    it('should return html tag completions for hbs tag', async () => {
        const completionsResponse = await makeSingleCompletionsRequest('const q = hbs`<`', { offset: 15, line: 1 });
        expect(completionsResponse.body.some(item => item.name === 'main')).toBe(true);
        expect(completionsResponse.body.some(item => item.name === 'button')).toBe(true);
    });

    it('should return html property completions', async () => {
        const completionsResponse = await makeSingleCompletionsRequest('const q = hbs`<button `', { line: 1, offset: 22 });
        expect(completionsResponse.body.some(item => item.name === 'onclick')).toBe(true);
        expect(completionsResponse.body.some(item => item.name === 'title')).toBe(true);
    });

    it(
        'should not return html completions for html tag inside of <style>',
        async () => {
            const completionsResponse = await makeSingleCompletionsRequest('const q = hbs`<style> .test {  }</style>`', { offset: 31, line: 1 });
            expect(completionsResponse.body.some(item => item.name === 'div')).toBe(false);
            expect(completionsResponse.body.some(item => item.name === 'main')).toBe(false);
        }
    );

    it(
        'should not return html completions for raw tag inside of <style>',
        async () => {
            const completionsResponse = await makeSingleCompletionsRequest('const q = hbs`<style> .test {  }</style>`', { offset: 30, line: 1 });
            expect(completionsResponse.body.some(item => item.name === 'div')).toBe(false);
            expect(completionsResponse.body.some(item => item.name === 'main')).toBe(false);
        }
    );

    it('should return edit that closes > #25', async () => {
        const completionsResponse = await makeSingleCompletionsRequest('const q = hbs`<a></`', { offset: 19, line: 1 });
        const entry = completionsResponse.body.find(item => item.name === '/a');
        expect(entry).toBeTruthy();
        expect(entry.insertText).toBe('/a>');
    });
});

describe('CSS Completions', () => {
    it('should return css completions for hbs tag within <style>', async () => {
        const completionsResponse = await makeSingleCompletionsRequest('const q = hbs`<style> .test {  }</style>`', { offset: 31, line: 1 });
        expect(completionsResponse.body.some(item => item.name === 'display')).toBe(true);
        expect(completionsResponse.body.some(item => item.name === 'position')).toBe(true);
        expect(completionsResponse.body.some(item => item.name === 'color')).toBe(true);
    });

    it(
        'should return css property completions for html tag within <style>',
        async () => {
            const completionsResponse = await makeSingleCompletionsRequest('const q = hbs`<style> .test { display:  }</style>`', { offset: 39, line: 1 });
            expect(completionsResponse.body.some(item => item.name === 'block')).toBe(true);
            expect(completionsResponse.body.some(item => item.name === 'flex')).toBe(true);
            expect(completionsResponse.body.some(item => item.name === 'grid')).toBe(true);
        }
    );

    it(
        'should return css property completions for hbs tag within <style>',
        async () => {
            const completionsResponse = await makeSingleCompletionsRequest('const q = hbs`<style> .test { display:  }</style>`', { offset: 39, line: 1 });
            expect(completionsResponse.body.some(item => item.name === 'block')).toBe(true);
            expect(completionsResponse.body.some(item => item.name === 'flex')).toBe(true);
            expect(completionsResponse.body.some(item => item.name === 'grid')).toBe(true);
        }
    );

    it(
        'should not return css completions for hbs tag outside of <style>',
        async () => {
            const completionsResponse = await makeSingleCompletionsRequest('const q = hbs` `', { offset: 15, line: 1 });
            expect(completionsResponse.body.some(item => item.name === 'display')).toBe(false);
            expect(completionsResponse.body.some(item => item.name === 'position')).toBe(false);
            expect(completionsResponse.body.some(item => item.name === 'color')).toBe(false);
        }
    );

});

async function makeSingleCompletionsRequest(body, position) {
    const server = createServer();
    await openMockFile(server, mockFileName, body);
    server.sendCommand('completions', { file: mockFileName, line: position.line, offset: position.offset });
    await server.waitResponse('completions');
    await server.close();
    const completionsResponse = getFirstResponseOfType('completions', server);
    expect(completionsResponse.success).toBe(true);
    return completionsResponse;
}

