pragma solidity ^0.5.8;

contract Lottery {
  uint256 public ticketsTotal;
  uint256 public ticketPrice;

  uint256 public ticketsAvailable;
  mapping (uint => address) public participants;

  event TicketPurchased(address buyer);

  constructor(uint256 _ticketsTotal, uint256 _ticketPrice) public payable {
    ticketsTotal = _ticketsTotal;
    ticketsAvailable = _ticketsTotal;
    ticketPrice = _ticketPrice;

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
  }
}
