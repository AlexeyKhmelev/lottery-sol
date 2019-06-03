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

  describe ('Buy Ticket', () => {
    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, { from: owner, value: ticketPrice  });
    });

    it('Buy Ticket', async () => {
      const availableBefore = await lotteryContract.ticketsAvailable();
      const receipt = await lotteryContract.buyTicket({ from: buyer, value: ticketPrice });
      const actualBuyer = receipt.logs[0].args.buyer;

      truffleAssert.eventEmitted(receipt, 'TicketPurchased', (ev) => {
        return ev.buyer === buyer
      }, 'TicketPurchased should be emitted with correct parameters');

      actualBuyer.should.be.equal(buyer);

      const availableAfter = await lotteryContract.ticketsAvailable();
      availableAfter.should.be.a.bignumber.that.equals(availableBefore.sub(new web3.utils.BN(1)));
    });

    it ('Can not buy if value not enough', async () => {
      await truffleAssert.reverts(
        lotteryContract.buyTicket({ from: buyer, value: ticketPrice - 1 }),
        truffleAssert.ErrorType.REVERT
      );
    });
  });
});
