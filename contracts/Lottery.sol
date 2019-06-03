pragma solidity ^0.5.8;

contract Lottery {
  uint256 public ticketsTotal;
  uint256 public ticketPrice;

  constructor(uint256 _ticketsTotal, uint256 _ticketPrice) public {
    ticketsTotal = _ticketsTotal;
    ticketPrice = _ticketPrice;
  }
}
