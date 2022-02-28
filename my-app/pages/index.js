import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateCD } from "../utils/addLiquidity";
import {
  getCDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfCDTokens,
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home(){
  //general state variables
  const [loading, setLoading] = useState(false); //true when we wait for tx to be mined
  const [liquidityTab, setLiquidityTab] = useState(true); //two tabs in this dapp, swap and liq. true = on liq tab, false = on swap tab
  const zero = BigNumber.from(0); //number '0' in the form of a BigNumber

  //variables to keep track of amounts
  const [ethBalance, setEtherBalance] = useState(zero); //amount of eth user holds
  const [reservedCD, setReservedCD] = useState(zero); //amount of PU in contract
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero) //amount of eth in contract
  const [cdBalance, setCDBalance] = useState(zero); //amount of pu user holds
  const [lpBalance, setLPBalance] = useState(zero); //amount of LP user holds

  //variables to keep track of liq to add or rem
  const [addEther, setAddEther] = useState(zero); //amount of eth user wants to add to liq
  const [addCDTokens, setAddCDTokens] = useState(zero); //amount of cd user wants to add to liq
  const [removeEther, setRemoveEther] = useState(zero); //amount to send back to user given amount of LP
  const [removeCD, setRemoveCD] = useState(zero);
  const [removeLPTokens, setRemoveLPTokens] = useState("0"); //amount of LP user wants to remove

  //variables to keep track of swap functionality
  const [swapAmount, setSwapAmount] = useState(""); //amount user wants to swap
  const [tokenToBeRecievedAfterSwap, setTokenToBeRecievedAfterSwap] = useState(zero); //amount user receives after swap
  const [ethSelected, setEthSelected] = useState(true); //user wants to send eth or PU

  //variables for wallet connection
  const web3ModalRef = useRef(); //reference to web3Modal which persists as long as page is open
  const [walletConnected, setWalletConnected] = useState(false); //user connected or not


  //function that gets various amounts
  const getAmounts = async() => {
    try{
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const _ethBalance = await getEtherBalance(provider, address); //amount of eth user holds
      const _cdBalance = await getCDTokensBalance(provider, address); //amount of pu user holds
      const _lpBalance = await getLPTokensBalance(provider, address); //amount of lp user holds
      const _reservedCD = await getReserveOfCDTokens(provider); //amount of pu in contract
      console.log(_reservedCD);
      const _ethBalanceContract = await getEtherBalance(provider, null, true); //amount of eth in contract
      setEtherBalance(_ethBalance);
      setCDBalance(_cdBalance);
      setLPBalance(_lpBalance);
      setReservedCD(_reservedCD);
      setReservedCD(_reservedCD);
      setEtherBalanceContract(_ethBalanceContract);
    } catch(err){
      console.error(err)
    }
  };

  
  //swap functions
  const _swapTokens = async() => {
    try{
      const swapAmountWei = utils.parseEther(swapAmount); //convert user's input to a BigNumber
      if(!swapAmountWei.eq(zero)) { //check if user entered zero with BigNumber equals method
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await swapTokens(signer, swapAmountWei, tokenToBeRecievedAfterSwap, ethSelected);
        setLoading(false);
        await getAmounts(); //get new amounts
        setSwapAmount("");
      }
    } catch (err){
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  const _getAmountOfTokensReceivedFromSwap = async(_swapAmount) => {
    const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
    if(!_swapAmountWEI.eq(zero)){
      const provider = await getProviderOrSigner(false);
      const _ethBalance = await getEtherBalance(provider, null, true);
      const amountOfTokens = await getAmountOfTokensReceivedFromSwap(_swapAmountWEI, provider, ethSelected, _ethBalance, reservedCD);
      setTokenToBeRecievedAfterSwap(amountOfTokens);
    } else {
      setTokenToBeRecievedAfterSwap(zero);
    }
  };

  //adding liquidity functions
  const _addLiquidity = async () => {
    try{
      const addEtherWei = utils.parseEther(addEther.toString());
      if(!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await addLiquidity(signer, addCDTokens, addEtherWei);
        setLoading(false);
        setAddCDTokens(zero);
        await getAmounts();
      } else{
        setAddCDTokens(zero);
      }

    } catch(err) {
      console.error(err)
      setLoading(false);
      setAddCDTokens(zero);
    }
  };

  //removing liquidity functions
  const _removeLiquidity = async () => {
    try{
      const signer = await getProviderOrSigner(true);
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveCD(zero);
      setRemoveEther(zero);
    } catch(err){
      console.error(err);
      setLoading(false);
      setRemoveCD(zero);
      setRemoveEther(zero);
    }
  };
  
  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      const _ethBalance = await getEtherBalance(provider, null, true);
      const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
      const { _removeEther, _removeCD } = await getTokensAfterRemove(provider, removeLPTokenWei, _ethBalance, cryptoDevTokenReserve);
      setRemoveEther(_removeEther);
      setRemoveCD(_removeCD);
    } catch(err){
      console.error(err);
    }
  };

  //connect wallet
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  //get provider/signer
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect(() => {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  const renderButton = () =>{
    if (!walletConnected){
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if(liquidityTab) {
      return(
        <div>
          <div className={styles.description}>
            You have:
            <br/>
            {utils.formatEther(cdBalance)} Profit Unity Tokens
            <br/>
            {utils.formatEther(ethBalance)} Eth 
            <br/>
            {utils.formatEther(lpBalance)} LP Tokens
          </div>
          <div>
            {utils.parseEther(reservedCD.toString()).eq(zero) ? (
              <div>
                <input className={styles.input} type="number" placeholder="Amount of Eth" onChange={(e) => setAddEther(e.target.value || "0")}/>
                <input className={styles.input} type="number" placeholder="Amount of ProfitUnity tokens" onChange={(e) => setAddCDTokens(BigNumber.from(utils.parseEther(e.target.value || "0")))}/>
                <button className={styles.button1} onClick={_addLiquidity}>Add</button>
              </div>
            ) : (
              <div>
                <input className={styles.input} type="number" placeholder="Amount of Eth" onChange={async (e) => {setAddEther(e.target.value || 0); const _addCDTokens = await calculateCD(e.target.value || "0", etherBalanceContract, reservedCD); setAddCDTokens(_addCDTokens);}}/>
                <div className={styles.inputDiv}>
                  {`You'll need ${utils.formatEther(addCDTokens)} ProfitUnity Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>Add</button>
              </div>
            )}
            <div>
              <input type="number" placeholder="Amount of LP Tokens" className={styles.input} onChange={async (e) => {setRemoveLPTokens(e.target.value || "0"); await _getTokensAfterRemove(e.target.value || "0");}}/>
              <div className={styles.inputDiv}>
                {`You'll receive ${utils.formatEther(removeCD)} ProfitUnity Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>Remove</button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input type="number" placeholder="Amount" className={styles.input} value={swapAmount} onChange={async (e) => {setSwapAmount(e.target.value || "0"); await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");}}/>
          <select className={styles.select} name="dropdown" id="dropdown" onChange={async () => {setEthSelected(!ethSelected); await getAmountOfTokensReceivedFromSwap(0); setSwapAmount("");}}>
            <option value="eth">Eth</option>
            <option value="cryptoDevToken">ProfitUnity Token</option>
          </select>
          <br/>
          <div className={styles.inputDiv}>
            {ethSelected ? `You'll receive ${utils.formatEther(tokenToBeRecievedAfterSwap)} ProfitUnity Tokens` : 
            `You'll receive ${utils.formatEther(tokenToBeRecievedAfterSwap)} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>Swap</button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Profit Unity</title>
        <meta name="description" content="Exchange-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to the Profit Unity Exchange!</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; ProfitUnity Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(!liquidityTab);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodev.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Zizou (Beloved ProfitUnity Member) 
      </footer>
    </div>
  );
}