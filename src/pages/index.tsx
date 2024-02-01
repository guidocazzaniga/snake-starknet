import { useAccount, useContractRead } from '@starknet-react/core'

import type { NextPage } from 'next'
import { useMemo } from 'react'
import { ConnectWallet } from '~/components/ConnectWallet'
import Game from '~/components/Game'
import { SendMoves } from '~/components/SendMoves'
import { useGameContract } from '~/hooks/gameContract'
import React, { useState } from 'react';

class InitState {
  snakeDots: number[][];
  food: number[][];

  constructor(snakeDots: number[][], food: number[][]) {
    this.snakeDots = snakeDots;
    this.food = food;
  }
}

const Home: NextPage = () => {
  const { account } = useAccount()
  const { contract: gameContract } = useGameContract()

  const [lastTx, setLastTx] = useState('');

  const { data: contractInitState, isLoading, error } = useContractRead({
    functionName: "showInitState",
    args: [],
    abi: gameContract?.abi,
    address: gameContract?.address,
    watch: true,
  });

  const [moves, setMoves] = useState<Array<number>>([]);

  const setMovesCallback = (move: number) => {
    if (move == undefined)
      setMoves([]);
    else
      setMoves(list => [...list, move]);
  }

  const getTxLink = () => {
    if (lastTx != '') {
      const link = `https://testnet.starkscan.co/tx/${lastTx}`
      return <a className='ext-blue-600 dark:text-blue-500 hover:underline' target='_blank' rel="noreferrer" href={link}>{lastTx.slice(0, 15)}...</a>
    } else {
      return '-'
    }
  }

  const initState = useMemo(() => {
    if (contractInitState) {
      let snakeDots = [[Number((contractInitState as any).body_pos.x), Number((contractInitState as any).body_pos.y)]];
      let food = (contractInitState as any).food_pos.map((num: any) => [Number(num.x), Number(num.y)])
      let initState = new InitState(snakeDots, food);
      return initState
    }
  }, [contractInitState])

  console.log(initState?.food[0])
  if (initState && account)
    return (
      <div>
        <h2>Wallet</h2>
        <ConnectWallet />
        <h2>Counter Contract</h2>
        <p>{moves.length} moves:</p>
        <p id="movesText">{moves.join(",")}</p>
        <p>Address: {gameContract?.address}</p>
        <SendMoves moves={moves} setLastTx={setLastTx} />

        <Game snakeDots={initState.snakeDots}
          food={initState.food} callback={setMovesCallback} />

        <h2>Recent Transactions</h2>
        <p>Last Tx: {getTxLink()}</p>
      </div>
    )
  else {
    if (!account)
      return (
        <div>
          <ConnectWallet />
        </div>
      )
    else
      return (
        <div>
          <h2>Loading</h2>
        </div>
      )
  }

}

export default Home


