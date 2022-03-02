// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "hardhat/console.sol";
import "./Escrow.sol";

contract EscrowDAO {
    address[] public members;
    address payable[] public escrows;
    mapping(address => uint) fees;
    mapping(address => uint) public balances;
    mapping(address => uint) public attempts;
    mapping(address => uint) public wins;
    uint public volume;

    enum Vote { PENDING, YES, NO }
    struct Ballot {
      address[] yesVotes;
      address[] noVotes;
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
      escrows.push(escrowAddress);
      escrowAddress.transfer((msg.value / 10) * 9);
      fees[escrowAddress] = msg.value / 10;
      volume += msg.value;
      emit EscrowCreated(escrowAddress);
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
      ballots[_escrow].yesVotes.push(msg.sender);
      attempts[msg.sender] += 1;

      emit MemberVoted(msg.sender, _escrow, Vote.YES);

      if ( ballots[_escrow].yesVotes.length == 3 ) {
          Escrow(_escrow).approve();
          distributeRewards(_escrow, ballots[_escrow].yesVotes);
      }
    }

    function voteNo(address payable _escrow) external canVote(_escrow) {
      ballots[_escrow].votes[msg.sender] = Vote.NO;
      ballots[_escrow].noVotes.push(msg.sender);
      attempts[msg.sender] += 1;

      emit MemberVoted(msg.sender, _escrow, Vote.NO);

      if ( ballots[_escrow].noVotes.length == 3 ) {
          Escrow(_escrow).deny();
          distributeRewards(_escrow, ballots[_escrow].noVotes);
      }
    }

    function distributeRewards(address _escrow, address[] memory _members) private {
      for(uint i = 0; i < _members.length; i++) {
        balances[_members[i]] += fees[_escrow] / 6;
        wins[_members[i]] += 1;
      }
    }

    function withdraw() external {
      require(balances[msg.sender] > 0);
      uint amount = balances[msg.sender];
      balances[msg.sender] = 0;
      payable(msg.sender).transfer(amount);
    }

    function getVotes(address _escrow) external view returns(uint _yes, uint _no) {
      return (ballots[_escrow].yesVotes.length, ballots[_escrow].noVotes.length);
    }

    function getYesVotes(address _escrow) external view returns(uint) {
      return ballots[_escrow].yesVotes.length;
    }

    function getNoVotes(address _escrow) external view returns(uint) {
      return ballots[_escrow].noVotes.length;
    }

    function getVote(address _escrow, address _member) external view returns(Vote) {
      return ballots[_escrow].votes[_member];
    }
}
