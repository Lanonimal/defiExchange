// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; //need this because the Exchange will mint LP tokens

contract Exchange is ERC20 {
    address public profitUnityTokenAddress;
    
    //constructor assigns value of input param to profitUnityTokenAddress and sets name and symbol for lp token.
    constructor(address _profitUnityToken) ERC20("ProfitUnity LP Token", "PULP") { 
        require(_profitUnityToken != address(0), "Token Address passed is a null address");
        profitUnityTokenAddress = _profitUnityToken;

    }

    //function that gets the amount of ProfitUnity Tokens held by the contract, no need for Eth because we can get that by using address(this).balance
    function getReserve() public view returns (uint) {
        return ERC20(profitUnityTokenAddress).balanceOf(address(this));
    }

    //function that adds liq in form of Eth and PU Tokens. 
    function addLiquidity(uint _amount) public payable returns (uint){
        uint liquidity; //amount of lp tokens user will receive
        uint ethBalance = address(this).balance; //amount of eth in contract
        uint profitUnityTokenReserve = getReserve(); //amount of PU in contract
        ERC20 profitUnityToken = ERC20(profitUnityTokenAddress); //PU token address

        if (profitUnityTokenReserve == 0) { //means reserve is empty so user can add any ratio he wants
            profitUnityToken.transferFrom(msg.sender, address(this), _amount); //transfer _amount of PU tokens from msg.sender (user) to address(this) (contract)
            liquidity = ethBalance; //because this is the first time someone adds Eth to the contract so we mint ethBalance amount of LP tokens. Bc it is the first time, whatever Eth the contract has is supplied by the user in the current addLiquidity() call.
            _mint(msg.sender, liquidity); //amount of LP the user gets is always proportional to the added amount of eth liq. ERC20 function.
        } else { //reserve isnt empty so we must use a ratio to prevent large price impact. We take Eth amount and use ratio to determine PU token amount.
            uint ethReserve = ethBalance - msg.value; // eth in contract - what the user supplied in current addLiquidity() call
            uint profitUnityTokenAmount = (msg.value * profitUnityTokenReserve)/(ethReserve); //Ratio is deltaX / X = deltaY / Y. Rewriting it gives us deltaX.
            require(_amount >= profitUnityTokenAmount, "Amount of tokens sent is less than the minimum tokens required");
            profitUnityToken.transferFrom(msg.sender, address(this), profitUnityTokenAmount); // transfer calculated amount that fits ratio amount of PU tokens to contract.
            liquidity = (totalSupply() * msg.value)/ ethReserve; //also here we must maintain a ratio. amount of LP user receives is proportionate to amount of Eth they sent.
            _mint(msg.sender, liquidity);
        }
        return liquidity;
    }

    //function that removes liquidity (back to user)
    function removeLiquidity(uint _amount) public returns (uint , uint) {
        require(_amount > 0, "_amount should be greater than zero"); //user must have LP tokens to exchange 
        uint ethReserve = address(this).balance;
        uint _totalSupply = totalSupply();
        uint ethAmount = (ethReserve * _amount) / _totalSupply; // eth to send back to user based on given ratio
        uint profitUnityTokenAmount = (getReserve() * _amount) / _totalSupply; // PU to send back based on given ratio
        _burn(msg.sender, _amount); //Burn sent LP tokens
        payable(msg.sender).transfer(ethAmount); //transfer eth back to user
        ERC20(profitUnityTokenAddress).transfer(msg.sender, profitUnityTokenAmount); //transfer PU back to user
        return(ethAmount, profitUnityTokenAmount);
    }

    //function that gets amount of eth/PU that user will receive in a swap
    function getAmountOfTokens(uint256 inputAmount, 
        uint256 inputReserve, uint256 outputReserve) public pure returns (uint256) {
            require(inputReserve > 0 && outputReserve > 0, "Invalid reserves"); //reserves cant be empty
            uint256 inputAmountWithFee = inputAmount * 99;
            uint256 numerator = inputAmountWithFee * outputReserve;
            uint256 denominator = (inputReserve * 100) + inputAmountWithFee; 
            return numerator / denominator; //we must follow XY = K.
    }

    //function that swaps eth for PU
    function ethToProfitUnityToken(uint _minTokens) public payable {
        uint256 tokenReserve = getReserve();
        uint256 tokensBought = getAmountOfTokens //get amount of PU that we should send back. from inputReserve we must deduct msg.value (the amount of eth the user sends the contract for the swap)
            (msg.value, address(this).balance - msg.value, tokenReserve);
        require(tokensBought >= _minTokens, "insufficient output amount");
        ERC20(profitUnityTokenAddress).transfer(msg.sender, tokensBought); //send amount of PU to user if we have enough in contract
    }

    //function that swaps PU for Eth
    function profitUnityTokenToEth(uint _tokensSold, uint _minEth) public payable {
        uint256 tokenReserve = getReserve();
        uint256 ethBought = getAmountOfTokens(_tokensSold, tokenReserve, address(this).balance); //amount of Eth to send to user
        require(ethBought >= _minEth, "insufficient output amount");
        ERC20(profitUnityTokenAddress).transferFrom(msg.sender, address(this), _tokensSold); //transfer PU from user to contract
        payable(msg.sender).transfer(ethBought); //send eth to user
    }
}