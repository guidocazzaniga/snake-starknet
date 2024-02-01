import { useAccount, useConnect } from '@starknet-react/core'

export function ConnectWallet() {
  const { account } = useAccount();
  const { connect, connectors } = useConnect();

  if (account) {
    return <p>Account: {account.address}</p>
  }

  return <div>
    <p>Please connect your wallet</p>
    <button
      className="ml-2 rounded-md w-32 px-2 py-1 bg-slate-700 text-white"
      onClick={() => connect({ connector: connectors.at(0) })}>Connect</button>
  </div>
}
