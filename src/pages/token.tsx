import { useAccount, useContractRead, useContractWrite } from '@starknet-react/core'
import type { NextPage } from 'next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { num, uint256 } from 'starknet'
import { ConnectWallet } from '~/components/ConnectWallet'
import { useTokenContract } from '~/hooks/token'

function UserBalance() {
  const { account } = useAccount()
  const { contract } = useTokenContract()

  const { data, isLoading, error } = useContractRead({
    functionName: "balanceOf",
    args: account ? [account.address] : undefined,
    abi: contract?.abi,
    address: contract?.address,
    watch: true,
  });

  const content = useMemo(() => {
    if (isLoading || !data) {
      return <div>Loading balance</div>
    }

    if (error) {
      return <div>Error: {error}</div>
    }
    const balance = uint256.uint256ToBN((data as any).balance)

    return <div>{balance.toString(10)}</div>
  }, [data, isLoading, error])

  return (
    <div>
      <h2>User balance</h2>
      {content}
    </div>
  )
}

interface MintTokenProps {
  setLastTx: (s: string) => void
}

function MintToken(props: MintTokenProps) {
  const { account } = useAccount()
  const [amount, setAmount] = useState<any>()
  const [amountError, setAmountError] = useState<string | undefined>()

  const { contract } = useTokenContract()

  const calls = useMemo(() => {
    if (!account || !contract || !amount) return [];
    return contract.populateTransaction["mint"]!(account.address, uint256.bnToUint256(amount));
  }, [account, amount, contract]);
  const { writeAsync, data, isPending, reset, isError, error } = useContractWrite({ calls });

  useEffect(() => {
    if (data) {
      props.setLastTx(data.transaction_hash);
    }
  }, [data])

  const updateAmount = useCallback(
    (newAmount: string) => {
      // soft-validate amount
      setAmount(newAmount)
      try {
        num.toBigInt(newAmount)
        setAmountError(undefined)
      } catch (err) {
        console.error(err)
        setAmountError('Please input a valid number')
      }
    },
    [setAmount]
  )

  const onMint = useCallback(() => {
    reset()
    if (account && !amountError) {
      writeAsync()
    }
  }, [account, amountError, reset, writeAsync])

  const mintButtonDisabled = useMemo(() => {
    if (isPending) return true
    return !account || !!amountError
  }, [isPending, account, amountError])

  return (
    <div>
      <h2>Mint token</h2>
      <p>
        <span>Amount: </span>
        <input type="number" onChange={(evt) => updateAmount(evt.target.value)} />
      </p>
      <button className='ml-2 rounded-md w-32 px-2 py-1 bg-slate-700 text-white' disabled={mintButtonDisabled} onClick={onMint}>
        {isPending ? 'Waiting for wallet' : 'Mint'}
      </button>
      {isError && <p>Error: {error}</p>}
    </div>
  )
}

const TokenPage: NextPage = () => {
  const { account } = useAccount()
  const [lastTx, setLastTx] = useState('')

  const getTxLink = () => {
    if (lastTx != '') {
      const link = `https://testnet.starkscan.co/tx/${lastTx}`
      return <a className='ext-blue-600 dark:text-blue-500 hover:underline' target='_blank' rel="noreferrer" href={link}>{lastTx.slice(0, 10)}...</a>
    } else {
      return '-'
    }
  }

  if (!account) {
    return (
      <div>
        <p>Connect Wallet</p>
        <ConnectWallet />
      </div>
    )
  }
  return (
    <div>
      <p>Connected: {account.address}</p>
      <UserBalance />
      <MintToken setLastTx={setLastTx} />
      <p>Last Tx: {getTxLink()} </p>
    </div>
  )
}

export default TokenPage
