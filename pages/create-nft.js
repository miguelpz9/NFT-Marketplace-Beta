import { useState, useEffect, useRef } from "react";
import { providers, ethers, BigNumber } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import dynamic from 'next/dynamic';
import Web3Modal from "web3modal";
import { abi, MARKET_PLACE_ADDRESS } from "../constants";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const Model = dynamic(
  () => import('../components/Model'),
  { ssr: false }
)

export default function CreateNft() {
  const [localFile, setLocalFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileUrlShow, setFileUrlShow] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [isOnRightChain, setOnRightChain] = useState(false);
  const [isReceipt, setReceipt] = useState("");
  const [isTokenid, setTokenid] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  //const [walletConnected, setWalletConnected] = useState(false);
  const [formInput, updateFormInput] = useState({
    name: "",
    description: "",
    author: "",
    authorsocial: "",
    artworktype: "png",
    royalties: ""
  });
 
  // Is the wallet connected? metamask injects the "ethereum" object
  const walletConnected = async () => {

    const { ethereum } = window;
    if (!ethereum) {
      console.log("Please download metamask");
      return;

    } else {
      console.log("Ethereum object found", ethereum);
    }

    // Get chain ID, trhow alert if not connected to Rinkeby
    chainID();

    //If site already connnected to metamask, get user public key
    const accounts = await ethereum.request({ method: 'eth_accounts' })

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log(`User account: ${account}`);

    } else {
      console.log("Site is not authorized to access metamask")
    }

  }


  // Function to connect site to the metamask wallet
  const connectWallet = async () => {

    const { ethereum } = window;
    try {
      if (!ethereum) {
        alert("Get metamask!");
        return;
      }
      // Connect to metamask wallet
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log(`connected: ${accounts[0]}`)

      setCurrentAccount(accounts[0]);

    } catch (e) {
      console.log(e)
    }
  }



  // Get user's current chain ID 
  const chainID = async () => {

    const { ethereum } = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);
    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x61";
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the binance smart chain testnet Network!");
      setOnRightChain(false);
      return;
    }else{
      setOnRightChain(true);
    }
  }

  // Mint an NFT and get tx hash
  const mintNFT = async () => {

    const { ethereum } = window;
    try {
      if (ethereum) {
        const url = await uploadToIPFS();

        chainID();
        if(!isOnRightChain){
          return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(MARKET_PLACE_ADDRESS, abi, signer);

        let tx = await contract.createToken(url, 0, formInput.royalties);
        setLoading(true)

        await tx.wait();

        console.log(`Transaction mined at https://rinkeby.etherscan.io/tx/${tx.hash}`);
        const hash = tx.hash;

        setReceipt(hash);
        setLoading(false);
      }

      setLoading(false)

    } catch (e) {
      setLoading(false)
      console.log(e)
    }
  }

  // const mint = async () => {
  //   try {
  //     const url = await uploadToIPFS();
  //     // We need a Signer here since this is a 'write' transaction.
  //     await provider.send("eth_requestAccounts", []);
  //     const signer = provider.getSigner();
  //     let userAddress = await signer.getAddress();
  //     // Create a new instance of the Contract with a Signer, which allows
  //     // update methods
  //     const minterContract = new ethers.Contract(
  //       ADDRESS,
  //       abi,
  //       signer
  //     );
  //     // call the addAddressToWhitelist from the contract
  //     const tx = await minterContract.safeMint(url, {
  //       gasPrice: 20e9
  //     });
  //     await tx.wait();
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  async function onChange(e) {
    /* upload image to IPFS */
    const file = e.target.files[0];
    console.log(file);
    const artworktype = formInput.artworktype;
    console.log(artworktype);
    try{
      if(file.name.split('.').pop() != artworktype){
        alert("You must select a ." + artworktype + " extension file");
        document.getElementById('file').value = '';
        return;
      }
    }catch (error){
      console.log("Error uploading file: ", error);
    }
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      // set fileURL
      setLocalFile(file);
      console.log(url);
      setFileUrlShow(`https://ipfs.infura.io/ipfs/${added.path}`)
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function onChangePreview(e) {
    /* upload image to IPFS */
    const file = e.target.files[0];
    console.log(file);
    const artworktype = formInput.artworktype;
    console.log(artworktype);
    try{
      if(file.name.split('.').pop() != "png" && file.name.split('.').pop() != "jpg" && file.name.split('.').pop() != "jpeg"){
        alert("You must select a .png, .jpg, .jpeg extension file");
        document.getElementById('file').value = '';
        return;
      }
    }catch (error){
      console.log("Error uploading file: ", error);
    }
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `ipfs://${added.path}`;
      // set fileURL
      console.log(url);
      setFileUrlShow(`https://ipfs.infura.io/ipfs/${added.path}`)
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function uploadToIPFS() {
    const { name, description, author, authorsocial, artworktype, royalties } = formInput;
    // destructing. getting value of name, desc and price from formInput.
    if (!name || !description || !author || !authorsocial || !artworktype|| !fileUrl || !fileUrlShow){
      alert("You need to cover all the fields!");
      return;
    };
    // if any of the valuable is empty return

    /* first, upload metadata to IPFS */
    let data;
    if(artworktype === "glb"){
      data = JSON.stringify({
        name,
        description,
        author,
        authorsocial,
        artworktype,
        royalties,
        file: fileUrl,
        image: fileUrlShow,
      });
    } else{
      data = JSON.stringify({
        name,
        description,
        author,
        authorsocial,
        artworktype,
        royalties,
        image: fileUrlShow,
      }); 
    }
    
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after metadata is uploaded to IPFS, return the URL to use it in the transaction */
      console.log(url);
      return url;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  // async function mintNft2() {
  //   const url = await uploadToIPFS();
  //   const web3Modal = new Web3Modal();
  //   const connection = await web3Modal.connect();
  //   const provider = new ethers.providers.Web3Provider(connection);
  //   const signer = provider.getSigner();
  //   console.log(url);
  //   /* create the NFT */
  //   let contract = new ethers.Contract(ADDRESS, abi, signer);

  //   // send transcation to mint NFT and place in marketplace. Seller send metadata of NFT. Spend Gasfee along with listingPrice.
  //   let transaction = await contract.safeMint(url);
  //   await transaction.wait();
  // }

  // useEffect(() => {
  //   // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
  //   if (!walletConnected) {
  //     // Assign the Web3Modal class to the reference object by setting it's `current` value
  //     // The `current` value is persisted throughout as long as this page is open
  //     web3ModalRef.current = new Web3Modal({
  //       network: "bsctestnet",
  //       providerOptions: {},
  //       disableInjectedProvider: false,
  //     });
  //     connectWallet();
  //   }
  // }, [walletConnected]);

  // runs when page loads
  useEffect(() => {
    walletConnected();
  }, []);

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12" style={{ marginTop: "60px" }}>
        <input
          placeholder="NFT Name"
          className="mt-8 border rounded p-4 input"
          onChange={
            (e) => updateFormInput({ ...formInput, name: e.target.value })
            // (...formInput) is spread operator means all the other things in forms will same only name will change
          }
        />
        <textarea
          placeholder="NFT Description"
          className="mt-2 border rounded p-4 input"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        />
        <input
          placeholder="NFT Author"
          className="mt-8 border rounded p-4 input"
          onChange={
            (e) => updateFormInput({ ...formInput, author: e.target.value })
            // (...formInput) is spread operator means all the other things in forms will same only name will change
          }
        />
        <textarea
          placeholder="NFT Social"
          className="mt-2 border rounded p-4 input"
          onChange={(e) =>
            updateFormInput({ ...formInput, authorsocial: e.target.value })
          }
        />

        <input
          placeholder="NFT Royalties (no decimals allowed)"
          className="mt-8 border rounded p-4 input"
          onChange={
            (e) => updateFormInput({ ...formInput, royalties: e.target.value })
            // (...formInput) is spread operator means all the other things in forms will same only name will change
          }
        />

        <select
         name="cars"
          id="cars"
          onChange={(e) =>
            updateFormInput({ ...formInput, artworktype: e.target.value })
          }
        >
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
          <option value="svg">SVG</option>
          <option value="gif">GIF</option>
          <option value="webp">WEBP</option>
          <option value="mp4">MP4</option>
          <option value="mov">MOV</option>
          <option value="webm">WEBM</option>
          <option value="glb">GLB</option>
        </select>

        <input
          type="file"
          name="Asset"
          id="file"
          className="my-4 input"
          style={{ border: "none" }}
          accept=".gif,.jpg,.svg,.png,.webp,.mp4,.mov,.webm,.glb"
          onChange={onChange}
        />
        {formInput.artworktype === "glb" ? <div><h3>Select image to display:</h3><input
          type="file"
          name="Asset"
          id="file"
          className="my-4 input"
          style={{ border: "none" }}
          accept=".gif,.jpg,.svg,.png,.webp,.mp4,.mov,.webm,.glb"
          onChange={onChangePreview}
        />
        {fileUrl !== null ? <Model file={localFile} /> : <img className="rounded mt-4" width="350" src={fileUrlShow} />}</ div> : <img className="rounded mt-4" width="350" src={fileUrlShow} />}
        
        
        {currentAccount !== "" ? <button
          onClick={mintNFT}
          className="font-bold mt-4 text-black rounded p-4 shadow-lg"
        >
          Create NFT
        </button> :
        <button
        onClick={connectWallet}
        className="font-bold mt-4 text-black rounded p-4 shadow-lg"
      >
        Connect Wallet
      </button>}
      </div>
    </div>
  );
}
