exports.openMockFile = (server, mockFileName, fileContent) => {
    server.send({
        command: 'open',
        arguments: {
            file: mockFileName,
            fileContent,
            scriptKindName: 'TS'
        }
    });
    return server;
};


exports.getFirstResponseOfType = (command, server) => {
    const response = server.responses.find(response => response.command === command);
    expect(response !== undefined).toBe(true);
    return response;
};