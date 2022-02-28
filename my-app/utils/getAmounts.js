import { Contract } from "ethers";
import { zeroPad } from "ethers/lib/utils";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

//function that gets eth balance of the contract or user
export const getEtherBalance = async (provider, address, contract = false) => {
    try{ // if caller sets contract=false, get eth balance of user, if contract=true, get eth balance of exchange contract
        if(contract){
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS); // get contracts balance
            return balance;
        } else {
            const balance = await provider.getBalance(address); // get users balance
            return balance;
        }

    } catch(err){
        console.error(err)
        return 0;
    }
};

//function that gets PU balance of given address
export const getCDTokensBalance = async (provider, address) => {
    try {
        const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
        const balanceOfCryptoDevTokens = await tokenContract.balanceOf(address);
        return balanceOfCryptoDevTokens;
    } catch(err){
        console.error(err)
        console.log("Hiii")
    }
};

//function that gets LP balance of given address
export const getLPTokensBalance = async(provider, address) => {
    try {
        const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, provider);
        const balanceOfLPTokens = await exchangeContract.balanceOf(address);
        return balanceOfLPTokens;
    } catch(err){
        console.error(err)
    }
};

//function that gets amount of PU in contract
export const getReserveOfCDTokens = async (provider) => {
    try{
        const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, provider);
        const reserve = await exchangeContract.getReserve();
        console.log(reserve);
        return reserve;
    } catch(err){
        console.error(err);
        console.log("helllooooo");
        return 0;
    }
};