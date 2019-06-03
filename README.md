# Lottery

## Description

Randomization is implemented using RADAO-like scheme. A player makes a number and passes its hash when buying a ticket.
Players reveal the numbers after all tickets are sold. If a player bought several tickets the player should reveal only last number.
When all numbers are revealed they are used for determining the winner.
As players make up numbers independently the result is effectively randomized.

### Pitfals

The winner can't be determined till all players reveals their numbers. So if one player doesn't reveal the number the whole lottery is hung.
To avoid such situation the reveal timeframe may be implemented. If a player doesn't reveal the number during the timeframe the whole lottery is cancelled and players may claim their money back. But players who faield to reveal a number will be punished with some fee.

### Alternatives

Possible alternative is to use a trusted Oracle system, e.g. oraclize.it.

## Run Tests

### Prerequisites

1. Make sure dependencies are installed: 
```
npm install
```
2. Make sure Ganache is run:
```
npm run ganache-cli
```

### Run tests
```
npm test
```
