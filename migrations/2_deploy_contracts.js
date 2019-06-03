const Lottery = artifacts.require('Lottery');

module.exports = function(deployer, network, [owner]) {
    deployer.deploy(Lottery, 50, 100, { from: owner });
};
