const S = require('fluent-json-schema');

const startGameResponseSchema = S.object()
    .prop('roomId', S.string().required())
    .prop('status', S.string().enum(['waiting', 'started']).required())
    .prop('playersJoined', S.number())
    .prop('maxPlayers', S.number())
    .prop('gameId', S.string())
    .additionalProperties(false);

const startGameSchema = {
    response: {
        '2xx': startGameResponseSchema,
        '4xx': S.object().prop('error', S.string().required())
    }
};

module.exports = {
    startGameSchema
};