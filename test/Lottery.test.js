const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN)).should();

const truffleAssert = require('truffle-assertions');

const Lottery = artifacts.require('Lottery');

contract('Lottery', ([owner, buyer]) => {
  const ticketsTotal = 50;
  const ticketPrice = 100;

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

      truffleAssert.eventEmitted(receipt, 'TicketPurchased', (ev) => {
        return ev.buyer === buyer;
      }, 'TicketPurchased should be emitted with correct parameters');

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

  describe('Claim reward - Positive', () => {
    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, { from: owner, value: ticketPrice });

      for (let i = 0; i < ticketsTotal - 1; i += 1) {
        await lotteryContract.buyTicket({ from: owner, value: ticketPrice });
      }

      // generate 50 blocks
      for (let i = 0; i < 50; i += 1) {
        await web3.eth.sendTransaction({ to: owner, from: buyer, value: 1 });
      }
    });

    it('Get Winner', async () => {
      const winner = await lotteryContract.winner();
      winner.should.be.equal(owner);
    });

    it('Claim Reward', async () => {
      const winner = await lotteryContract.winner();

      const balanceBefore = await web3.eth.getBalance(winner);

      const receipt = await lotteryContract.claimReward({ from: winner });

      const gasPrice = new web3.utils.BN(await web3.eth.getGasPrice());

      const balanceAfter = await web3.eth.getBalance(winner);

      const expectedBalance = new web3.utils.BN(balanceBefore).add(new web3.utils.BN(ticketsTotal * ticketPrice)).sub(new web3.utils.BN(receipt.receipt.gasUsed).mul(gasPrice));
      new web3.utils.BN(balanceAfter).should.be.a.bignumber.that.equals(expectedBalance);
    });
  });

  describe('Claim reward - Negative', () => {
  });
});
