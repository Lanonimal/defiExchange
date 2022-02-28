import { Contract, providers, utils, BigNumber } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
} from "../constants";

//function that removes LP tokens from liq
export const removeLiquidity = async (signer, removeLPTokenWei) => {
  const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);
  const tx = await exchangeContract.removeLiquidity(removeLPTokenWei) //call removeLiq function from exchange contract
  await tx.wait();
};

//function that calculates amount of eth and PU user will receive after removing removeLPTokenWei amount of LP
export const getTokensAfterRemove = async (provider, removeLPTokenWei, _ethBalance, cryptoDevTokenReserve) => {
  try{
    const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, provider);
    const _totalSupply = await exchangeContract.totalSupply(); //total pu supply
    //Bignumber methods of multiplication and devision. We must maintain the ratio's for both calculations.
    const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
    const _removeCD = cryptoDevTokenReserve.mul(removeLPTokenWei).div(_totalSupply);
    return {_removeEther, _removeCD};
  } catch (err){
    console.error(err)
  }
};