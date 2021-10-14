// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
//
// Original code forked from https://github.com/Quramy/ts-graphql-plugin

import { StyledTemplateLanguageService } from 'typescript-styled-plugin/lib/api';
import { decorateWithTemplateLanguageService, Logger, TemplateSettings } from 'typescript-template-language-service-decorator';
import * as ts from 'typescript/lib/tsserverlibrary';
import { getLanguageService, LanguageService as HtmlLanguageService } from 'vscode-html-languageservice';
import { pluginName } from './config';
import { Configuration } from './configuration';
import HtmlTemplateLanguageService from './html-template-language-service';
import { getSubstitutions } from './substitutions';
import { CssDocumentProvider, VirtualDocumentProvider } from './virtual-document-provider';

const hbsHtmlPluginMarker = Symbol('__hbsHtmlPluginMarker__');


interface StyledPluginConfiguration {
    readonly tags: ReadonlyArray<string>;
    readonly validate: boolean;
    readonly lint: { [key: string]: any };
    readonly emmet: { [key: string]: any };
}

class CSSConfigurationManager {

    private static readonly defaultConfiguration: StyledPluginConfiguration = {
        tags: ['styled', 'css', 'extend', 'injectGlobal', 'createGlobalStyle', 'keyframes'],
        validate: true,
        lint: {
            emptyRules: 'ignore',
        },
        emmet: {},
    };

    private readonly _configUpdatedListeners = new Set<() => void>();

    public get config(): StyledPluginConfiguration { return this._configuration; }
    private _configuration: StyledPluginConfiguration = CSSConfigurationManager.defaultConfiguration;

    public updateFromPluginConfig(config: StyledPluginConfiguration) {
        const lint = Object.assign({}, CSSConfigurationManager.defaultConfiguration.lint, config.lint || {});

        this._configuration = {
            tags: config.tags || CSSConfigurationManager.defaultConfiguration.tags,
            validate: typeof config.validate !== 'undefined' ? config.validate : CSSConfigurationManager.defaultConfiguration.validate,
            lint,
            emmet: config.emmet || CSSConfigurationManager.defaultConfiguration.emmet,
        };

        for (const listener of this._configUpdatedListeners) {
            listener();
        }
    }

    public onUpdatedConfig(listener: () => void) {
        this._configUpdatedListeners.add(listener);
    }
}

class LanguageServiceLogger implements Logger {
    constructor(
        private readonly info: ts.server.PluginCreateInfo
    ) { }

    public log(msg: string) {
        this.info.project.projectService.logger.info(`[${pluginName}] ${msg}`);
    }
}

class HtmlPlugin {
    private readonly _virtualDocumentProvider = new VirtualDocumentProvider();

    private _htmlLanguageService?: HtmlLanguageService;
    private _config = new Configuration();

    public constructor(
        private readonly _typescript: typeof ts
    ) {
    }

    public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
        if ((info.languageService as any)[hbsHtmlPluginMarker]) {
            // Already decorated
            return info.languageService;
        }

        const logger = new LanguageServiceLogger(info);
        this._config.update(info.config);

        logger.log('config: ' + JSON.stringify(this._config));

        const styledLanguageService = new StyledTemplateLanguageService(
            this._typescript, new CSSConfigurationManager() as any,
            new CssDocumentProvider(this.htmlLanguageService),
            logger);

        const htmlTemplateLanguageService = new HtmlTemplateLanguageService(
            this._typescript,
            this._config,
            this._virtualDocumentProvider,
            this.htmlLanguageService,
            styledLanguageService,
            logger);

        const languageService = decorateWithTemplateLanguageService(
            this._typescript,
            info.languageService,
            info.project,
            htmlTemplateLanguageService,
            this.getTemplateSettings(this._config, this._virtualDocumentProvider),
            { logger });

        (languageService as any)[hbsHtmlPluginMarker] = true;
        return languageService;
    }

    public onConfigurationChanged(config: any) {
        this._config.update(config);
    }

    private get htmlLanguageService(): HtmlLanguageService {
        if (!this._htmlLanguageService) {
            this._htmlLanguageService = getLanguageService();
        }
        return this._htmlLanguageService;
    }

    private getTemplateSettings(
        config: Configuration,
        provider: VirtualDocumentProvider
    ): TemplateSettings {
        return {
            get tags() { return config.tags; } ,
            enableForStringWithSubstitutions: true,
            getSubstitutions: (templateString, spans): string => {
                return getSubstitutions(this._typescript, this.htmlLanguageService, provider, templateString, spans);
            },
        };
    }
}

export = function factory(mod: { typescript: typeof ts }) {
    return new HtmlPlugin(mod.typescript);
}
