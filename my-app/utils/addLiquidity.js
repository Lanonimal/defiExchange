import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

//function that calls addliquidity from contract
export const addLiquidity = async(signer, addCDAmountWei, addEtherAmountWei) => {
    try {
        const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI); //contract instance
        const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);
        //Our custom token is an ERC20 token so we need the user to allow us to take the required amount out of their wallet
        let tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, addCDAmountWei.toString());
        await tx.wait();
        tx = await exchangeContract.addLiquidity(addCDAmountWei, {value: addEtherAmountWei}); //add liq after approval
        await tx.wait()
    } catch(err){
        console.error(err)
    }
};

//function that calculates amount of CD that can be added to liq given an amount of Eth
export const calculateCd = async(_addEther = "0", etherBalanceContract, cdTokenReserve) => {
    const _addEtherAmountWei = utils.parseEther(_addEther); //_addEther is a string but for calculations we need BigNumber. 
    const cryptoDevTokenAmount = _addEtherAmountWei.mul(cdTokenReserve).div(etherBalanceContract); //need to maintain our ratio to avoid large price impact
    return cryptoDevTokenAmount;
}