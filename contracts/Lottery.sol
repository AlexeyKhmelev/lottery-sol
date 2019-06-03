pragma solidity ^0.5.8;

contract Lottery {
  uint256 public ticketsTotal;
  uint256 public ticketPrice;

  uint256 public ticketsAvailable;
  mapping (uint => address payable) public participants;

  mapping (address => bytes32) public hashes;
  mapping (address => bool) public numberRevealed;
  uint256 public hashesCount;

  uint256 public revealedNumberCount;
  uint256 private random;

  bool public isRewardClaimed;

  event TicketPurchased(address indexed player, bytes32 numberHash);
  event TicketsSoldOut();
  event NumberRevealed(address indexed player, uint256 number);
  event RewardClaimed(address winner);

  constructor(uint256 _ticketsTotal, uint256 _ticketPrice, bytes32 _numberHash) public payable {
    require(_ticketsTotal > 1, "Invalid tickets total");
    require(_ticketPrice > 0, "Invalid tickets price");

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
    require(_numberHash != bytes32(0), "Invalid hash");
    require(ticketsAvailable > 0, "No tickets available");
    require(msg.value == ticketPrice, "Invalid ether value");

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
    require(!numberRevealed[msg.sender], "Number already revealed");
    require(keccak256(abi.encodePacked(msg.sender, _number)) == hashes[msg.sender], "Invalid number");

    numberRevealed[msg.sender] = true;

    if (revealedNumberCount == 0) {
      random = _number;
    } else {
      random ^= _number;
    }
    revealedNumberCount = revealedNumberCount + 1;

    emit NumberRevealed(msg.sender, _number);
  }

  function winner() public view returns (address payable winnerAddr) {
    require(ticketsAvailable == 0, "Tickets have not been sold out yet");
    require(revealedNumberCount == hashesCount, "Not all numbers have been revealed yet");

    winnerAddr = participants[random % ticketsTotal];
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
