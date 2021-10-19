// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./IGame.sol";

contract RockPaperScissors is IGame {
    enum Movement {
        Rock,
        Paper,
        Scissors
    }

    enum GameResult {
        Done,
        Pending,
        Draw,
        Cancelled
    }

    struct GamePlayer {
        address addr;
        Movement move;
    }

    struct Game {
        uint256 id;
        GamePlayer host;
        GamePlayer opponent;
        GameResult result;
        address winner;
    }

    mapping(Movement => Movement) private weakness;
    mapping(address => Game[]) private games;
    mapping(address => uint256) private lifetimescore;
    mapping(address => uint256) private winsInARow;
    address[] private players;
    uint256 private totalGamesCount;

    // Events
    event Pending(uint256 id);

    event GameCancelled(uint256 id);

    event Finished(
        uint256 id,
        GamePlayer host,
        GamePlayer opponent,
        GameResult result,
        address winner
    );

    constructor() {
        weakness[Movement.Paper] = Movement.Scissors;
        weakness[Movement.Rock] = Movement.Paper;
        weakness[Movement.Scissors] = Movement.Rock;
    }

    function play(Movement movement, address opponent) public {
        // Validates if already exists a game against opponent
        Game[] memory senderGames = games[msg.sender];
        uint256 senderGamesCount = senderGames.length;

        for (uint256 i = 0; i < senderGamesCount; i++) {
            Game memory currentSenderGame = senderGames[i];
            require(
                currentSenderGame.result != GameResult.Pending ||
                    currentSenderGame.opponent.addr != opponent,
                "There is already a ongoing game with selected opponent"
            );
        }

        // Validates if exists a pending game hosted by opponent
        Game[] memory opponentGames = games[opponent];
        uint256 opponentGamesCount = opponentGames.length;
        uint256 currentGameIndex = opponentGamesCount;
        for (uint256 i = 0; i < opponentGamesCount; i++) {
            if (
                opponentGames[i].result == GameResult.Pending &&
                opponentGames[i].opponent.addr == msg.sender
            ) {
                currentGameIndex = i;
                break;
            }
        }

        // If currentGame was found then the game must be updated.
        if (currentGameIndex != opponentGamesCount) {
            games[opponent][currentGameIndex].opponent.move = movement;
            if (
                games[opponent][currentGameIndex].host.move ==
                games[opponent][currentGameIndex].opponent.move
            ) {
                games[opponent][currentGameIndex].result = GameResult.Draw;
            } else {
                games[opponent][currentGameIndex].result = GameResult.Done;
                games[opponent][currentGameIndex].winner = getWinner(
                    games[opponent][currentGameIndex].host,
                    games[opponent][currentGameIndex].opponent
                );
            }
            games[msg.sender].push(games[opponent][currentGameIndex]);

            updatePlayers(
                games[opponent][currentGameIndex].host.addr,
                games[opponent][currentGameIndex].opponent.addr
            );
            updateScore(games[opponent][currentGameIndex]);

            emit Finished(
                games[opponent][currentGameIndex].id,
                games[opponent][currentGameIndex].host,
                games[opponent][currentGameIndex].opponent,
                games[opponent][currentGameIndex].result,
                games[opponent][currentGameIndex].winner
            );
        } else {
            games[msg.sender].push(
                Game(
                    totalGamesCount,
                    GamePlayer(msg.sender, movement),
                    GamePlayer(opponent, movement),
                    GameResult.Pending,
                    address(0x0)
                )
            );
            totalGamesCount += 1;
            emit Pending(totalGamesCount - 1);
        }
    }

    function getGameResult(uint256 gameId) public {
        Game[] memory senderGames = games[msg.sender];
        uint256 senderGamesCount = senderGames.length;
        Game memory pendingGame;
        for (uint256 i = 0; i < senderGamesCount; i++) {
            if (senderGames[i].id == gameId) {
                pendingGame = senderGames[i];
                break;
            }
        }

        require(pendingGame.id == gameId, "Game not found");

        if (pendingGame.result == GameResult.Pending) {
            emit Pending(gameId);
        } else if (pendingGame.result == GameResult.Cancelled) {
            emit GameCancelled(gameId);
        } else {
            emit Finished(
                gameId,
                pendingGame.host,
                pendingGame.opponent,
                pendingGame.result,
                pendingGame.winner
            );
        }
    }

    function cancelGame(uint256 gameId) public {
        Game[] memory senderGames = games[msg.sender];
        uint256 senderGamesCount = senderGames.length;
        uint256 pendingGameIndex = senderGamesCount;
        for (uint256 i = 0; i < senderGamesCount; i++) {
            if (senderGames[i].id == gameId) {
                pendingGameIndex = i;
                break;
            }
        }

        require(pendingGameIndex != senderGamesCount, "Game not found");
        require(
            games[msg.sender][pendingGameIndex].result == GameResult.Pending,
            "Game has already finished"
        );

        delete games[msg.sender][pendingGameIndex].host;
        delete games[msg.sender][pendingGameIndex].opponent;
        games[msg.sender][pendingGameIndex].result = GameResult.Cancelled;

        emit GameCancelled(games[msg.sender][pendingGameIndex].id);
    }

    function getLifetimeScore(address player)
        public
        view
        override
        returns (uint256)
    {
        return lifetimescore[player];
    }

    function getPlayers() public view override returns (address[] memory) {
        return players;
    }

    function getGames(address player) public view returns (Game[] memory) {
        return games[player];
    }

    function getWinner(GamePlayer memory player1, GamePlayer memory player2)
        private
        view
        returns (address)
    {
        if (weakness[player1.move] == player2.move) {
            return player2.addr;
        }
        return player1.addr;
    }

    function updateScore(Game memory game) private {
        if (game.result == GameResult.Done) {
            address winner = game.winner;
            if (winner == game.host.addr) {
                winsInARow[game.opponent.addr] = 0;
            } else {
                winsInARow[game.host.addr] = 0;
            }
            winsInARow[winner] += 1;
            uint256 points = (2 * winsInARow[winner]) + 10;
            lifetimescore[winner] += points;
        } else {
            lifetimescore[game.host.addr] += 5;
            lifetimescore[game.opponent.addr] += 5;
        }
    }

    function updatePlayers(address player1, address player2) private {
        bool player1AlreadyInList;
        bool player2AlreadyInList;

        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == player1) {
                player1AlreadyInList = true;
            }

            if (players[i] == player2) {
                player2AlreadyInList = true;
            }

            if (player1AlreadyInList && player2AlreadyInList) {
                return;
            }
        }

        if (!player1AlreadyInList) {
            players.push(player1);
        }

        if (!player2AlreadyInList) {
            players.push(player2);
        }
    }
}
