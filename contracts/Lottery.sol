pragma solidity ^0.5.8;

contract Lottery {
  uint256 public ticketsTotal;
  uint256 public ticketPrice;

  uint256 public ticketsAvailable;
  mapping (uint => address payable) public participants;

  mapping (address => bytes32) public hashes;
  mapping (address => bool) public numbers;
  uint256 hashesCount;
  uint256 numberCount;
  uint256[] numbersList;

  event TicketPurchased(address player, bytes32 numberHash);
  event TicketsSoldOut();
  event NumberRevealed(address player, uint256 number);
  event RewardClaimed(address winner);

  bool isRewardClaimed;

  constructor(uint256 _ticketsTotal, uint256 _ticketPrice, bytes32 _numberHash) public payable {
    ticketsTotal = _ticketsTotal;
    ticketsAvailable = _ticketsTotal;
    ticketPrice = _ticketPrice;

    isRewardClaimed = false;

    _buyTicket(_numberHash);
  }

  function buyTicket(bytes32 _numberHash) public payable {
    _buyTicket(_numberHash);
  }

  function _buyTicket(bytes32 _numberHash) private {
    require(ticketsAvailable > 0, "No tickets available");
    require(msg.value == ticketPrice, "Invalid message value");

    participants[ticketsTotal - ticketsAvailable] = msg.sender;
    ticketsAvailable = ticketsAvailable - 1;

    if (hashes[msg.sender] == bytes32(0)) {
      hashesCount = hashesCount + 1;
    }
    hashes[msg.sender] = _numberHash;

    emit TicketPurchased(msg.sender, _numberHash);

    if (ticketsAvailable == 0) {
      emit TicketsSoldOut();
    }
  }

  function revealNumber(uint256 _number) public {
    require(ticketsAvailable == 0, "Tickets have not been sold out yet");
    require(!numbers[msg.sender], "Number already revealed");
    require(keccak256(abi.encodePacked(msg.sender, _number)) == hashes[msg.sender], "Invalid number");

    numbers[msg.sender] = true;
    numberCount = numberCount + 1;

    numbersList.push(_number);
    emit NumberRevealed(msg.sender, _number);
  }

  function winner() public view returns (address payable winnerAddr) {
    require(ticketsAvailable == 0, "Tickets have not been sold out yet");
    require(numberCount == hashesCount, "Not all numbers have been revealed yet");

    uint256 winnerTicket = numbersList[0];
    for (uint8 i = 1; i < numbersList.length; ++i) {
      winnerTicket ^= numbersList[i];
    }

    winnerAddr = participants[winnerTicket % ticketsTotal];
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
