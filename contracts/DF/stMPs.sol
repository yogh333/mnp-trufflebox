// SPDX-License-Identifier: GNU
pragma solidity ^0.8.10;

import "./MPs.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Tairreux is ERC20, Ownable{

    address public parole;

    bool drone = false;

    uint origine;
    uint grow = 2;
    uint less;

    modifier onlyTree(){
        require(balanceOf(msg.sender) > 0, "you are able to speak");
        _;
    }

    event Compute(uint shares);

    constructor(address token) ERC20("stake MP swap token", "StMPs") {
        origine = block.timestamp;
        parole = token;
    }

    function bourse() public view returns(uint){
        return IERC20(parole).balanceOf(address(this));
    }


    function taire(uint amount) public {
        require(amount > 0, "You are a ZERO");
        if (drone == false) {
            drone = true;
            uint last = bourse();
            IERC20(parole).transferFrom(msg.sender, address(this), amount);
            uint substrat = bourse() - last;
            if (totalSupply() != 0){
                substrat = (substrat/bourse())*totalSupply();
            }
            _mint(msg.sender, substrat);
        }
        drone = false;
    }

    function depositAll() public {
        taire(IERC20(parole).balanceOf(msg.sender));
    }

    function terre(uint substrat) public onlyTree {
        if (drone == false){
            drone = true;
            uint amount = bourse() * substrat / totalSupply();
            _burn(msg.sender, substrat);
            IERC20(parole).transfer(msg.sender, amount);
            less+=substrat;
        }
        drone = false;
    }

    function withdrawAll() public onlyTree {
        _computeShares();
        terre(balanceOf(msg.sender));
    }

    function _computeShares() private {
        if(origine < block.timestamp + 3600){
            uint shares = bourse() * (block.timestamp - origine) / (grow * lessIsMore());
            origine = block.timestamp;
            emit Compute(shares);

            Rogue(parole).mint(address(this), bourse() * shares / lessIsMore());
        }
    }

    function lessIsMore() private view returns(uint){
        return less + bourse();
    }
}