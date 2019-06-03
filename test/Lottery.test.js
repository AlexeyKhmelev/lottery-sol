const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN)).should();

const truffleAssert = require('truffle-assertions');

const Lottery = artifacts.require('Lottery');

contract('Lottery', ([owner, buyer]) => {
  const generateBlocks = async (blocksNumber) => {
    for (let i = 0; i < blocksNumber; i += 1) {
      // eslint-disable-next-line
      await web3.eth.sendTransaction({ to: owner, from: buyer, value: 1 });
    }
  }

  const ticketsTotal = 50;
  const ticketPrice = 100;

  const waitBlockCount = 50;

  describe('Getters', () => {
    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, { from: owner, value: ticketPrice });
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
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, { from: owner, value: ticketPrice });
    });

    it('Buy Ticket', async () => {
      const availableBefore = await lotteryContract.ticketsAvailable();
      const receipt = await lotteryContract.buyTicket({ from: buyer, value: ticketPrice });
      const actualBuyer = receipt.logs[0].args.buyer;

      truffleAssert.eventEmitted(receipt, 'TicketPurchased', ev =>  ev.buyer === buyer, 'TicketPurchased should be emitted with correct parameters');

      actualBuyer.should.be.equal(buyer);

      const availableAfter = await lotteryContract.ticketsAvailable();
      availableAfter.should.be.a.bignumber.that.equals(availableBefore.sub(new web3.utils.BN(1)));
    });

    it('Can not buy if value not enough', async () => {
      await truffleAssert.reverts(
        lotteryContract.buyTicket({ from: buyer, value: ticketPrice - 1 }),
        truffleAssert.ErrorType.REVERT,
      );
    });
  });

  describe('Claim reward', () => {
    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, { from: owner, value: ticketPrice });

      for (let i = 0; i < ticketsTotal - 1; i += 1) {
        await lotteryContract.buyTicket({ from: owner, value: ticketPrice });
      }

      await generateBlocks(waitBlockCount);
    });

    it('Get Winner', async () => {
      const winner = await lotteryContract.winner();
      winner.should.be.equal(owner);
    });

    it('Claim Reward', async () => {
      const winner = await lotteryContract.winner();

      const balanceBefore = await web3.eth.getBalance(winner);

      const receipt = await lotteryContract.claimReward({ from: winner });
      truffleAssert.eventEmitted(receipt, 'RewardClaimed', ev =>  ev.winner === winner, 'RewardClaimed should be emitted with correct parameters');

      const gasPrice = new web3.utils.BN(await web3.eth.getGasPrice());

      const balanceAfter = await web3.eth.getBalance(winner);

      const expectedBalance = new web3.utils.BN(balanceBefore).add(new web3.utils.BN(ticketsTotal * ticketPrice)).sub(new web3.utils.BN(receipt.receipt.gasUsed).mul(gasPrice));
      new web3.utils.BN(balanceAfter).should.be.a.bignumber.that.equals(expectedBalance);
    });
  });

  describe('Negative tests', () => {
    it('Can not buy ticket if none is available', async () => {
      const lotteryContract = await Lottery.new(1, ticketPrice, { from: owner, value: ticketPrice });
      await truffleAssert.reverts(
        lotteryContract.buyTicket({ from: buyer, value: ticketPrice }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get winner if ticket have not been sold out', async () => {
      const lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, { from: owner, value: ticketPrice });
      await truffleAssert.reverts(
        lotteryContract.winner(),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get winner if enough blocks are not mined after sold out', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket({ from: buyer, value: ticketPrice });

      await truffleAssert.reverts(
        lotteryContract.winner(),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get reward if ticket have not been sold out', async () => {
      const lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, { from: owner, value: ticketPrice });
      await truffleAssert.reverts(
        lotteryContract.claimReward({ from: owner }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get reward if enough blocks are not mined after sold out', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket({ from: owner, value: ticketPrice });

      await truffleAssert.reverts(
        lotteryContract.claimReward({ from: owner }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not get reward if not winner', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket({ from: owner, value: ticketPrice });

      await generateBlocks(waitBlockCount);

      await truffleAssert.reverts(
        lotteryContract.claimReward({ from: buyer }),
        truffleAssert.ErrorType.REVERT,
      );
    });

    it('Can not claim reward twice', async () => {
      const lotteryContract = await Lottery.new(2, ticketPrice, { from: owner, value: ticketPrice });
      await lotteryContract.buyTicket({ from: owner, value: ticketPrice });

      await generateBlocks(waitBlockCount);

      const receipt = await lotteryContract.claimReward({ from: owner });
      truffleAssert.eventEmitted(receipt, 'RewardClaimed', ev =>  ev.winner === owner, 'RewardClaimed should be emitted with correct parameters');

      await truffleAssert.reverts(
        lotteryContract.claimReward({ from: owner }),
        truffleAssert.ErrorType.REVERT,
      );
    });
  });
});
