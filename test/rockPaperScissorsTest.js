const { expect } = require('chai');
const { ethers } = require('hardhat');
const { Movement, GameResult, DEFAULT_ADDRESS } = require('./resources');

describe('RockPaperScissors', function () {
    let rockPaperScissors;
    let signers;

    before(async function () {
        signers = await ethers.getSigners();
    });

    beforeEach(async function () {
        const RockPaperScissors = await ethers.getContractFactory('RockPaperScissors');
        rockPaperScissors = await RockPaperScissors.deploy();
        await rockPaperScissors.deployed();
    });

    describe('Game initialization', function () {
        it('Should emit a pending event when a game is created', async function () {
            const playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            const fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');
            
            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');
        });

        it('Should increase game id by one each time', async function () {
            let playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');
            
            let pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.play(Movement.Rock, signers[2].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');
            
            pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('1');

            playTx = await rockPaperScissors.play(Movement.Rock, signers[3].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');
            
            pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('2');
        });
    });

    describe('Games ending in draw', function () {
        it('Game should be updated both players play Rock', async function () {
            let playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');
            
            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Rock, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');
            
            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Rock);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Rock);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Draw);
            expect(finishedGameEvents[0].args[4]).equals(DEFAULT_ADDRESS);
        });

        it('Game should be updated both players play Paper', async function () {
            let playTx = await rockPaperScissors.play(Movement.Paper, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');
            
            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Paper, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Paper);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Paper);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Draw);
            expect(finishedGameEvents[0].args[4]).equals(DEFAULT_ADDRESS);
        });

        it('Game should be updated both players play Scissors', async function () {
            let playTx = await rockPaperScissors.play(Movement.Scissors, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Scissors, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Scissors);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Scissors);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Draw);
            expect(finishedGameEvents[0].args[4]).equals(DEFAULT_ADDRESS);
        });
    });

    describe('Games won by host player', function () {
        it('Game should be updated when host player wins using rock', async function () {
            let playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Scissors, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Rock);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Scissors);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Done);
            expect(finishedGameEvents[0].args[4]).equals(signers[0].address);
        });

        it('Game should be updated when host player wins using paper', async function () {
            let playTx = await rockPaperScissors.play(Movement.Paper, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Rock, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Paper);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Rock);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Done);
            expect(finishedGameEvents[0].args[4]).equals(signers[0].address);
        });

        it('Game should be updated when host player wins using scissors', async function () {
            let playTx = await rockPaperScissors.play(Movement.Scissors, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Paper, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Scissors);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Paper);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Done);
            expect(finishedGameEvents[0].args[4]).equals(signers[0].address);
        });
    });

    describe('Games won by second player', function () {
        it('Game should be updated when second player wins using rock', async function () {
            let playTx = await rockPaperScissors.play(Movement.Scissors, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Rock, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Scissors);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Rock);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Done);
            expect(finishedGameEvents[0].args[4]).equals(signers[1].address);
        });

        it('Game should be updated when second player wins using paper', async function () {
            let playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Paper, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Rock);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Paper);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Done);
            expect(finishedGameEvents[0].args[4]).equals(signers[1].address);
        });

        it('Game should be updated when second player wins using scissors', async function () {
            let playTx = await rockPaperScissors.play(Movement.Paper, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Scissors, signers[0].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            const finishedGameEvents = fullTxData.events;
            expect(finishedGameEvents.length).equals(1);
            expect(finishedGameEvents[0].event).equals('Finished');
            expect(finishedGameEvents[0].args[0].toString()).equals('0');
            expect(finishedGameEvents[0].args[1].addr).equals(signers[0].address);
            expect(finishedGameEvents[0].args[2].addr).equals(signers[1].address);
            expect(finishedGameEvents[0].args[1].move).equals(Movement.Paper);
            expect(finishedGameEvents[0].args[2].move).equals(Movement.Scissors);
            expect(finishedGameEvents[0].args[3]).equals(GameResult.Done);
            expect(finishedGameEvents[0].args[4]).equals(signers[1].address);
        });
    });

    describe('Game cancellation', function () {
        it('Game can be cancelled if still pending', async function () {
            // Initialize games to cancel later
            let playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            let fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            let pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('0');

            playTx = await rockPaperScissors.play(Movement.Rock, signers[2].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('1');

            playTx = await rockPaperScissors.play(Movement.Rock, signers[3].address);
            fullTxData = await playTx.wait();
            expect(fullTxData).to.have.property('events');

            pendingGameEvents = fullTxData.events;
            expect(pendingGameEvents.length).equals(1);
            expect(pendingGameEvents[0].event).equals('Pending');
            expect(pendingGameEvents[0].args[0].toString()).equals('2');

            // Cancel second initialized game
            let cancelGameTx = await rockPaperScissors.cancelGame(1);
            fullTxData = await cancelGameTx.wait();
            expect(fullTxData).to.have.property('events');
            expect(fullTxData.events.length).equals(1);
            expect(fullTxData.events[0].event).equals('GameCancelled');
            expect(fullTxData.events[0].args[0].toString()).equals('1');

            // Cancel first initialized game
            cancelGameTx = await rockPaperScissors.cancelGame(0);
            fullTxData = await cancelGameTx.wait();
            expect(fullTxData).to.have.property('events');
            
            expect(fullTxData.events.length).equals(1);
            expect(fullTxData.events[0].event).equals('GameCancelled');
            expect(fullTxData.events[0].args[0].toString()).equals('0');

            // Cancel third initialized game
            cancelGameTx = await rockPaperScissors.cancelGame(2);
            fullTxData = await cancelGameTx.wait();
            expect(fullTxData).to.have.property('events');
            expect(fullTxData.events.length).equals(1);
            expect(fullTxData.events[0].event).equals('GameCancelled');
            expect(fullTxData.events[0].args[0].toString()).equals('2');
        });

        it('Cancelling a game requires a valid game id', async function () {
            await expect(rockPaperScissors.cancelGame(0)).to.be.revertedWith('Game not found');
        });

        it('Only pending games can be cancelled', async function () {
            // Initialize game
            let playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            let fullTxData = await playTx.wait();

            // Finish game in draw
            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Rock, signers[0].address);
            fullTxData = await playTx.wait();

            await expect(rockPaperScissors.cancelGame(0)).to.be.revertedWith('Game has already finished');
        });
    });

    describe('Get game result', function () {
        it('Pending game', async function () {
            const playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            const fullPlayTxData = await playTx.wait();
            expect(fullPlayTxData).to.have.property('events');

            const pendingPlayTxEvents = fullPlayTxData.events;
            expect(pendingPlayTxEvents.length).equals(1);
            expect(pendingPlayTxEvents[0].event).equals('Pending');
            expect(pendingPlayTxEvents[0].args[0].toString()).equals('0');

            const getResultTx = await rockPaperScissors.getGameResult(0);
            const fullGetResultTxData = await getResultTx.wait();
            expect(fullGetResultTxData).to.have.property('events');

            const pendingGetResultsTxEvents = fullGetResultTxData.events;
            expect(pendingGetResultsTxEvents.length).equals(1);
            expect(pendingGetResultsTxEvents[0].event).equals(pendingPlayTxEvents[0].event);
            expect(pendingGetResultsTxEvents[0].args).deep.equals(pendingPlayTxEvents[0].args);
        });

        it('Finished game with draw result', async function () {
            // Initialize game
            let playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            let fullPlayTxData = await playTx.wait();

            // Finish game in draw
            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Rock, signers[0].address);
            fullPlayTxData = await playTx.wait();

            const pendingPlayTxEvents = fullPlayTxData.events;

            const getResultTx = await rockPaperScissors.getGameResult(0);
            const fullGetResultTxData = await getResultTx.wait();
            expect(fullGetResultTxData).to.have.property('events');

            const pendingGetResultTxEvents = fullGetResultTxData.events;
            expect(pendingGetResultTxEvents.length).equals(1);
            expect(pendingGetResultTxEvents[0].event).equals(pendingPlayTxEvents[0].event);
            expect(pendingGetResultTxEvents[0].args).deep.equals(pendingPlayTxEvents[0].args);
        });

        it('Finished game with host player as winner', async function () {
            // Initialize game
            let playTx = await rockPaperScissors.play(Movement.Rock, signers[1].address);
            let fullPlayTxData = await playTx.wait();

            // Finish game in draw
            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Scissors, signers[0].address);
            fullPlayTxData = await playTx.wait();

            const pendingPlayTxEvents = fullPlayTxData.events;

            const getResultTx = await rockPaperScissors.getGameResult(0);
            const fullGetResultTxData = await getResultTx.wait();
            expect(fullGetResultTxData).to.have.property('events');

            const pendingGetResultEvents = fullGetResultTxData.events;
            expect(pendingGetResultEvents.length).equals(1);
            expect(pendingGetResultEvents[0].event).equals(pendingPlayTxEvents[0].event);
            expect(pendingGetResultEvents[0].args).deep.equals(pendingPlayTxEvents[0].args);
        });

        it('Finished game with second player as winner', async function () {
            // Initialize game
            let playTx = await rockPaperScissors.play(Movement.Paper, signers[1].address);
            let fullPlayTxData = await playTx.wait();

            // Finish game in draw
            playTx = await rockPaperScissors.connect(signers[1]).play(Movement.Scissors, signers[0].address);
            fullPlayTxData = await playTx.wait();

            const pendingPlayTxEvents = fullPlayTxData.events;
            
            const getResultTx = await rockPaperScissors.getGameResult(0);
            const fullGetResultTxData = await getResultTx.wait();
            expect(fullGetResultTxData).to.have.property('events');
            expect(fullGetResultTxData.events.length).equals(1);
            expect(fullGetResultTxData.events[0].event).equals(pendingPlayTxEvents[0].event);
            expect(fullGetResultTxData.events[0].args).deep.equals(pendingPlayTxEvents[0].args);
        });
    });
});