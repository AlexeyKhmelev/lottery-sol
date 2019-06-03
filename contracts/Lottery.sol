pragma solidity ^0.5.8;

contract Lottery {
  uint256 public ticketsTotal;
  uint256 public ticketPrice;

  uint256 public ticketsAvailable;
  mapping (uint => address payable) public participants;

  event TicketPurchased(address buyer);
  event TicketsSoldOut(uint256 winnerRevealBlockNumber);
  event RewardClaimed(address winner);

  uint256 winnerRevealBlockNumber;
  bool isRewardClaimed;

  constructor(uint256 _ticketsTotal, uint256 _ticketPrice) public payable {
    ticketsTotal = _ticketsTotal;
    ticketsAvailable = _ticketsTotal;
    ticketPrice = _ticketPrice;

    isRewardClaimed = false;

    _buyTicket();
  }

  function buyTicket() public payable {
    _buyTicket();
  }

  function _buyTicket() private {
    require(ticketsAvailable > 0, "No tickets available");
    require(msg.value == ticketPrice, "Invalid message value");

    participants[ticketsTotal - ticketsAvailable] = msg.sender;
    ticketsAvailable = ticketsAvailable - 1;
    emit TicketPurchased(msg.sender);

    if (ticketsAvailable == 0) {
      winnerRevealBlockNumber = block.number + 50;
      emit TicketsSoldOut(winnerRevealBlockNumber);
    }
  }

  function winner() public view returns (address payable winnerAddr) {
    require(ticketsAvailable == 0, "Ticket has not been sold out");
    require(block.number > winnerRevealBlockNumber, "Winner has not been revealed yet");
    winnerAddr = participants[uint256(blockhash(winnerRevealBlockNumber)) % ticketsTotal];
  }

  function claimReward() public {
    require(!isRewardClaimed, "Reward already claimed");

    address payable winnerAddr = winner();
    require(msg.sender == winner(), "Not winner");

    winnerAddr.transfer(ticketsTotal * ticketPrice);
    isRewardClaimed = true;

    emit RewardClaimed(msg.sender);
  }
}
