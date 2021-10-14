/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// Derived from https://github.com/Microsoft/vscode/blob/master/extensions/html-language-features/server/src/test/embedded.test.ts

const embeddedSupport = require('../../lib/embeddedSupport');
const vscodeTypes = require('vscode-languageserver-types');
const vscodeHtmlService = require('vscode-html-languageservice');

describe('Embedded Language Identification', () => {
    test('<style>', () => {
        assertLanguageId('const q = hbs`|<html><style>foo { }</style></html>`', 'handlebars');
        assertLanguageId('const q = hbs`<html|><style>foo { }</style></html>`', 'handlebars');
        assertLanguageId('const q = hbs`<html><st|yle>foo { }</style></html>`', 'handlebars');
        assertLanguageId('const q = hbs`<html><style>|foo { }</style></html>`', 'css');
        assertLanguageId('const q = hbs`<html><style>foo| { }</style></html>`', 'css');
        assertLanguageId('const q = hbs`<html><style>foo { }|</style></html>`', 'css');
        assertLanguageId('const q = hbs`<html><style>foo { }</sty|le></html>`', 'handlebars');
    });

    test('<style> - Incomplete HTML', () => {
        assertLanguageId('const q = hbs`|<html><style>foo { }`', 'handlebars');
        assertLanguageId('const q = hbs`<html><style>fo|o { }`', 'css');
        assertLanguageId('const q = hbs`<html><style>foo { }|`', 'css');
    });


    test('<script> - Incomplete HTML', () => {
        assertLanguageId('const q = hbs`|<html><script>foo { }`', 'handlebars');
        assertLanguageId('const q = hbs`<html><script>console.|`', 'javascript');
        assertLanguageId('const q = hbs`<html><script>console.log(|)`', 'javascript');
    });

    test('CSS in HTML attributes', () => {
        assertLanguageId('const q = hbs`<div id="xy" |style="color: red"/>`', 'handlebars');
        assertLanguageId('const q = hbs`<div id="xy" styl|e="color: red"/>`', 'handlebars');
        assertLanguageId('const q = hbs`<div id="xy" style=|"color: red"/>`', 'handlebars');
        assertLanguageId('const q = hbs`<div id="xy" style="|color: red"/>`', 'css');
        assertLanguageId('const q = hbs`<div id="xy" style="color|: red"/>`', 'css');
        assertLanguageId('const q = hbs`<div id="xy" style="color: red|"/>`', 'css');
        assertLanguageId('const q = hbs`<div id="xy" style="color: red"|/>`', 'handlebars');
        assertLanguageId('const q = hbs`<div id="xy" style=\'color: r|ed\'/>`', 'css');
        assertLanguageId('const q = hbs`<div id="xy" style|=color:red/>`', 'handlebars');
        assertLanguageId('const q = hbs`<div id="xy" style=|color:red/>`', 'css');
        assertLanguageId('const q = hbs`<div id="xy" style=color:r|ed/>`', 'css');
        assertLanguageId('const q = hbs`<div id="xy" style=color:red|/>`', 'css');
        assertLanguageId('const q = hbs`<div id="xy" style=color:red/|>`', 'handlebars');
    });
});

describe('Embedded Document Content', () => {
    test('Substituted placeholder-like values in CSS', () => {
        assertEmbeddedDocumentCssContent(
            'hbs`<style>xxxxxxxxxxxxxxxxxx</style>`',
            '                                      '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<style>   xxxxxxxxxxx  </style>`',
            '                                    '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<style>xxxxxxxxxxxx  xxxxx</style>`',
            '                                       '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<div style="xxxxxxxxxxxxxxxxxxx"></div>`',
            '                                            '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<div style="xxx xxxxxx xxxxxxxx"></div>`',
            '                                            '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<style>xxx</style><div style=" xxx "></div>`',
            '                                                '
        );
    });

    test('Untouched CSS document content', () => {
        assertEmbeddedDocumentCssContent(
            'hbs`<style>xx</style><div style="xx xxxxxxxx"></div>`',
            '           xx                 __{xx xxxxxxxx}        '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<style>body {color: red;} xxxxxxxxx</style>`',
            '           body {color: red;} xxxxxxxxx         '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<style>xxxxxxxxx body {color: red;}</style>`',
            '           xxxxxxxxx body {color: red;}         '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<div style="xxxxxxxxxx color:red;"></div>`',
            '             __{xxxxxxxxxx color:red;}        '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<div style="color:red; xxxxxxxxxxx"></div>`',
            '             __{color:red; xxxxxxxxxxx}        '
        );
        assertEmbeddedDocumentCssContent(
            'hbs`<div style="color:red; xxxxxxxxxxx font-size: 16px;"></div>`',
            '             __{color:red; xxxxxxxxxxx font-size: 16px;}        '
        );
    });
});

const htmlLanguageService = vscodeHtmlService.getLanguageService();

function assertLanguageId(value, expectedLanguageId) {
    let offset = value.indexOf('|');
    value = value.substr(0, offset) + value.substr(offset + 1);

    let document = createDocument(value);

    let position = document.positionAt(offset);

    let docRegions = embeddedSupport.getDocumentRegions(htmlLanguageService, document);
    let languageId = docRegions.getLanguageAtPosition(position);
    expect(languageId).toEqual(expectedLanguageId);
}

function assertEmbeddedDocumentCssContent(value, expectedValue) {
    let document = createDocument(value);
    let docRegions = embeddedSupport.getDocumentRegions(htmlLanguageService, document);
    let cssDoc = docRegions.getEmbeddedDocument('css', false);

    expect(cssDoc.getText()).toEqual(expectedValue);
}

function createDocument(value) {
    return vscodeTypes.TextDocument.create('test://test/test.hbs', 'handlebars', 0, value);
}