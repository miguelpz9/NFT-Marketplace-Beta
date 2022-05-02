import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import Link from "next/link";
import { abi, MARKET_PLACE_ADDRESS } from "../constants";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  
  useEffect(() => {
    loadNFTs();
  }, []);

  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isReceipt, setReceipt] = useState("");
  const [isTokenid, setTokenid] = useState("");
  
 
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

      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      eventListener();

    } else {
      console.log("Site is not authorized to access metamask")
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

      eventListener()

    } catch (e){
      console.log(e)
    }
  }


  // function that listens for smart contract events
  const eventListener = async () => {

    const {ethereum} = window;
    try{
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, NFT.abi, signer);

        // webhook, listening for smart contract events
        const event_name = "nftMinted";
        contract.on(event_name, (from, tokenId) => {
          console.log(`From: ${from} , TokenID: ${tokenId}`)

          var id = tokenId.toNumber();
          setTokenid(id)
          // alert(`It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${contractAddress}/${tokenId.toNumber()}`)
          
        })

      }
      console.log("Setup event listener!")

    } catch(e){
      console.log(e);
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
      alert("You are not connected to the Rinkeby Test Network!");
    }
  }


  // Mint an NFT and get tx hash
  const mintNFT = async () => {

    const {ethereum} = window;
    try{
      if(ethereum){
        chainID();
        const provider = new ethers.providers.JsonRpcProvider(
          "https://eth-rinkeby.alchemyapi.io/v2/PI7sH4fVdxLAz4ON5PKEa_-RSnuEc375"
        );
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, NFT.abi, signer);

        // pop wallet to pay gas:
        let tx = await contract.mintNFT();
        setLoading(true)
        
        await tx.wait();
        
        console.log(`Transaction mined at https://rinkeby.etherscan.io/tx/${tx.hash}`);
        const hash = tx.hash;

        setReceipt(hash)
        setLoading(false)
      
      }

      setLoading(false)

    } catch(e){
      setLoading(false)
      console.log(e)
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect Wallet
    </button>
  );

  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider(
      "https://speedy-nodes-nyc.moralis.io/10070b5bc12fd91e099c78ba/bsc/testnet"
    );
    //const provider = new ethers.providers.Web3Provider(ethereum);
    const contract = new ethers.Contract(MARKET_PLACE_ADDRESS, abi, provider);
    const data = await contract.fetchMarketItems();

    /*
     *  map over items returned from smart contract and format
     *  them as well as fetch their token metadata
     */
    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await contract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        // returns the price, value in ETHER. i.e 0.01 ether
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          creator: i.creator,
          author: meta.data.author,
          authorSocial: meta.data.authorsocial,
          owner: i.owner,
          isListed: i.listed,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
          tokenUri,
        };
        return item;
      })
    );
    setNfts(items);
    setLoadingState("loaded");
  }

  if (loadingState === "loaded" && !nfts.length)
    return <h1 className="px-20 py-40 text-3xl">No items in marketplace</h1>;
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div
          className="grid grid-cols-1 space-x-20 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4"
          style={{ marginTop: "60px" }}
        >
          {nfts.map((nft, i) => (
            <Link key="1" href={{ pathname: '/asset', query: { NFT: JSON.stringify(nft) } }} NFT={nft}>
              <div key={i} className="shadow-lg rounded-2xl">
                <div className="w-[350px] h-[350px] shadow-md">
                  <img src={nft.image} alt="rover" className="object-cover w-full h-full" />
                </div>
                <div className="p-4">
                  <span className="text-2xl font-sans font-bold text-center">{nft.name}</span>
                  <h4 className="font-sans text-lg">{nft.description}</h4>
                  <h5 className="font-sans text-xl">By {nft.author}</h5>
                  <h3 className="font-sans text-2xl">Price: {nft.price} BNB ({nft.marketStatus})</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
