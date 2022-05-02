import { useRouter, useContext } from 'next/router';
import { abi, MARKET_PLACE_ADDRESS } from "../constants";
import { ethers } from "ethers";

const Asset = () => {
  const { query } = useRouter();
  let nft;
  if (typeof query.NFT !== 'undefined') {
    nft = JSON.parse(query.NFT);
  }
  
  
  async function buyNft() {
    const {ethereum} = window;
    try{
      if(ethereum){
        connectWallet();
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          MARKET_PLACE_ADDRESS,
          abi,
          signer
        );

        // pop wallet to pay gas:
        /* user will be prompted to pay the asking price to complete the transaction */

        // parseUnits("1.0", "ether") === { BigNumber: "1000000000000000000" }
        const price = ethers.utils.parseUnits(nft.price.toString(), "ether");
        const transaction = await contract.buyToken(nft.tokenId, {
          value: price,
        });
        await transaction.wait();      
      }


    } catch(e){
      console.log(e)
    }
  }

  // Function to connect site to the metamask wallet
  const connectWallet = async () => {

    const {ethereum} = window;
    try{
      if(!ethereum){
        alert("Get metamask!");
        return;
      }
      // Connect to metamask wallet
      const accounts = await ethereum.request({method: "eth_requestAccounts"});
      console.log(`connected: ${accounts[0]}`)

      setCurrentAccount(accounts[0]);

    } catch (e){
      console.log(e)
    }
  }

    // Get user's current chain ID 
    const chainID = async () => {

      const {ethereum} = window;
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);
      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x61"; 
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the BSC Test Network!");
      }
    }

      // Is the wallet connected? metamask injects the "ethereum" object
  const walletConnected = async () =>{

    const {ethereum} = window;
    if(!ethereum){
      console.log("Please download metamask");
      return;
    
    } else{
      console.log("Ethereum object found", ethereum);
    }

    // Get chain ID, trhow alert if not connected to Rinkeby
    chainID();

    //If site already connnected to metamask, get user public key
    const accounts = await ethereum.request({method: 'eth_accounts'})

    if(accounts.length !== 0){
      const account = accounts[0];
      console.log(`User account: ${account}`);

    } else {
      console.log("Site is not authorized to access metamask")
    }

  }
  
  if (typeof query.NFT !== 'undefined') {
    return(
      <div className='pt-28 flex flex-row align-middle self-center justify-center'>
        <div className="w-[350px] h-[350px] shadow-md">
              <img src={nft.image} alt="rover" className="object-cover w-full h-full" />
        </div>
        <div className="p-6">
            <span className="text-2xl font-sans font-bold text-center">Title: {nft.name}</span>
            <h4 className="font-sans text-lg">Description: {nft.description}</h4>
            <h5 className="font-sans text-xl">Created by: {nft.creator} ({nft.author})</h5>
            <h5 className="font-sans text-xl">Creator Social: {nft.authorSocial}</h5>
            <h5 className="font-sans text-xl">Owner: {nft.owner}</h5>
            <h5 className="font-sans text-xl">Token Id: {nft.tokenId}</h5>
            <h5 className="font-sans text-xl">Smart Contract: {MARKET_PLACE_ADDRESS}</h5>
            <h3 className="font-sans text-2xl">Price: {nft.price} BNB ({nft.marketStatus})</h3>
            <button
              onClick={buyNft}
              className="mt-4 w-full bg-blue-500 text-white font-bold py-2 px-12 rounded"
            >
              Buy
            </button>
        </div>
      </div>
      
      );
  } else{
    return(
      <h5>NO DATA</h5>
    );
  }
}

export default Asset