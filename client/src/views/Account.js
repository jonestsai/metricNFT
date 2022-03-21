import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

export default function Dashboard() {
  // if (!publicKey) throw new WalletNotConnectedError();
  const { publicKey } = useWallet();
  // console.log(publicKey);

  return (
    <div></div>
  );
}