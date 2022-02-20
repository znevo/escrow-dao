// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

contract Escrow {
    address payable public depositor;
    address payable public beneficiary;
    address public arbiter;
    bool public isApproved;

    event Approved(uint _balance);
    event Denied(uint _balance);

    constructor(address _arbiter, address payable _beneficiary) payable {
        depositor = payable(msg.sender);
        beneficiary = _beneficiary;
        arbiter = _arbiter;
    }

    function approve() external {
        require(msg.sender == arbiter);
        isApproved = true;
        emit Approved(address(this).balance);
        beneficiary.transfer(address(this).balance);
    }

    function deny() external {
        require(msg.sender == arbiter);
        emit Denied(address(this).balance);
        selfdestruct(depositor);
    }
}
