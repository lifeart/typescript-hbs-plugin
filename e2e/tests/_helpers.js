exports.openMockFile = async (server, mockFileName, fileContent) => {
    server.send({
        command: 'open',
        arguments: {
            file: mockFileName,
            fileContent,
            scriptKindName: 'TS'
        }
    });
    await server.waitEvent('projectLoadingFinish');
    await server.waitEvent('telemetry');
    const telemetry = server.responses.find(e => e.event === 'telemetry' && e.body.telemetryEventName === 'projectInfo');
    // const { compilerOptions } = telemetry.body.payload;
    // console.log(compilerOptions.plugins);
    // if (!compilerOptions.plugins.includes('typescript-hbs-plugin')) {
    //     throw new Error('Unable to resolve hbs plugin');
    // }
    return server;
};


exports.getFirstResponseOfType = (command, server) => {
    const response = server.responses.find(response => response.command === command);
    expect(response !== undefined).toBe(true);
    return response;
};