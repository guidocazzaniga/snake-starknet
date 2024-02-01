import { useAccount, useContractWrite, useWaitForTransaction } from '@starknet-react/core'
import React, { useEffect, useMemo } from 'react'
import { useGameContract } from '~/hooks/gameContract'

interface SnakeProps {
  moves: number[],
  setLastTx: (s: string) => void
}

export function SendMoves(props: SnakeProps) {
  const { account } = useAccount()
  const { contract: counter } = useGameContract()

  const calls = useMemo(() => {
    if (!account || !counter) return [];
    return counter.populateTransaction["validateGame"]!(props.moves);
  }, [account, counter, props.moves]);
  const { writeAsync, data } = useContractWrite({ calls });

  useEffect(() => {
    if (data) {
      props.setLastTx(data.transaction_hash);
    }
  }, [data])

  if (!account) {
    return null
  }

  return (
    <button
      className="ml-2 rounded-md w-32 px-2 py-1 bg-slate-700 text-white"
      onClick={
        () => writeAsync()
      }
    >Send moves to contract</button>

  )
}
