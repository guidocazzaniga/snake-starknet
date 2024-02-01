import { useContract } from '@starknet-react/core'
import { Abi } from 'starknet'

import Erc20Abi from '~/abi/erc20.json'

export function useTokenContract() {
  return useContract({
    abi: Erc20Abi as Abi,
    address: '0x03c3ccc6b427855b2054b15b700e35e789d22d0de19ab7485a88f19ddde185af',
  })
}
