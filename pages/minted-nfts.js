import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { useRouter } from "next/router";
import { abi, MARKET_PLACE_ADDRESS } from "../constants";

export default function MyAssets() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [formInput, updateFormInput] = useState({ price: "", image: "" });
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const router = useRouter();
  const { image, price } = formInput;
  useEffect(() => {
    loadNFTs();
  }, []);

  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const marketplaceContract = new ethers.Contract(
      MARKET_PLACE_ADDRESS,
      abi,
      signer
    );

    // fetch all the NFTs user Owned
    const data = await marketplaceContract.fetchItemsCreated();

    const items = await Promise.all(
      data.map(async (i) => {
        // tokenURI of a particular NFT
        const tokenURI = await marketplaceContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenURI);
        // returns the price, value in ETHER. i.e 0.01 ether
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          creator: i.creator,
          owner: i.owner,
          author: meta.data.author,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
          currency: i.isBusd ? "BUSD" : "BNB",
          tokenURI,
        };
        return item;
      })
    );
    setNfts(items);
    setLoadingState("loaded");
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
      global.updateAccount({
        account: accounts[0]
      })

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

  async function listNFTForSale(nft) {
    // if user do not put price of NFT it will not be listed
    if (!price){
      alert("Input a listing price");
      return;
    };
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const priceFormatted = ethers.utils.parseUnits(formInput.price, "ether");
    let contract = new ethers.Contract(MARKET_PLACE_ADDRESS, abi, signer);

    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();
    // send transcation to place NFT in marketplace. Seller send metadata of NFT. Spend Gasfee along with listingPrice.
    let transaction = await contract.resellToken(nft.id, priceFormatted, {
      value: listingPrice,
    });
    await transaction.wait();

    router.push("/");
  }

  function listNFT(nft) {
    router.push(`/resell-nft?id=${nft.tokenId}&tokenURI=${nft.tokenURI}`);
  }

  if (loadingState === "loaded" && !nfts.length)
    return <h1 className="py-40 px-20 text-3xl">No NFTs minted</h1>;
  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {nfts.map((nft, i) => (
              <div key={i} className="shadow-lg overflow-hidden rounded-2xl">
                <div className="w-[350px] h-[350px] shadow-md">
                  <img src={nft.image} alt="rover" className="object-cover w-full h-full" />
                </div>
                <div className="p-4">
                  <span className="text-2xl font-sans font-bold text-center">{nft.name}</span>
                  <h4 className="font-sans text-lg">{nft.description}</h4>
                  <h5 className="font-sans text-xl">Created By: {nft.creator} ({nft.author})</h5>
                  <h3 className="font-sans text-2xl">Price bought: {nft.price} {nft.currency} ({nft.marketStatus})</h3>
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}
