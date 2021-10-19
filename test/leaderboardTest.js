const { expect } = require('chai');
const { ethers } = require('hardhat');
const _ = require('lodash');
const { Movement, DEFAULT_ADDRESS } = require('./resources');

describe('Leaderboard', function () {
    let leaderboard;
    let rockPaperScissors;
    let rockPaperScissorsAddress;

    const today = new Date();
    const timestampbegin = (today.getTime() / 1000).toFixed(0);
    today.setDate(today.getDate() + 10);
    const timestampend = (today.getTime() / 1000).toFixed(0);

    before(async function () {
        signers = await ethers.getSigners();
    });

    beforeEach(async function () {
        const Leaderboard = await ethers.getContractFactory('Leaderboard');
        leaderboard = await Leaderboard.deploy();
        await leaderboard.deployed()

        const RockPaperScissors = await ethers.getContractFactory('RockPaperScissors');

        rockPaperScissors = await RockPaperScissors.deploy();
        rockPaperScissorsAddress = (await rockPaperScissors.deployed()).address;
    });

    describe('Board with empty game', function () {
        it('create board increase id by one', async function () {
            let createBoardTx = await leaderboard.createBoard(rockPaperScissorsAddress, timestampbegin, timestampend, {
                value: ethers.utils.parseEther("1.0")
            });
            let fullTxData = await createBoardTx.wait();

            expect(fullTxData).to.have.property('events');
            expect(fullTxData.events.length).equals(1);
            expect(fullTxData.events[0].event).equals('BoardCreated');
            expect(fullTxData.events[0].args[0]).equals(0);

            createBoardTx = await leaderboard.createBoard(rockPaperScissorsAddress, timestampbegin, timestampend, {
                value: ethers.utils.parseEther("1.0")
            });
            fullTxData = await createBoardTx.wait();

            expect(fullTxData).to.have.property('events');
            expect(fullTxData.events.length).equals(1);
            expect(fullTxData.events[0].event).equals('BoardCreated');
            expect(fullTxData.events[0].args[0]).equals(1);
        });

        it('Board is initialized empty', async function () {
            const createBoardTx = await leaderboard.createBoard(rockPaperScissorsAddress, timestampbegin, timestampend, {
                value: ethers.utils.parseEther("1.0")
            });
            let fullTxData = await createBoardTx.wait();

            const boardId = fullTxData.events[0].args[0];
            const boardData = await leaderboard.getLeaderboardData(boardId);

            const boardPairs = _.zip(boardData[0], boardData[1]);
            expect(boardPairs).to.satisfy(pairs => {
                return pairs.every(pair => pair[0] === DEFAULT_ADDRESS && pair[1].toNumber() === 0);
            });
        });
    });

    describe('Board with complex game', function () {
        /*
            * Rock Scissors Paper game has the following rules to assign points to player:
            * The contract maintains a registry of the count of games won by a user in a row (win after win without losing in between).
            * If the game is a draw, each player gets 5 points.
            * If one player win, he gets points according to the following formula:
            *           Points = (2 * winsInARow) + 10
            * So, 
            *   - The first time the player gets 12 points.
            *   - The second time gets 14 points
            *   - The third time gets 16 points
            *  and so on.
        */

        describe('Games with only two players', function () {
            it('host wins three times in a row', async function () {
                const createBoardTx = await leaderboard.createBoard(rockPaperScissorsAddress, timestampbegin, timestampend, {
                    value: ethers.utils.parseEther("1.0")
                });
                await createBoardTx.wait();

                // A game ended in draw
                // 5 points for each one
                await playGame(signers[0], signers[1], Movement.Rock, Movement.Rock);

                const players = await rockPaperScissors.getPlayers();
                expect(players.length).equals(2);

                // Host wins 3 times in a row
                // opponent points = 5
                // host points = 5 + 12 + 14 + 16 = 47
                await playGame(signers[0], signers[1], Movement.Paper, Movement.Rock);
                await playGame(signers[0], signers[1], Movement.Scissors, Movement.Paper);
                await playGame(signers[0], signers[1], Movement.Paper, Movement.Rock);

                expect(await rockPaperScissors.getLifetimeScore(signers[0].address)).equals(47);
                expect(await rockPaperScissors.getLifetimeScore(signers[1].address)).equals(5);

                const updateBoardTx = await leaderboard.update(0);
                const fullTxData = await updateBoardTx.wait();

                expect(fullTxData.events.length).equals(1);
                expect(fullTxData.events[0].event).equals('BoardUpdated');
                expect(fullTxData.events[0].args[0]).equals(0);
            });

            it('opponent wins three times in a row', async function () {
                const createBoardTx = await leaderboard.createBoard(rockPaperScissorsAddress, timestampbegin, timestampend, {
                    value: ethers.utils.parseEther("1.0")
                });
                await createBoardTx.wait();

                // A game ended in draw
                // 5 points for each one
                await playGame(signers[0], signers[1], Movement.Rock, Movement.Rock);

                const players = await rockPaperScissors.getPlayers();
                expect(players.length).equals(2);

                // Opponent wins 3 times in a row
                // host points = 5
                // opponent points = 5 + 12 + 14 + 16 = 47
                await playGame(signers[0], signers[1], Movement.Rock, Movement.Paper);
                await playGame(signers[0], signers[1], Movement.Scissors, Movement.Rock);
                await playGame(signers[0], signers[1], Movement.Scissors, Movement.Rock);

                expect(await rockPaperScissors.getLifetimeScore(signers[0].address)).equals(5);
                expect(await rockPaperScissors.getLifetimeScore(signers[1].address)).equals(47);

                const updateBoardTx = await leaderboard.update(0);
                const fullTxData = await updateBoardTx.wait();

                expect(fullTxData.events.length).equals(1);
                expect(fullTxData.events[0].event).equals('BoardUpdated');
                expect(fullTxData.events[0].args[0]).equals(0);
            });
        });

        describe('Games with more than 10 players', function () {
            it('Each player has unique score', async function () {
                const createBoardTx = await leaderboard.createBoard(rockPaperScissorsAddress, timestampbegin, timestampend, {
                    value: ethers.utils.parseEther("1.0")
                });
                await createBoardTx.wait();

                // Player 0 has 5 points
                await playGame(signers[0], signers[1], Movement.Rock, Movement.Rock);

                // Player 1 has 17 points
                await playGame(signers[0], signers[1], Movement.Rock, Movement.Paper);

                // Player 2 has 31 points
                await playGame(signers[2], signers[3], Movement.Rock, Movement.Rock);
                await playGame(signers[2], signers[4], Movement.Paper, Movement.Rock);
                await playGame(signers[2], signers[4], Movement.Rock, Movement.Scissors);

                // Player 3 has 10 points
                await playGame(signers[4], signers[3], Movement.Rock, Movement.Rock);

                // Player 4 has 15 points
                await playGame(signers[4], signers[5], Movement.Rock, Movement.Rock);
                await playGame(signers[4], signers[5], Movement.Rock, Movement.Rock);

                // Player 5 has 22 points
                await playGame(signers[6], signers[5], Movement.Scissors, Movement.Rock);

                // Player 6 has 29 points
                await playGame(signers[6], signers[7], Movement.Paper, Movement.Rock);
                await playGame(signers[6], signers[7], Movement.Scissors, Movement.Scissors);
                await playGame(signers[6], signers[7], Movement.Paper, Movement.Scissors);
                await playGame(signers[6], signers[7], Movement.Paper, Movement.Rock);

                // Update board
                let updateBoardTx = await leaderboard.update(0);
                await updateBoardTx.wait();

                const partialLeaderBoard = await leaderboard.getLeaderboardData(0);

                for (let i = 0, j = 1; i < partialLeaderBoard[1].length - 1; i++, j++) {
                    expect(partialLeaderBoard[1][i] >= partialLeaderBoard[1][j]);
                }

                // Player 7 has 34 points
                await playGame(signers[7], signers[8], Movement.Scissors, Movement.Scissors);
                await playGame(signers[7], signers[8], Movement.Scissors, Movement.Paper);

                // Player 8 has 20 points
                await playGame(signers[9], signers[8], Movement.Scissors, Movement.Scissors);
                await playGame(signers[9], signers[8], Movement.Scissors, Movement.Scissors);
                await playGame(signers[9], signers[8], Movement.Paper, Movement.Paper);

                // Player 9 has 35 points
                await playGame(signers[9], signers[11], Movement.Paper, Movement.Paper);
                await playGame(signers[9], signers[11], Movement.Paper, Movement.Paper);
                await playGame(signers[9], signers[11], Movement.Rock, Movement.Rock);
                await playGame(signers[9], signers[11], Movement.Rock, Movement.Rock);

                // Player 10 has 0 points
                // Player 11 has 32 points
                await playGame(signers[11], signers[10], Movement.Paper, Movement.Rock);

                expect(await rockPaperScissors.getLifetimeScore(signers[0].address)).equals(5);
                expect(await rockPaperScissors.getLifetimeScore(signers[1].address)).equals(17);
                expect(await rockPaperScissors.getLifetimeScore(signers[2].address)).equals(31);
                expect(await rockPaperScissors.getLifetimeScore(signers[3].address)).equals(10);
                expect(await rockPaperScissors.getLifetimeScore(signers[4].address)).equals(15);
                expect(await rockPaperScissors.getLifetimeScore(signers[5].address)).equals(22);
                expect(await rockPaperScissors.getLifetimeScore(signers[6].address)).equals(29);
                expect(await rockPaperScissors.getLifetimeScore(signers[7].address)).equals(34);
                expect(await rockPaperScissors.getLifetimeScore(signers[8].address)).equals(20);
                expect(await rockPaperScissors.getLifetimeScore(signers[9].address)).equals(35);
                expect(await rockPaperScissors.getLifetimeScore(signers[10].address)).equals(0);
                expect(await rockPaperScissors.getLifetimeScore(signers[11].address)).equals(32);

                updateBoardTx = await leaderboard.update(0);
                await updateBoardTx.wait();

                const fullLeaderBoard = await leaderboard.getLeaderboardData(0);

                expect(fullLeaderBoard[1].length).equals(10);
                for (let i = 0, j = 1; i < fullLeaderBoard[1].length - 1; i++, j++) {
                    expect(fullLeaderBoard[1][i] >= fullLeaderBoard[1][j]);
                }
            });

            it('Some players has same score', async function () {
                const createBoardTx = await leaderboard.createBoard(rockPaperScissorsAddress, timestampbegin, timestampend, {
                    value: ethers.utils.parseEther("1.0")
                });
                await createBoardTx.wait();

                // Player 0 has 5 points
                // Player 1 has 5 points
                await playGame(signers[0], signers[1], Movement.Rock, Movement.Rock);

                // Player 2 has 31 points
                await playGame(signers[2], signers[3], Movement.Rock, Movement.Rock);
                await playGame(signers[2], signers[4], Movement.Paper, Movement.Rock);
                await playGame(signers[2], signers[4], Movement.Rock, Movement.Scissors);

                // Player 3 has 10 points
                await playGame(signers[4], signers[3], Movement.Rock, Movement.Rock);

                // Player 4 has 10 points
                await playGame(signers[4], signers[5], Movement.Rock, Movement.Rock);

                // Player 5 has 17 points
                await playGame(signers[6], signers[5], Movement.Scissors, Movement.Rock);

                // Player 6 has 29 points
                await playGame(signers[6], signers[7], Movement.Paper, Movement.Rock);
                await playGame(signers[6], signers[7], Movement.Scissors, Movement.Scissors);
                await playGame(signers[6], signers[7], Movement.Paper, Movement.Scissors);
                await playGame(signers[6], signers[7], Movement.Paper, Movement.Rock);

                // Update board
                let updateBoardTx = await leaderboard.update(0);
                await updateBoardTx.wait();

                const partialLeaderBoard = await leaderboard.getLeaderboardData(0);

                for (let i = 0, j = 1; i < partialLeaderBoard[1].length - 1; i++, j++) {
                    expect(partialLeaderBoard[1][i] >= partialLeaderBoard[1][j]);
                }

                // Player 7 has 34 points
                await playGame(signers[7], signers[8], Movement.Scissors, Movement.Scissors);
                await playGame(signers[7], signers[8], Movement.Scissors, Movement.Paper);

                // Player 8 has 20 points
                await playGame(signers[9], signers[8], Movement.Scissors, Movement.Scissors);
                await playGame(signers[9], signers[8], Movement.Scissors, Movement.Scissors);
                await playGame(signers[9], signers[8], Movement.Paper, Movement.Paper);

                // Player 9 has 35 points
                await playGame(signers[9], signers[11], Movement.Paper, Movement.Paper);
                await playGame(signers[9], signers[11], Movement.Paper, Movement.Paper);
                await playGame(signers[9], signers[11], Movement.Rock, Movement.Rock);
                await playGame(signers[9], signers[11], Movement.Rock, Movement.Rock);

                // Player 10 has 0 points
                // Player 11 has 32 points
                await playGame(signers[11], signers[10], Movement.Paper, Movement.Rock);

                expect(await rockPaperScissors.getLifetimeScore(signers[0].address)).equals(5);
                expect(await rockPaperScissors.getLifetimeScore(signers[1].address)).equals(5);
                expect(await rockPaperScissors.getLifetimeScore(signers[2].address)).equals(31);
                expect(await rockPaperScissors.getLifetimeScore(signers[3].address)).equals(10);
                expect(await rockPaperScissors.getLifetimeScore(signers[4].address)).equals(10);
                expect(await rockPaperScissors.getLifetimeScore(signers[5].address)).equals(17);
                expect(await rockPaperScissors.getLifetimeScore(signers[6].address)).equals(29);
                expect(await rockPaperScissors.getLifetimeScore(signers[7].address)).equals(34);
                expect(await rockPaperScissors.getLifetimeScore(signers[8].address)).equals(20);
                expect(await rockPaperScissors.getLifetimeScore(signers[9].address)).equals(35);
                expect(await rockPaperScissors.getLifetimeScore(signers[10].address)).equals(0);
                expect(await rockPaperScissors.getLifetimeScore(signers[11].address)).equals(32);

                updateBoardTx = await leaderboard.update(0);
                await updateBoardTx.wait();

                const fullLeaderBoard = await leaderboard.getLeaderboardData(0);

                expect(fullLeaderBoard[1].length).equals(10);
                for (let i = 0, j = 1; i < fullLeaderBoard[1].length - 1; i++, j++) {
                    expect(fullLeaderBoard[1][i] >= fullLeaderBoard[1][j]);
                }
            })
        });
    });

    xdescribe('Board timestamp', function () {
        it('cannot update if timestampend has passed', async function () {
            const today = new Date();
            const timestampbegin = (today.getTime() / 1000).toFixed(0);
            today.setSeconds(today.getSeconds() + 4);
            const timestampend = (today.getTime() / 1000).toFixed(0);

            const createBoardTx = await leaderboard.createBoard(rockPaperScissorsAddress, timestampbegin, timestampend);
            await createBoardTx.wait();

            // A game ended in draw
            // 5 points for each one
            await playGame(signers[0], signers[1], Movement.Rock, Movement.Rock);

            // Host wins 3 times in a row
            // opponent points = 5
            // host points = 5 + 12
            await playGame(signers[0], signers[1], Movement.Paper, Movement.Rock);

            let updateBoardTx = await leaderboard.update(0);
            await updateBoardTx.wait();

            // Wait for 4 seconds so timestamp is overpassed
            await new Promise(res => setTimeout(res, 5000));

            // host points = 5 + 12 + 14 + 16 = 47
            await playGame(signers[0], signers[1], Movement.Scissors, Movement.Paper);
            await playGame(signers[0], signers[1], Movement.Paper, Movement.Rock);

            expect(await leaderboard.update(0)).to.be.revertedWith('This leader board cannot be updated anymore');
        });
    });

    async function playGame(host, opponent, hostMovement, opponentMovement) {
        let playTx = await rockPaperScissors.connect(host).play(hostMovement, opponent.address);
        await playTx.wait();

        playTx = await rockPaperScissors.connect(opponent).play(opponentMovement, host.address);
        return await playTx.wait();
    }
});