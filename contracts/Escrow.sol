// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

contract Escrow {
    address payable public depositor;
    address payable public beneficiary;
    address public arbiter;

    enum EscrowStatus { PENDING, APPROVED, DENIED }
    EscrowStatus public status;

    event Approved(uint _balance);
    event Denied(uint _balance);

    constructor(address payable _depositor, address _arbiter, address payable _beneficiary) payable {
        depositor = _depositor;
        beneficiary = _beneficiary;
        arbiter = _arbiter;
    }

    function approve() external {
        require(msg.sender == arbiter);
        status = EscrowStatus.APPROVED;
        emit Approved(address(this).balance);
        beneficiary.transfer(address(this).balance);
    }

    function deny() external {
        require(msg.sender == arbiter);
        status = EscrowStatus.DENIED;
        emit Denied(address(this).balance);
        depositor.transfer(address(this).balance);
    }

    receive() external payable {}
}
