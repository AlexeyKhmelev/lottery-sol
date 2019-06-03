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
      assert.isTrue(actual.eq(new web3.utils.BN(ticketsTotal)));
    });

    it('Get Ticket Price', async () => {
      const actual = await lotteryContract.ticketPrice();
      assert.isTrue(actual.eq(new web3.utils.BN(ticketPrice)));
    });
  });
});
