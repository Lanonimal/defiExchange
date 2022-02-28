import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

//function that calculates how many tokens the user can receive given _swapAmountWei amount
export const getAmountOfTokensReceivedFromSwap = async(provider, _swapAmountWei, ethSelected, ethBalance, reservedCD) => {
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, provider);
    let amountOfTokens;
    if (ethSelected){ //means user wants to send eth to receive PU. input amount = _swapAmountWei, input reserve = ethBalance and output reserve = reserveCD
        amountOfTokens = await exchangeContract.getAmountOfTokens(_swapAmountWei, ethBalance, reservedCD);
    } else { //eth not selected, input amount = _swapAmountWei, input reserve = reserveCD, output reserve = ethBalance
        amountOfTokens = await exchangeContract.getAmountOfTokens(_swapAmountWei, reservedCD, ethBalance);
    }
    return amountOfTokens;
}

//function that swaps swapAmountWei amount with tokenToBeReceivedAfterSwap amount
export const swapTokens = async(provider, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected) => {
    const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, provider);
    let tx;
    if (ethSelected){ //eth selected so call ethToCryptoDevToken function from exchange contract. 
        //swapAmount must be passed as a {value:} because it is eth that's being paid to the contract instead of a value being passed to a function
        tx = await exchangeContract.ethToProfitUnityToken(tokenToBeReceivedAfterSwap, {value: swapAmountWei,}); 
    } else { //we must ask user to approve swapAmountWei amount of our token first because it's an ERC20 token
        tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, swapAmountWei.toString());
        await tx.wait();
        tx = await exchangeContract.profitUnityTokenToEth(swapAmountWei, tokenToBeReceivedAfterSwap); //takes swapAmountWei amount of PU and sends back tokenToBeReceivedAfterSwap amount of eth
    }
    await tx.wait()
}
