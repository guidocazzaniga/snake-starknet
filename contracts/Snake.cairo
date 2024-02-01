#token address: 0x03c3ccc6b427855b2054b15b700e35e789d22d0de19ab7485a88f19ddde185af
# 0x15ec365eb8e3340c7877b33f6ce7b6bef9cd0683d8a0d36501449a10fc4d1af
%lang starknet

from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.alloc import alloc
from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.bitwise import bitwise_and
from starkware.cairo.common.bool import TRUE, FALSE
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.math import unsigned_div_rem, assert_nn_le, split_felt
from starkware.cairo.common.math_cmp import is_in_range, is_le_felt, is_nn
# CONSTANTS
const FOOD_COUNT = 10
const MIN_X = 0
const MAX_X = 7
const MIN_Y = 0
const MAX_Y = 7
const MAX_MOVES = 20
const AMOUNT_TO_MINT = 1000000000000000000
const FIRST_BODY_X = 3
const FIRST_BODY_Y = 3
const TOKEN_ADDRESS = 1702887036678239944771100933622619415902447601159571064477327670162604787119

@contract_interface
namespace I_Token:
    func mint(to : felt, amount : Uint256):
    end
end

@external
func mintToken{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    amount : Uint256, address : felt
):
    I_Token.mint(TOKEN_ADDRESS, address, amount)
    return ()
end

# GAME STATE STRUCT

struct Position:
    member x : felt
    member y : felt
end

struct State:
    member head_index : felt
    member tail_index : felt
    member food_index : felt
    member body_pos : Position*
    member food_pos : Position*
    member moves_hash : felt
end

@storage_var
func solutionRegistry(solution : felt) -> (user : felt):
end

@storage_var
func initStateSeed() -> (seed : felt):
end

