const S = require('fluent-json-schema');

const playerSchema = S.object()
    .prop('id', S.string().required())
    .prop('name', S.string().required())
    .prop('symbol', S.string().enum(['X', 'O']).required());

const eventSchema = S.object()
    .prop('type', S.string().enum(['player_joined', 'game_start']).required())
    .prop('data', S.object()
        .prop('playerId', S.string())
        .prop('playerName', S.string())
        .prop('playersJoined', S.number())
        .prop('gameId', S.string())
        .prop('players', S.array().items(playerSchema))
        .prop('currentTurn', S.string())
        .prop('board', S.array().items(S.array().items(S.string())))
    );

const startGameResponseSchema = S.object()
    .prop('roomId', S.string().required())
    .prop('gameId', S.string().required())
    .prop('status', S.string().enum(['waiting', 'in_progress']).required())
    .prop('playersJoined', S.number().required())
    .prop('maxPlayers', S.number().required())
    .prop('players', S.array().items(playerSchema).required())
    .prop('events', S.array().items(eventSchema))
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