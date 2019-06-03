const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN)).should();

const truffleAssert = require('truffle-assertions');

const Lottery = artifacts.require('Lottery');

contract('Lottery', ([owner, buyer, nonParticipant]) => {
  const ticketsTotal = 50;
  const ticketPrice = 100;

  const ownerNumber = 100;
  const buyerNumber = 200;

  const hashNumber = (address, number) => web3.utils.soliditySha3({ t: 'address', v: address }, { t: 'int256', v: number });

  describe('Getters', () => {
    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
    });

    it('Get Tickets Total', async () => {
      const actual = await lotteryContract.ticketsTotal();
      actual.should.be.a.bignumber.that.equals(new web3.utils.BN(ticketsTotal));
    });

    it('Get Ticket Price', async () => {
      const actual = await lotteryContract.ticketPrice();
      actual.should.be.a.bignumber.that.equals(new web3.utils.BN(ticketPrice));
    });

    it('Get Tickets Available', async () => {
      const actual = await lotteryContract.ticketsAvailable();
      actual.should.be.a.bignumber.that.equals(new web3.utils.BN(ticketsTotal - 1));
    });
  });

  describe('Buy Ticket', () => {
    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
    });

    it('Buy Ticket', async () => {
      const availableBefore = await lotteryContract.ticketsAvailable();
      const receipt = await lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice });

      truffleAssert.eventEmitted(receipt, 'TicketPurchased', ev => ev.player === buyer, 'TicketPurchased should be emitted with correct parameters');

      const availableAfter = await lotteryContract.ticketsAvailable();
      availableAfter.should.be.a.bignumber.that.equals(availableBefore.sub(new web3.utils.BN(1)));
    });

    it('Can not buy if value not enough', async () => {
      await truffleAssert.reverts(
        lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice - 1 }),
        truffleAssert.ErrorType.REVERT,
      );
    });
  });

  describe('Reveal Number', () => {
    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });

      for (let i = 0; i < ticketsTotal - 1; i += 1) {
        // eslint-disable-next-line
        await lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice });
      }
    });

    it('Reveal Number', async () => {
      const receipt = await lotteryContract.revealNumber(ownerNumber, { from: owner });
      truffleAssert.eventEmitted(receipt, 'NumberRevealed', ev => (ev.player === owner) && (ev.number.eq(new web3.utils.BN(ownerNumber))), 'NumberRevealed should be emitted with correct parameters');
    });
  });

  describe('Claim reward', () => {
    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });

      for (let i = 0; i < ticketsTotal - 1; i += 1) {
        // eslint-disable-next-line
        await lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice });
      }

      await lotteryContract.revealNumber(ownerNumber, { from: owner });
      await lotteryContract.revealNumber(buyerNumber, { from: buyer });
    });

    it('Get Winner', async () => {
      const winner = await lotteryContract.winner();
      winner.should.be.equal(buyer);
    });

    it('Claim Reward', async () => {
      const winner = await lotteryContract.winner();

      const balanceBefore = await web3.eth.getBalance(winner);

      const receipt = await lotteryContract.claimReward({ from: winner });
      truffleAssert.eventEmitted(receipt, 'RewardClaimed', ev => ev.winner === winner, 'RewardClaimed should be emitted with correct parameters');

      const gasPrice = new web3.utils.BN(await web3.eth.getGasPrice());

      const balanceAfter = await web3.eth.getBalance(winner);

      const expectedBalance = new web3.utils.BN(balanceBefore).add(new web3.utils.BN(ticketsTotal * ticketPrice)).sub(new web3.utils.BN(receipt.receipt.gasUsed).mul(gasPrice));
      new web3.utils.BN(balanceAfter).should.be.a.bignumber.that.equals(expectedBalance);
    });
  });

  describe('Negative tests', () => {
    it('Can not buy ticket if none is available', async () => {
      const lotteryContract = await Lottery.new(1, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await truffleAssert.reverts(
        lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get winner if ticket have not been sold out', async () => {
      const lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await truffleAssert.reverts(
        lotteryContract.winner(),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not reveal number if ticket have not been sold out', async () => {
      const lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await truffleAssert.reverts(
        lotteryContract.revealNumber(ownerNumber, { from: owner }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not reveal number twice', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice });
      await lotteryContract.revealNumber(ownerNumber, { from: owner });

      await truffleAssert.reverts(
        lotteryContract.revealNumber(ownerNumber, { from: owner }),
        truffleAssert.ErrorType.REVERT,
      );
    });


    it('Can not get winner if not all numbers are revealed', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice });

      await truffleAssert.reverts(
        lotteryContract.winner(),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get reward if ticket have not been sold out', async () => {
      const lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await truffleAssert.reverts(
        lotteryContract.claimReward({ from: owner }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get reward if not all numbers are revealed', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: owner, value: ticketPrice });

      await truffleAssert.reverts(
        lotteryContract.claimReward({ from: owner }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get reward if not winner', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice });

      await lotteryContract.revealNumber(ownerNumber, { from: owner });
      await lotteryContract.revealNumber(buyerNumber, { from: buyer });

      await truffleAssert.reverts(
        lotteryContract.claimReward({ from: nonParticipant }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not claim reward twice', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, hashNumber(owner, ownerNumber), { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket(hashNumber(buyer, buyerNumber), { from: buyer, value: ticketPrice });

      await lotteryContract.revealNumber(ownerNumber, { from: owner });
      await lotteryContract.revealNumber(buyerNumber, { from: buyer });

      const winner = await lotteryContract.winner();

      const receipt = await lotteryContract.claimReward({ from: winner });
      truffleAssert.eventEmitted(receipt, 'RewardClaimed', ev => ev.winner === owner, 'RewardClaimed should be emitted with correct parameters');

      await truffleAssert.reverts(
        lotteryContract.claimReward({ from: winner }),
        truffleAssert.ErrorType.REVERT,
      );
    });
  });
});
