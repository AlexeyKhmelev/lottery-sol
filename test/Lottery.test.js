const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN)).should();

const Lottery = artifacts.require('Lottery');

contract('Lottery', ([owner]) => {
  describe('Getters', () => {
    const ticketsTotal = 50;
    const ticketPrice = 100;

    let lotteryContract;

    before('Create Lottery Contract', async () => {
      lotteryContract = await Lottery.new(ticketsTotal, ticketPrice, { from: owner });
    });

    it('Get Tickets Number', async () => {
      const actual = await lotteryContract.ticketsTotal();
      actual.should.be.a.bignumber.that.equals(new web3.utils.BN(ticketsTotal));
    });

    it('Get Ticket Price', async () => {
      const actual = await lotteryContract.ticketPrice();
      actual.should.be.a.bignumber.that.equals(new web3.utils.BN(ticketPrice));
    });
  });
});
