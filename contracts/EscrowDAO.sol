// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "hardhat/console.sol";
import "./Escrow.sol";

contract EscrowDAO {
    address[] public members;
    address payable[] public escrows;
    uint public volume;

    enum Vote { PENDING, YES, NO }
    struct Ballot {
      uint yesVotes;
      uint noVotes;
      mapping(address => Vote) votes;
    }
    mapping(address => Ballot) ballots;

    event EscrowCreated(address);
    event MemberVoted(address member, address escrow, Vote vote);

    constructor() {
        members.push(msg.sender);
    }

    function join() external {
        require(belongs(msg.sender) == false, 'Address already belongs!');
        members.push(msg.sender);
    }

    function belongs(address _address) public view returns(bool) {
        for (uint i = 0; i < members.length; i++) {
            if ( members[i] == _address ) {
                return true;
            }
        }
        return false;
    }

    function getMembers() external view returns(address[] memory) {
      return members;
    }

    function createEscrow(address payable _beneficiary) external payable {
      Escrow escrowContract = new Escrow(payable(msg.sender), address(this), _beneficiary);
      address payable escrowAddress = payable(address(escrowContract));
      escrowAddress.transfer((msg.value / 10) * 9);
      escrows.push(escrowAddress);
      emit EscrowCreated(escrowAddress);
      volume += msg.value;
    }

    function getEscrows() external view returns(address payable[] memory) {
        return escrows;
    }

    modifier canVote(address payable _escrow) {
      require(belongs(msg.sender), 'Only members can vote!');
      require(ballots[_escrow].votes[msg.sender] == Vote.PENDING, 'This address has already voted!');
      require(Escrow(_escrow).depositor() != msg.sender, 'Depositor not allowed to vote!');
      require(Escrow(_escrow).beneficiary() != msg.sender, 'Beneficiary not allowed to vote!');
      _;
    }

    function voteYes(address payable _escrow) external canVote(_escrow) {
      ballots[_escrow].votes[msg.sender] = Vote.YES;
      ballots[_escrow].yesVotes += 1;

      emit MemberVoted(msg.sender, _escrow, Vote.YES);

      if ( ballots[_escrow].yesVotes == 3 ) {
          Escrow(_escrow).approve();
      }
    }

    function voteNo(address payable _escrow) external canVote(_escrow) {
      ballots[_escrow].votes[msg.sender] = Vote.NO;
      ballots[_escrow].noVotes += 1;

      emit MemberVoted(msg.sender, _escrow, Vote.NO);

      if ( ballots[_escrow].noVotes == 3 ) {
          Escrow(_escrow).deny();
      }
    }

    function getVotes(address _escrow) external view returns(uint _yes, uint _no) {
      return (ballots[_escrow].yesVotes, ballots[_escrow].noVotes);
    }

    function getYesVotes(address _escrow) external view returns(uint) {
      return ballots[_escrow].yesVotes;
    }

    function getNoVotes(address _escrow) external view returns(uint) {
      return ballots[_escrow].noVotes;
    }

    function getVote(address _escrow, address _member) external view returns(Vote) {
      return ballots[_escrow].votes[_member];
    }
}
