import React from "react";

import "./layout.css";
import TopNav from "./topnav/TopNav";
import AllRoutes from "../../pages/AllRoutes";

import { useSelector, useDispatch } from "react-redux";
import { connect } from "../../redux/blockchain/blockchainActions.js";

const Layout = () => {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const { account,errorMsg } = blockchain;
  console.log(errorMsg)
  const walletConnect = (e) => {
    e.preventDefault();
    if (errorMsg != "") {
      alert(errorMsg)
      return
    }
     dispatch(connect())
  };



  return (
    <div className="layout">
      {console.log("Layout.js 렌더")}
      <div className="layout__content">
        <TopNav />
        <div>
          {account ? (
            <div className="layout__wallet">{account}</div>
          ) : (
            <>
            <div className="layout__wallet">
              <button onClick={walletConnect}>지갑 연결</button>
            </div>
            {blockchain.errorMsg != "" ?
              <div>{alert(blockchain.errorMsg)}</div> :
              null
              }
            </>
            
          )}
        </div>
        <div className="layout__content-main">
          <AllRoutes />
        </div>
      </div>
    </div>
  );
};

export default Layout;