import "../styles/globals.css";
import "tailwindcss/tailwind.css";
import Link from "next/link";
import { useEffect, useState } from "react";

function MyApp({ Component, pageProps }) {
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
      alert("You are not connected to the Rinkeby Test Network!");
    }
  }
  
  // runs when page loads
  useEffect(() => {
    walletConnected();
  }, []);

  return (
      <div>
        <div className="navbar bg-base-100">
          <div className="navbar-start">
            <div className="dropdown">
              <label  className="btn btn-ghost lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6h16M4 12h8m-8 6h16" /></svg>
              </label>
              <ul className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                <li><a>Home</a></li>
                <li>
                  <a className="justify-between">
                    SDSAF
                    <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/></svg>
                  </a>
                  <ul className="p-2">
                    <li><a>Submenu 1</a></li>
                    <li><a>Submenu 2</a></li>
                  </ul>
                </li>
                <li><a>Item 3</a></li>
              </ul>
            </div>
            <Link href="/">
              <a className="btn btn-ghost normal-case text-xl">MARKETPLACE</a>
            </Link>
            
          </div>
          <div className="hidden navbar-end lg:flex">
            <ul className="menu menu-horizontal space-x-12 pr-12 p-0">
              <Link href="/">
                <li><a>Marketplace</a></li>
              </Link>
              <Link href="/create-nft">
                <li><a>Create NFT</a></li>
              </Link>
              <div className="navbar-end">
          </div>
          {currentAccount === "" ? <a className="btn btn-primary" onClick={connectWallet}>Connect Wallet</a> : <div className="dropdown dropdown-end">
                <Link href="/my-nfts">
                  <a className="btn btn-primary mr-6">My account</a>
                </Link>
                <ul  className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52">
                  <li>
                    <Link href="/my-nfts">
                      <a className="justify-between w-full">
                        NFTs owned
                        <span className="badge">8</span>
                      </a>
                    </Link> 
                  </li>
                  <li classNameName="w-full">
                    <Link href="/minted-nfts" classNameName="w-full">
                      <a>NFTs minted</a>
                    </Link>
                  </li>
                  <li classNameName="w-full">
                    <Link href="/" classNameName="w-full">
                      <a onClick={connectWallet}>Change Wallet</a>
                    </Link>
                  </li>
                </ul>
              </div>}
            </ul>
          </div>
        </div>

        <Component {...pageProps} />
      </div>
  );
}

export default MyApp;