@external
func setSeed{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(seed : felt):
    initStateSeed.write(seed)
    return ()
end

@view
func read_seed{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (res : felt):
    let (res) = initStateSeed.read()
    return (res)
end

@external
func validateGame{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    moves_len : felt, moves : felt*) -> (isValid : felt):
    alloc_locals

    let (local initState : State) = getInitState()

    let (local finalState : State) = getFinalState(moves_len, moves, initState)

    # reward distribution
    let (discoveredBy) = solutionRegistry.read(finalState.moves_hash)
    assert discoveredBy = 0
    let (local address) = get_caller_address()
    solutionRegistry.write(finalState.moves_hash, address)
    mintToken(Uint256(AMOUNT_TO_MINT * finalState.food_index, 0), address)
    return (finalState.moves_hash)
end

@view
func D_showFinalState{
    syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr, bitwise_ptr : BitwiseBuiltin*
}(moves_len : felt, moves : felt*) -> (body_len: felt, body : Position*, food_index : felt):
    let (initState : State) = getInitState()
    let (finalState : State) = getFinalState(moves_len, moves, initState)
    return (moves_len+1, finalState.body_pos, finalState.food_index)
end

func getFinalState{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    moves_len : felt, moves : felt*, state : State
) -> (finalState : State):
    if moves_len == 0:
        return (state)
    else:
        let (isFinal) = isStateFinal(state)

        if isFinal == TRUE:
            return (state)
        else:
            let (next_state : State) = transitionFunction(state, moves[0])
            return getFinalState(moves_len - 1, &moves[1], next_state)
        end
    end
end

func transitionFunction{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    s : State, move : felt
) -> (state : State):
    let (next_pos : Position) = getNextPosition(s.body_pos[s.head_index], move)
    assert s.body_pos[s.head_index + 1] = next_pos

    let food_pos = s.food_pos[s.food_index]
    let (hasEatenFood) = arePositionsEqual(next_pos, food_pos)
    let (hash) = hash2{hash_ptr=pedersen_ptr}(s.moves_hash, move)
    if hasEatenFood == TRUE:
        return (
            State(s.head_index + 1, s.tail_index, s.food_index + 1, s.body_pos, s.food_pos, hash)
        )
    else:
        return (
            State(s.head_index + 1, s.tail_index + 1, s.food_index, s.body_pos, s.food_pos, hash)
        )
    end
end

func getNextPosition{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    prev_pos : Position, move : felt
) -> (pos : Position):
    if move == 0:
        return (Position(prev_pos.x, prev_pos.y + 1))
    end
    if move == 1:
        return (Position(prev_pos.x + 1, prev_pos.y))
    end
    if move == 2:
        return (Position(prev_pos.x, prev_pos.y - 1))
    else:
        return (Position(prev_pos.x - 1, prev_pos.y))
    end
end

func isStateFinal{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(s : State) -> (
    bool : felt
):
    alloc_locals
    let (local check_1) = hasEatenAllFood(s.food_index)
    let (local check_2) = isOutsideBoard(s)
    let (local check_3) = hasEatenItself(
        s.body_pos, s.head_index - 1, s.tail_index, s.body_pos[s.head_index]
    )
    return (check_1 * check_2 * check_3)
end

func hasEatenAllFood{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    food_index : felt
) -> (bool : felt):
    if food_index == FOOD_COUNT:
        return (TRUE)
    else:
        return (FALSE)
    end
end

func hasEatenItself{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    body : Position*, top : felt, tail : felt, head : Position
) -> (bool : felt):
    let (isLongEnoughToEatItself) = is_nn(top - tail - 4)
    if isLongEnoughToEatItself == FALSE:
        return (FALSE)
    else:
        let hasEatenTail : felt = arePositionsEqual(head, body[tail])
        if hasEatenTail == TRUE:
            return (TRUE)
        else:
            return hasEatenItself(body, top, tail + 1, head)
        end
    end
end

func isOutsideBoard{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    s : State
) -> (bool : felt):
    alloc_locals
    let head_pos : Position = s.body_pos[s.head_index]

    let (local isInBoard_X) = is_in_range(head_pos.x, MIN_X, MAX_X)
    let (local isInBoard_Y) = is_in_range(head_pos.y, MIN_Y, MAX_Y)
    let isInsideBoard = isInBoard_X * isInBoard_Y
    if isInsideBoard == TRUE:
        return (FALSE)
    else:
        return (TRUE)
    end
end

func arePositionsEqual{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
    pos1 : Position, pos2 : Position
) -> (bool : felt):
    if (pos1.x - pos2.x) * (pos1.x - pos2.x) + (pos1.y - pos2.y) * (pos1.y - pos2.y) == 0:
        return (TRUE)
    else:
        return (FALSE)
    end
end

@view
func showInitState{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, bitwise_ptr : BitwiseBuiltin*
        }() -> (body_pos : Position, food_pos_len : felt, food_pos : Position*):
    let (state : State) = getInitState()
    return (state.body_pos[0], FOOD_COUNT, state.food_pos)
end

func getInitState{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (state : State):
    alloc_locals
    let (local body_pos : Position*) = alloc()
    assert body_pos[0] = Position(FIRST_BODY_X, FIRST_BODY_Y)
    let (seed) = initStateSeed.read()
    let (_, local food_pos : Position*) = getPositionsFromSeed(seed, MAX_X, MAX_Y, FOOD_COUNT)
    return (State(0, 0, 0, body_pos, food_pos, 0))
end

@view
func getPositionsFromSeed{range_check_ptr}(
    seed : felt, maxX : felt, maxY : felt, howMany : felt
) -> (pos_len : felt, pos : Position*):
    alloc_locals
    let (local accumulator : Position*) = alloc()
    return getPositionsFromSeedHelper(seed, maxX, maxY, howMany, 0, accumulator)
end

func getPositionsFromSeedHelper{range_check_ptr}(
    seed : felt, maxX : felt, maxY : felt, howMany : felt, acc_len : felt, acc : Position*
) -> (pos_len : felt, pos : Position*):
    alloc_locals
    if acc_len == howMany:
        return (acc_len, acc)
    end
    let (_, local seed_lowerHalf) = split_felt(seed)
    let (_, local x) = unsigned_div_rem(seed_lowerHalf, maxX)
    let seedY = seed * seed
    let (_, local seed_lowerHalfY) = split_felt(seedY)
    let (_, local y) = unsigned_div_rem(seed_lowerHalfY, maxY)
    let newSeed = seedY * seedY
    assert acc[acc_len] = Position(x, y)
    return getPositionsFromSeedHelper(newSeed, maxX, maxY, howMany, acc_len + 1, acc)
end